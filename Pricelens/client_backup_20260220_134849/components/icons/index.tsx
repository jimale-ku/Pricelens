/**
 * Professional Icons using Lucide React Native
 * Royalty-free, professional icons - Industry standard
 * 
 * All icons from: https://lucide.dev/icons
 * License: MIT (Free for commercial use)
 */

import React from 'react';
import {
  Search,
  Store,
  ShoppingCart,
  Laptop,
  UtensilsCrossed,
  Home,
  Shirt,
  Footprints,
  BookOpen,
  Package,
  Pill,
  Car,
  Bed,
  Plane,
  CircleDot,
  Scissors,
  Droplet,
  Sparkles,
  Gamepad2,
  Fuel,
  Shield,
  Building2,
  Settings,
  Truck,
  Heart,
  Palette,
  Dumbbell,
  Briefcase,
  Sofa,
  Archive,
  Wrench,
  ChefHat,
  PawPrint,
  List,
  Plus,
  User,
  Code,
  Sparkle,
  Hand,
  Circle,
} from 'lucide-react-native';

export type IconName = 
  | 'search'
  | 'groceries'
  | 'electronics'
  | 'kitchen'
  | 'homeaccessories'
  | 'clothing'
  | 'footwear'
  | 'books'
  | 'household'
  | 'medicine'
  | 'rentals'
  | 'hotels'
  | 'airfare'
  | 'tires'
  | 'haircuts'
  | 'oilchanges'
  | 'carwashes'
  | 'videogames'
  | 'gasstations'
  | 'carinsurance'
  | 'rentersinsurance'
  | 'apartments'
  | 'services'
  | 'delivery'
  | 'massage'
  | 'nails'
  | 'beauty'
  | 'gyms'
  | 'fitness'
  | 'office'
  | 'mattresses'
  | 'furniture'
  | 'homedecor'
  | 'moving'
  | 'storage'
  | 'spa'
  | 'tools'
  | 'mealkits'
  | 'pets'
  | 'list'
  | 'plus'
  | 'profile'
  | 'developer';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 16, color = '#FFF' }: IconProps) {
  // Map icon names to Lucide components
  // All icons are professional, royalty-free from Lucide
  const icons: Record<IconName, React.ComponentType<{ size?: number; color?: string }>> = {
    search: Search,
    groceries: ShoppingCart,
    electronics: Laptop,
    kitchen: UtensilsCrossed,
    homeaccessories: Home,
    clothing: Shirt,
    footwear: Footprints,
    books: BookOpen,
    household: Package,
    medicine: Pill,
    rentals: Car,
    hotels: Bed,
    airfare: Plane,
    tires: CircleDot,
    haircuts: Scissors,
    oilchanges: Droplet,
    carwashes: Droplet,
    videogames: Gamepad2,
    gasstations: Fuel,
    carinsurance: Shield,
    rentersinsurance: Shield,
    apartments: Building2,
    services: Settings,
    delivery: Truck,
    massage: Hand,
    nails: Sparkle,
    beauty: Palette,
    gyms: Dumbbell,
    fitness: Dumbbell,
    office: Briefcase,
    mattresses: Bed,
    furniture: Sofa,
    homedecor: Home,
    moving: Truck,
    storage: Archive,
    spa: Sparkles,
    tools: Wrench,
    mealkits: ChefHat,
    pets: PawPrint,
    list: List,
    plus: Plus,
    profile: User,
    developer: Code,
  };

  const IconComponent = icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Lucide icons use 'size' and 'color' props
  return <IconComponent size={size} color={color} />;
}

// Export iconMap for direct access to icon components
// Updated to use Lucide icons
export const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  allretailers: Store,
  groceries: ShoppingCart,
  electronics: Laptop,
  kitchen: UtensilsCrossed,
  homeaccessories: Home,
  clothing: Shirt,
  footwear: Footprints,
  books: BookOpen,
  household: Package,
  medicine: Pill,
  rentals: Car,
  hotels: Bed,
  airfare: Plane,
  tires: CircleDot,
  haircuts: Scissors,
  oilchanges: Droplet,
  carwashes: Droplet,
  videogames: Gamepad2,
  gasstations: Fuel,
  carinsurance: Shield,
  rentersinsurance: Shield,
  apartments: Building2,
  services: Settings,
  delivery: Truck,
  massage: Hand,
  nails: Sparkle,
  beauty: Palette,
  gyms: Dumbbell,
  fitness: Dumbbell,
  office: Briefcase,
  mattresses: Bed,
  furniture: Sofa,
  homedecor: Home,
  moving: Truck,
  storage: Archive,
  spa: Sparkles,
  tools: Wrench,
  mealkits: ChefHat,
  petsupplies: PawPrint,
};
