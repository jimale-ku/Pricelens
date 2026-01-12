/**
 * API Configuration
 * 
 * Update API_BASE_URL with your computer's IP address:
 * 1. Run: ipconfig (Windows) or ifconfig (Mac/Linux)
 * 2. Find your IPv4 Address (e.g., 192.168.1.5)
 * 3. Replace localhost with your IP below
 */

// For development on physical device or emulator
export const API_BASE_URL = 'http://192.168.201.104:3000';

// Example for physical device (update with YOUR IP):
// export const API_BASE_URL = 'http://192.168.1.5:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Products
  products: {
    popular: (categorySlug: string, limit: number = 6) => 
      `${API_BASE_URL}/products/popular?categorySlug=${categorySlug}&limit=${limit}`,
    search: `${API_BASE_URL}/products/search`,
    compareMultiStore: (query: string, searchType?: string) => 
      `${API_BASE_URL}/products/compare/multi-store?q=${encodeURIComponent(query)}${searchType ? `&searchType=${searchType}` : ''}`,
    advancedSearch: `${API_BASE_URL}/products/search/advanced`,
    byId: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  
  // Categories
  categories: {
    all: `${API_BASE_URL}/categories`,
    bySlug: (slug: string) => `${API_BASE_URL}/categories/slug/${slug}`,
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
};
