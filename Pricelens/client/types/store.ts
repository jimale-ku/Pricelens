/**
 * Store/Retailer Type Definitions
 */

export interface Store {
  id: string;
  name: string;
  logo?: string;
  categories: string[]; // Category IDs this store supports
  website?: string;
  type: 'online' | 'physical' | 'both';
}

export interface StoreLocation {
  id: string;
  storeId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
}
