import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';

// ZIP code to coordinates mapping (simplified for demo)
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '10001': { lat: 40.7506, lng: -73.9971 }, // NYC
  '90001': { lat: 33.9731, lng: -118.2479 }, // LA
  '60601': { lat: 41.8857, lng: -87.6207 }, // Chicago
  '77001': { lat: 29.7499, lng: -95.3585 }, // Houston
  '85001': { lat: 33.4484, lng: -112.074 }, // Phoenix
};

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
}
