/**
 * Distance Calculator Utility
 * 
 * Calculates distance between user location (ZIP code) and store locations
 * Uses Haversine formula for distance calculation
 * 
 * For production, you can integrate:
 * - Google Maps Distance Matrix API (for real-time travel distance)
 * - Google Geocoding API (to convert ZIP to coordinates)
 * - Or use a simpler ZIP code to coordinates database
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Store coordinates database (ZIP code to lat/lng)
// In production, you'd fetch this from Google Geocoding API or a database
const STORE_COORDINATES: Record<string, Coordinates> = {
  // Example coordinates - in production, fetch from API
  'walmart': { latitude: 40.7128, longitude: -74.0060 }, // NYC example
  'target': { latitude: 40.7589, longitude: -73.9851 },
  'amazon': { latitude: 40.7505, longitude: -73.9934 },
  'costco': { latitude: 40.7282, longitude: -73.9942 },
  'wholefoods': { latitude: 40.7614, longitude: -73.9776 },
  'kroger': { latitude: 40.6782, longitude: -73.9442 },
  'safeway': { latitude: 40.7489, longitude: -73.9680 },
  'traderjoes': { latitude: 40.7282, longitude: -73.9942 },
  'aldi': { latitude: 40.7505, longitude: -73.9934 },
  'foodlion': { latitude: 40.6782, longitude: -73.9442 },
};

// ZIP code to coordinates mapping (example - in production, use Google Geocoding API)
const ZIP_TO_COORDINATES: Record<string, Coordinates> = {
  '10001': { latitude: 40.7505, longitude: -73.9973 }, // NYC
  '90210': { latitude: 34.0901, longitude: -118.4065 }, // Beverly Hills
  '60601': { latitude: 41.8781, longitude: -87.6298 }, // Chicago
  // Add more as needed, or fetch from API
};

/**
 * Convert ZIP code to coordinates
 * In production, use Google Geocoding API
 */
export async function zipToCoordinates(zipCode: string): Promise<Coordinates | null> {
  // Check cache first
  if (ZIP_TO_COORDINATES[zipCode]) {
    return ZIP_TO_COORDINATES[zipCode];
  }

  // In production, call Google Geocoding API:
  // const response = await fetch(
  //   `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${GOOGLE_API_KEY}`
  // );
  // const data = await response.json();
  // return { latitude: data.results[0].geometry.location.lat, longitude: data.results[0].geometry.location.lng };

  // For now, return null if not in cache
  console.warn(`ZIP code ${zipCode} not found in cache. In production, use Google Geocoding API.`);
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get store coordinates by store name/slug
 */
export function getStoreCoordinates(storeName: string): Coordinates | null {
  const normalizedName = storeName.toLowerCase().replace(/\s+/g, '');
  return STORE_COORDINATES[normalizedName] || null;
}

/**
 * Calculate distance from user ZIP to a store
 */
export async function getDistanceToStore(
  userZipCode: string,
  storeName: string
): Promise<number | null> {
  const userCoords = await zipToCoordinates(userZipCode);
  if (!userCoords) {
    return null;
  }

  const storeCoords = getStoreCoordinates(storeName);
  if (!storeCoords) {
    return null;
  }

  return calculateDistance(userCoords, storeCoords);
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number | null): string {
  if (distance === null) {
    return 'Distance unknown';
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 10) * 0.1} mi`;
  }
  
  return `${distance} mi`;
}







