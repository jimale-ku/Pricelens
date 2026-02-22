/**
 * API Configuration – FRONTEND ↔ BACKEND LINK
 *
 * If categories show "No products" or keep loading, the app may not be
 * reaching the server. Check:
 *
 * 1. Backend is running: in project root run  npm run start:dev  (or  cd server && npm run start:dev)
 * 2. Same network: phone/emulator and PC must be on the same Wi‑Fi (or emulator uses localhost).
 * 3. This URL must match your PC:
 *    - Physical device: use your PC’s IPv4 (ipconfig on Windows, ifconfig on Mac/Linux).
 *    - Emulator: often  http://10.0.2.2:3000  (Android) or  http://localhost:3000  (iOS).
 * 4. Test in browser: open  API_BASE_URL/stores  – you should get JSON.
 *
 * NOTE: If using mobile hotspot, use the PC’s IP on that hotspot. IP can change when you switch networks.
 */

// Backend URL – set in client/.env as EXPO_PUBLIC_API_URL (Expo bakes this in at build time).
//   Development:  EXPO_PUBLIC_API_URL=http://localhost:3000  (or YOUR_MAC_IP:3000 for physical device)
//   Production:   EXPO_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com  (no trailing slash)
const DEFAULT_API_BASE_URL = 'http://localhost:3000';
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL?.trim()) || DEFAULT_API_BASE_URL;

// API Endpoints
export const API_ENDPOINTS = {
  base: API_BASE_URL,
  // Products
  products: {
    popular: (categorySlug: string, limit: number = 6, storeSlugs?: string[], subcategory?: string, page?: number) => {
      const params = new URLSearchParams({
        categorySlug,
        limit: limit.toString(),
      });
      if (storeSlugs && storeSlugs.length > 0) {
        params.append('stores', storeSlugs.join(','));
      }
      if (subcategory) {
        params.append('subcategory', subcategory);
      }
      if (page) {
        params.append('page', page.toString());
      }
      return `${API_BASE_URL}/products/popular?${params.toString()}`;
    },
    search: `${API_BASE_URL}/products/search`,
    fastSearch: (query: string, searchType?: string, categoryId?: string, limit?: number, categorySlug?: string, page?: number) => {
      const encodedQuery = encodeURIComponent(query);
      let url = `${API_BASE_URL}/products/search/fast?q=${encodedQuery}`;
      if (searchType) url += `&searchType=${searchType}`;
      if (categoryId) url += `&categoryId=${encodeURIComponent(categoryId)}`;
      if (categorySlug) url += `&categorySlug=${encodeURIComponent(categorySlug)}`;
      if (limit) url += `&limit=${limit}`;
      if (page) url += `&page=${page}`;
      return url;
    },
    compareMultiStore: (query: string, searchType?: string) => {
      const encodedQuery = encodeURIComponent(query);
      return `${API_BASE_URL}/products/compare/multi-store?q=${encodedQuery}${searchType ? `&searchType=${searchType}` : ''}`;
    },
    closestStores: (productId: string, zipCode: string) => {
      return `${API_BASE_URL}/products/closest-stores?productId=${encodeURIComponent(productId)}&zipCode=${encodeURIComponent(zipCode)}`;
    },
    advancedSearch: `${API_BASE_URL}/products/search/advanced`,
    byId: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  
  // Categories
  categories: {
    all: `${API_BASE_URL}/categories`,
    bySlug: (slug: string) => `${API_BASE_URL}/categories/slug/${slug}`,
    subcategoryCounts: (slug: string) => `${API_BASE_URL}/categories/slug/${slug}/subcategory-counts`,
    base: `${API_BASE_URL}/categories`,
  },
  
  // Stores
  stores: {
    all: `${API_BASE_URL}/stores`,
    request: `${API_BASE_URL}/stores/request`,
    nearby: (zipCode: string) => `${API_BASE_URL}/store-locations/nearby?zipCode=${zipCode}`,
  },
  
  // Auth
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    me: `${API_BASE_URL}/auth/me`,
  },

  // Subscriptions (Stripe-backed; requires JWT for checkout / me)
  subscriptions: {
    me: `${API_BASE_URL}/subscriptions/me`,
    plans: `${API_BASE_URL}/subscriptions/plans`,
    config: `${API_BASE_URL}/subscriptions/config`,
    checkout: `${API_BASE_URL}/subscriptions/checkout`,
    cancel: `${API_BASE_URL}/subscriptions/cancel`,
  },

  // Receipts (AI receipt scanner; requires JWT)
  receipts: {
    analyze: `${API_BASE_URL}/receipts/analyze`,
    analyzeSample: `${API_BASE_URL}/receipts/analyze-sample`,
  },

  // Price Alerts (requires JWT)
  alerts: {
    list: (includeInactive?: boolean) => `${API_BASE_URL}/alerts${includeInactive ? '?includeInactive=true' : ''}`,
    create: `${API_BASE_URL}/alerts`,
    update: (id: string) => `${API_BASE_URL}/alerts/${id}`,
    delete: (id: string) => `${API_BASE_URL}/alerts/${id}`,
    deactivate: (id: string) => `${API_BASE_URL}/alerts/${id}/deactivate`,
  },
  
  // Services (Pattern B & C)
  services: {
    // Pattern B: Location-based services
    gasStations: (zipCode: string, gasType?: string) => {
      const params = new URLSearchParams({ zipCode });
      if (gasType) params.append('gasType', gasType);
      return `${API_BASE_URL}/services/gas-stations?${params.toString()}`;
    },
    gyms: (zipCode: string, membershipType?: string) => {
      const params = new URLSearchParams({ zipCode });
      if (membershipType) params.append('membershipType', membershipType);
      return `${API_BASE_URL}/services/gyms?${params.toString()}`;
    },
    hotels: (location: string, checkIn?: string, checkOut?: string, guests?: number) => {
      const params = new URLSearchParams({ location });
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);
      if (guests) params.append('guests', guests.toString());
      return `${API_BASE_URL}/services/hotels?${params.toString()}`;
    },
    airfare: (origin: string, destination: string, departDate?: string, returnDate?: string, passengers?: number) => {
      const params = new URLSearchParams({ origin, destination });
      if (departDate) params.append('departDate', departDate);
      if (returnDate) params.append('returnDate', returnDate);
      if (passengers) params.append('passengers', passengers.toString());
      return `${API_BASE_URL}/services/airfare?${params.toString()}`;
    },
    oilChanges: (zipCode: string, vehicleType?: string) => {
      const params = new URLSearchParams({ zipCode });
      if (vehicleType) params.append('vehicleType', vehicleType);
      return `${API_BASE_URL}/services/oil-changes?${params.toString()}`;
    },
    // Generic Pattern B search
    search: (category: string, params: Record<string, string>) => {
      const queryParams = new URLSearchParams({ category, ...params });
      return `${API_BASE_URL}/services/search?${queryParams.toString()}`;
    },
    // Pattern C: Service providers
    providers: (category: string, serviceType: string, zipCode: string) => {
      const params = new URLSearchParams({ category, serviceType, zipCode });
      return `${API_BASE_URL}/services/providers?${params.toString()}`;
    },
  },
};
