import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';

// ZIP code to coordinates (fast path for common ZIPs; any other US ZIP is geocoded via API)
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '10001': { lat: 40.7506, lng: -73.9971 },
  '90001': { lat: 33.9731, lng: -118.2479 },
  '60601': { lat: 41.8857, lng: -87.6207 },
  '77001': { lat: 29.7499, lng: -95.3585 },
  '85001': { lat: 33.4484, lng: -112.074 },
  '90210': { lat: 34.0901, lng: -118.4065 },
  '33139': { lat: 25.7907, lng: -80.1300 },
  '98101': { lat: 47.6062, lng: -122.3321 },
  '75201': { lat: 32.7767, lng: -96.7970 },
  '19102': { lat: 39.9526, lng: -75.1652 },
  '02101': { lat: 42.3601, lng: -71.0589 },
  '80202': { lat: 39.7392, lng: -104.9903 },
  '37201': { lat: 36.1627, lng: -86.7816 },
  '30301': { lat: 33.7490, lng: -84.3880 },
  '32801': { lat: 28.5383, lng: -81.3792 },
  '94102': { lat: 37.7749, lng: -122.4194 },
  '43215': { lat: 39.9612, lng: -82.9988 },
  '48201': { lat: 42.3314, lng: -83.0458 },
  '55401': { lat: 44.9778, lng: -93.2650 },
};

// In-memory cache for geocoded ZIPs (avoids repeated API calls)
const zipGeocodeCache = new Map<string, { lat: number; lng: number }>();
const CACHE_MAX = 500;

/** Normalize store name for matching (e.g. "Walmart.com" -> "walmart", "Best Buy" -> "best buy") */
function normalizeStoreName(name: string): string {
  return name
    .replace(/\s*\.(com|net|org)$/i, '')
    .replace(/\s+(inc\.?|llc\.?|corp\.?)$/i, '')
    .trim()
    .toLowerCase();
}

