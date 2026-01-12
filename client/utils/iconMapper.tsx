/**
 * Icon Mapper Utility
 * Maps icon string names to Ionicons (Expo's built-in icons)
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName = 
  | 'storefront'
  | 'cart'
  | 'laptop'
  | 'restaurant'
  | 'home'
  | 'shirt'
  | 'shoe'
  | 'book'
  | 'package'
  | 'pill'
  | 'car'
  | 'hotel'
  | 'plane'
  | 'wrench'
  | 'scissors'
  | 'droplet'
  | 'sparkles'
  | 'gamepad'
  | 'fuel'
  | 'shield'
  | 'building'
  | 'settings'
  | 'utensils'
  | 'heart'
  | 'paint'
  | 'dumbbell'
  | 'briefcase'
  | 'bed'
  | 'sofa'
  | 'palette'
  | 'truck'
  | 'archive'
  | 'zap'
  | 'hardhat'
  | 'chef'
  | 'paw'
  | 'search'
  | 'crown'
  | 'barchart'
  | 'list'
  | 'trophy'
  | 'person'
  | 'bar-chart';

// Map icon names to Ionicons names
const iconMap: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  storefront: 'storefront-outline',
  cart: 'cart-outline',
  laptop: 'laptop-outline',
  restaurant: 'restaurant-outline',
  home: 'home-outline',
  shirt: 'shirt-outline',
  shoe: 'footsteps-outline',
  book: 'book-outline',
  package: 'cube-outline',
  pill: 'medkit-outline',
  car: 'car-outline',
  hotel: 'bed-outline',
  plane: 'airplane-outline',
  wrench: 'build-outline',
  scissors: 'cut-outline',
  droplet: 'water-outline',
  sparkles: 'sparkles-outline',
  gamepad: 'game-controller-outline',
  fuel: 'speedometer-outline',
  shield: 'shield-outline',
  building: 'business-outline',
  settings: 'settings-outline',
  utensils: 'restaurant-outline',
  heart: 'heart-outline',
  paint: 'color-palette-outline',
  dumbbell: 'barbell-outline',
  briefcase: 'briefcase-outline',
  bed: 'bed-outline',
  sofa: 'home-outline',
  palette: 'color-palette-outline',
  truck: 'car-outline',
  archive: 'archive-outline',
  zap: 'flash-outline',
  hardhat: 'construct-outline',
  chef: 'restaurant-outline',
  paw: 'paw-outline',
  search: 'search-outline',
  crown: 'trophy-outline',
  barchart: 'bar-chart-outline',
  list: 'list-outline',
  trophy: 'trophy-outline',
  person: 'person-outline',
  'bar-chart': 'bar-chart-outline',
};

export function getIconName(iconName: string): keyof typeof Ionicons.glyphMap {
  return iconMap[iconName as IconName] || 'storefront-outline';
}
