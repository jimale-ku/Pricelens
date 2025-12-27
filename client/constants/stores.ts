/**
 * Store Data Constants
 * All retailers/stores in the platform
 */

import { Store } from '@/types';

export const STORES: Record<string, Store> = {
  // Grocery Stores
  walmart: {
    id: 'walmart',
    name: 'Walmart',
    categories: ['groceries', 'electronics', 'clothing', 'household', 'books', 'toys'],
    type: 'both',
  },
  target: {
    id: 'target',
    name: 'Target',
    categories: ['groceries', 'electronics', 'clothing', 'household', 'books'],
    type: 'both',
  },
  wholefoods: {
    id: 'wholefoods',
    name: 'Whole Foods',
    categories: ['groceries'],
    type: 'both',
  },
  kroger: {
    id: 'kroger',
    name: 'Kroger',
    categories: ['groceries'],
    type: 'both',
  },
  safeway: {
    id: 'safeway',
    name: 'Safeway',
    categories: ['groceries'],
    type: 'both',
  },
  kingsoopers: {
    id: 'kingsoopers',
    name: 'King Soopers',
    categories: ['groceries'],
    type: 'both',
  },
  amazonfresh: {
    id: 'amazonfresh',
    name: 'Amazon Fresh',
    categories: ['groceries'],
    type: 'online',
  },
  costco: {
    id: 'costco',
    name: 'Costco',
    categories: ['groceries', 'electronics', 'clothing', 'household'],
    type: 'both',
  },
  foodlion: {
    id: 'foodlion',
    name: 'Food Lion',
    categories: ['groceries'],
    type: 'both',
  },
  traderjoes: {
    id: 'traderjoes',
    name: "Trader Joe's",
    categories: ['groceries'],
    type: 'physical',
  },
  aldi: {
    id: 'aldi',
    name: 'Aldi',
    categories: ['groceries'],
    type: 'physical',
  },
  
  // Electronics Stores
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    categories: ['electronics', 'books', 'clothing', 'household', 'toys'],
    type: 'online',
  },
  bestbuy: {
    id: 'bestbuy',
    name: 'Best Buy',
    categories: ['electronics'],
    type: 'both',
  },
  newegg: {
    id: 'newegg',
    name: 'Newegg',
    categories: ['electronics'],
    type: 'online',
  },
  bhphoto: {
    id: 'bhphoto',
    name: 'B&H Photo',
    categories: ['electronics'],
    type: 'both',
  },
  microcenter: {
    id: 'microcenter',
    name: 'Micro Center',
    categories: ['electronics'],
    type: 'both',
  },
  samsclub: {
    id: 'samsclub',
    name: "Sam's Club",
    categories: ['groceries', 'electronics', 'household'],
    type: 'both',
  },
};

export const GROCERY_STORES = [
  'walmart', 'target', 'wholefoods', 'kroger', 'safeway',
  'kingsoopers', 'amazonfresh', 'costco', 'foodlion', 'traderjoes', 'aldi'
];

export const ELECTRONICS_STORES = [
  'amazon', 'bestbuy', 'walmart', 'target', 'newegg',
  'bhphoto', 'costco', 'microcenter', 'samsclub'
];
