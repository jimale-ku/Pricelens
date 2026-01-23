/**
 * API Configuration
 * 
 * Update API_BASE_URL with your computer's IP address:
 * 1. Run: ipconfig (Windows) or ifconfig (Mac/Linux)
 * 2. Find your IPv4 Address (e.g., 192.168.1.5)
 * 3. Replace localhost with your IP below
 */

// For development on physical device or emulator
export const API_BASE_URL = 'http://192.168.201.105:3000';

// Example for physical device (update with YOUR IP):
// export const API_BASE_URL = 'http://192.168.1.5:3000';

// API Endpoints
export const API_ENDPOINTS = {
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
      const url = `${API_BASE_URL}/products/compare/multi-store?q=${encodedQuery}${searchType ? `&searchType=${searchType}` : ''}`;
      console.log(`🔗 Built URL: query="${query}" -> encoded="${encodedQuery}" -> URL="${url}"`);
      return url;
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
