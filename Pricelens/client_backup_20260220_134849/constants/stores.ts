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
    logo: 'https://logo.clearbit.com/walmart.com',
    categories: ['groceries', 'electronics', 'clothing', 'household', 'books', 'toys'],
    type: 'both',
  },
  target: {
    id: 'target',
    name: 'Target',
    logo: 'https://logo.clearbit.com/target.com',
    categories: ['groceries', 'electronics', 'clothing', 'household', 'books'],
    type: 'both',
  },
  wholefoods: {
    id: 'wholefoods',
    name: 'Whole Foods',
    logo: 'https://logo.clearbit.com/wholefoodsmarket.com',
    categories: ['groceries'],
    type: 'both',
  },
  kroger: {
    id: 'kroger',
    name: 'Kroger',
    logo: 'https://logo.clearbit.com/kroger.com',
    categories: ['groceries'],
    type: 'both',
  },
  safeway: {
    id: 'safeway',
    name: 'Safeway',
    logo: 'https://logo.clearbit.com/safeway.com',
    categories: ['groceries'],
    type: 'both',
  },
  kingsoopers: {
    id: 'kingsoopers',
    name: 'King Soopers',
    logo: 'https://logo.clearbit.com/kingsoopers.com',
    categories: ['groceries'],
    type: 'both',
  },
  amazonfresh: {
    id: 'amazonfresh',
    name: 'Amazon Fresh',
    logo: 'https://logo.clearbit.com/amazon.com',
    categories: ['groceries'],
    type: 'online',
  },
  costco: {
    id: 'costco',
    name: 'Costco',
    logo: 'https://logo.clearbit.com/costco.com',
    categories: ['groceries', 'electronics', 'clothing', 'household'],
    type: 'both',
  },
  foodlion: {
    id: 'foodlion',
    name: 'Food Lion',
    logo: 'https://logo.clearbit.com/foodlion.com',
    categories: ['groceries'],
    type: 'both',
  },
  traderjoes: {
    id: 'traderjoes',
    name: "Trader Joe's",
    logo: 'https://logo.clearbit.com/traderjoes.com',
    categories: ['groceries'],
    type: 'physical',
  },
  aldi: {
    id: 'aldi',
    name: 'Aldi',
    logo: 'https://logo.clearbit.com/aldi.us',
    categories: ['groceries'],
    type: 'physical',
  },
  
  // Electronics Stores
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://logo.clearbit.com/amazon.com',
    categories: ['electronics', 'books', 'clothing', 'household', 'toys'],
    type: 'online',
  },
  bestbuy: {
    id: 'bestbuy',
    name: 'Best Buy',
    logo: 'https://logo.clearbit.com/bestbuy.com',
    categories: ['electronics'],
    type: 'both',
  },
  newegg: {
    id: 'newegg',
    name: 'Newegg',
    logo: 'https://logo.clearbit.com/newegg.com',
    categories: ['electronics'],
    type: 'online',
  },
  bhphoto: {
    id: 'bhphoto',
    name: 'B&H Photo',
    logo: 'https://logo.clearbit.com/bhphotovideo.com',
    categories: ['electronics'],
    type: 'both',
  },
  microcenter: {
    id: 'microcenter',
    name: 'Micro Center',
    logo: 'https://logo.clearbit.com/microcenter.com',
    categories: ['electronics'],
    type: 'both',
  },
  samsclub: {
    id: 'samsclub',
    name: "Sam's Club",
    logo: 'https://logo.clearbit.com/samsclub.com',
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