@Injectable()
export class StoreLocationsService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, createDto: CreateStoreLocationDto) {
    return this.prisma.storeLocation.create({
      data: {
        ...createDto,
        storeId,
      },
      include: {
        store: true,
      },
    });
  }

  async findByStore(storeId: string) {
    return this.prisma.storeLocation.findMany({
      where: { storeId },
      include: { store: true },
      orderBy: { city: 'asc' },
    });
  }

  async findNearby(findNearbyDto: FindNearbyDto) {
    const { zipCode, radius = 10, storeName } = findNearbyDto;

    // Get coordinates for the ZIP code (in production, use a geocoding API)
    const coords = ZIP_COORDINATES[zipCode];
    if (!coords) {
      // Return all locations for unknown ZIP codes
      return this.prisma.storeLocation.findMany({
        where: {
          zipCode: {
            startsWith: zipCode.substring(0, 3),
          },
          ...(storeName && {
            store: {
              name: {
                contains: storeName,
                mode: 'insensitive',
              },
            },
          }),
        },
        include: { store: true },
        take: 20,
      });
    }

    // Find all locations and calculate distance (simplified)
    // In production, use PostGIS or similar for geo queries
    const allLocations = await this.prisma.storeLocation.findMany({
      where: storeName
        ? {
            store: {
              name: {
                contains: storeName,
                mode: 'insensitive',
              },
            },
          }
        : {},
      include: { store: true },
    });

    // Calculate distance using Haversine formula
    const locationsWithDistance = allLocations
      .map((location) => {
        if (!location.latitude || !location.longitude) {
          return { ...location, distance: Infinity };
        }

        const distance = this.calculateDistance(
          coords.lat,
          coords.lng,
          location.latitude,
          location.longitude,
        );

        return { ...location, distance };
      })
      .filter((location) => location.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return locationsWithDistance;
  }

  async findByZipCode(zipCode: string) {
    return this.prisma.storeLocation.findMany({
      where: { zipCode },
      include: { store: true },
    });
  }

  /**
   * Find nearby stores by a list of store names and ZIP code.
   * Supports any US 5-digit ZIP (geocoded via API if not in static list).
   * Returns one entry per store with the closest location and distance (miles).
   */
  async findNearbyByStoreNames(
    zipCode: string,
    storeNames: string[],
    radiusMiles: number = 50,
  ): Promise<{ storeName: string; distance: number; address?: string; city?: string; state?: string }[]> {
    if (!storeNames || storeNames.length === 0) return [];

    const zip = zipCode.trim();
    const coords = await this.getCoordsForZip(zip);
    const requestedNames = storeNames.map((n) => n.trim()).filter(Boolean);
    const requestedNormalized = new Map<string, string>(); // normalized -> original
    requestedNames.forEach((n) => requestedNormalized.set(normalizeStoreName(n), n));

    const allStores = await this.prisma.store.findMany({
      select: { id: true, name: true },
    });
    const storeIdByNormalizedName = new Map<string, { id: string; name: string }>();
    for (const s of allStores) {
      const key = normalizeStoreName(s.name);
      if (requestedNormalized.has(key)) storeIdByNormalizedName.set(key, { id: s.id, name: s.name });
    }
    const storeIds = Array.from(storeIdByNormalizedName.values()).map((x) => x.id);
    if (storeIds.length === 0) return [];

    if (!coords) {
      return requestedNames.map((storeName) => ({
        storeName,
        distance: Infinity,
      }));
    }

    const allLocations = await this.prisma.storeLocation.findMany({
      where: {
        storeId: { in: storeIds },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { store: true },
    });

    const byStoreKey = new Map<string, { distance: number; address: string; city: string; state: string }>();

    for (const loc of allLocations) {
      if (!loc.latitude || !loc.longitude) continue;
      const distance = this.calculateDistance(coords.lat, coords.lng, loc.latitude, loc.longitude);
      if (distance > radiusMiles) continue;
      const key = normalizeStoreName(loc.store.name);
      const rounded = Math.round(distance * 10) / 10;
      const existing = byStoreKey.get(key);
      if (!existing || rounded < existing.distance) {
        byStoreKey.set(key, { distance: rounded, address: loc.address, city: loc.city, state: loc.state });
      }
    }

    const out: { storeName: string; distance: number; address?: string; city?: string; state?: string }[] = [];
    requestedNames.forEach((originalName) => {
      const key = normalizeStoreName(originalName);
      const found = byStoreKey.get(key);
      if (found) {
        out.push({ storeName: originalName, distance: found.distance, address: found.address, city: found.city, state: found.state });
      }
    });
    out.sort((a, b) => a.distance - b.distance);
    return out;
  }

  /**
   * Find nearby stores by user's coordinates (lat/lng) and list of store names.
   * Used when the app gets the user's location (e.g. "Use my location") so we don't need their ZIP.
   */
  async findNearbyByStoreNamesWithCoords(
    lat: number,
    lng: number,
    storeNames: string[],
    radiusMiles: number = 50,
  ): Promise<{ storeName: string; distance: number; address?: string; city?: string; state?: string }[]> {
    if (!storeNames || storeNames.length === 0) return [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const requestedNames = storeNames.map((n) => n.trim()).filter(Boolean);
    const allStores = await this.prisma.store.findMany({ select: { id: true, name: true } });
    const storeIdByNormalizedName = new Map<string, { id: string; name: string }>();
    const requestedNormalized = new Map<string, string>();
    requestedNames.forEach((n) => requestedNormalized.set(normalizeStoreName(n), n));
    for (const s of allStores) {
      const key = normalizeStoreName(s.name);
      if (requestedNormalized.has(key)) storeIdByNormalizedName.set(key, { id: s.id, name: s.name });
    }
    const storeIds = Array.from(storeIdByNormalizedName.values()).map((x) => x.id);
    if (storeIds.length === 0) return [];

    const allLocations = await this.prisma.storeLocation.findMany({
      where: {
        storeId: { in: storeIds },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { store: true },
    });

    const byStoreKey = new Map<string, { distance: number; address: string; city: string; state: string }>();
    for (const loc of allLocations) {
      if (!loc.latitude || !loc.longitude) continue;
      const distance = this.calculateDistance(lat, lng, loc.latitude, loc.longitude);
      if (distance > radiusMiles) continue;
      const key = normalizeStoreName(loc.store.name);
      const rounded = Math.round(distance * 10) / 10;
      const existing = byStoreKey.get(key);
      if (!existing || rounded < existing.distance) {
        byStoreKey.set(key, { distance: rounded, address: loc.address, city: loc.city, state: loc.state });
      }
    }

    const out: { storeName: string; distance: number; address?: string; city?: string; state?: string }[] = [];
    requestedNames.forEach((originalName) => {
      const key = normalizeStoreName(originalName);
      const found = byStoreKey.get(key);
      if (found) out.push({ storeName: originalName, distance: found.distance, address: found.address, city: found.city, state: found.state });
    });
    out.sort((a, b) => a.distance - b.distance);
    return out;
  }

  // Haversine formula to calculate distance between two coordinates
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get coordinates for a US ZIP code. Uses static list, then cache, then Zippopotam API.
   * Supports any valid 5-digit US ZIP.
   */
  private async getCoordsForZip(zipCode: string): Promise<{ lat: number; lng: number } | null> {
    const zip = zipCode.trim();
    if (zip.length !== 5 || !/^\d{5}$/.test(zip)) return null;

    const staticCoords = ZIP_COORDINATES[zip];
    if (staticCoords) return staticCoords;

    const cached = zipGeocodeCache.get(zip);
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        places?: Array<{ latitude: string; longitude: string }>;
      };
      const place = data?.places?.[0];
      if (!place?.latitude || !place?.longitude) return null;
      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      const coords = { lat, lng };
      if (zipGeocodeCache.size >= CACHE_MAX) {
        const first = zipGeocodeCache.keys().next().value;
        if (first) zipGeocodeCache.delete(first);
      }
      zipGeocodeCache.set(zip, coords);
      return coords;
    } catch {
      return null;
    }
  }
}
