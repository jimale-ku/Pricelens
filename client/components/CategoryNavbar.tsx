/**
 * Horizontal Category Navigation Bar
 * Pixel-perfect match to Figma design
 */

import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from "react";
import Icon, { type IconName } from "./icons/index";

interface CategoryNavbarProps {
  onCategoryChange?: (categoryId: string) => void;
  initialActive?: string;
}

interface CategoryPillProps {
  label: string;
  iconName?: IconName;
  isActive: boolean;
  onPress: () => void;
}

function CategoryPill({ label, iconName, isActive, onPress }: CategoryPillProps) {
  if (isActive) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']} // oklch converted to approximate RGB
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'transparent',
          }}
        >
          {/* Icon - 16x16 with 8px margin-right */}
          {iconName && (
            <View style={{ marginRight: 8 }}>
              <Icon name={iconName} size={16} color="#FFFFFF" />
            </View>
          )}
          <Text style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 20,
          }}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Inactive pill - exact Figma specs
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      {iconName && (
        <View style={{ marginRight: 8 }}>
          <Icon name={iconName} size={16} color="rgb(232, 237, 244)" />
        </View>
      )}
      <Text style={{
        color: 'rgb(232, 237, 244)', // Exact from Figma
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Default to first category instead of 'search'
const DEFAULT_CATEGORY = 'all-retailers'; // First category in the list

export default function CategoryNavbar({ onCategoryChange, initialActive = DEFAULT_CATEGORY }: CategoryNavbarProps) {
  const [activeCategory, setActiveCategory] = useState(initialActive);
  const scrollViewRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);
  const pillRefs = useRef<{ [key: string]: View | null }>({});
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(80)).current;

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Notify parent component
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
    
    // Animate indicator to active pill
    const pillRef = pillRefs.current[categoryId];
    if (pillRef && containerRef.current) {
      pillRef.measureLayout(
        containerRef.current as any,
        (x, y, width, height) => {
          Animated.parallel([
            Animated.timing(indicatorLeft, {
              toValue: x + 6, // Account for container padding
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(indicatorWidth, {
              toValue: width,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
        },
        () => {}
      );
    }
  };

  useEffect(() => {
    // Initialize indicator position on mount - use first category instead of 'search'
    setTimeout(() => {
      const firstCategoryPill = pillRefs.current[activeCategory] || pillRefs.current[DEFAULT_CATEGORY];
      if (firstCategoryPill && containerRef.current) {
        firstCategoryPill.measureLayout(
          containerRef.current as any,
          (x, y, width, height) => {
            indicatorLeft.setValue(x + 6);
            indicatorWidth.setValue(width);
          },
          () => {}
        );
      }
    }, 100);
  }, [activeCategory]);

  const categories: Array<{ id: IconName; label: string }> = [
    // Removed 'search' - it's now handled by bottom navigation
    // Removed 'list', 'plus', 'profile', 'developer' - these are handled by bottom nav or other navigation
    { id: 'allretailers', label: 'All Retailers' },
    { id: 'groceries', label: 'Groceries' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'homeaccessories', label: 'Home Accessories' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'footwear', label: 'Footwear' },
    { id: 'books', label: 'Books' },
    { id: 'household', label: 'Household' },
    { id: 'medicine', label: 'Medicine' },
    { id: 'rentals', label: 'Rentals' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'airfare', label: 'Airfare' },
    { id: 'tires', label: 'Tires' },
    { id: 'haircuts', label: 'Haircuts' },
    { id: 'oilchanges', label: 'Oil Changes' },
    { id: 'carwashes', label: 'Car Washes' },
    { id: 'videogames', label: 'Video Games' },
    { id: 'gasstations', label: 'Gas Stations' },
    { id: 'carinsurance', label: 'Car Insurance' },
    { id: 'rentersinsurance', label: 'Renters Insurance' },
    { id: 'apartments', label: 'Apartments' },
    { id: 'services', label: 'Services' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'massage', label: 'Massage' },
    { id: 'nails', label: 'Nails' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'gyms', label: 'Gyms' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'office', label: 'Office' },
    { id: 'mattresses', label: 'Mattresses' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'moving', label: 'Moving' },
    { id: 'storage', label: 'Storage' },
    { id: 'spa', label: 'Spa' },
    { id: 'tools', label: 'Tools' },
    { id: 'mealkits', label: 'Meal Kits' },
    { id: 'pets', label: 'Pets' },
  ];

  return (
    <View 
      ref={containerRef}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(21, 27, 40, 0.6)',
        paddingVertical: 6,
        paddingHorizontal: 6,
        gap: 6,
        borderRadius: 18,
        position: 'relative',
      }}
    >
      {categories.map((category) => (
        <View
          key={category.id}
          ref={(ref) => (pillRefs.current[category.id] = ref)}
          collapsable={false}
        >
          <CategoryPill
            label={category.label}
            iconName={category.id}
            isActive={activeCategory === category.id}
            onPress={() => handleCategoryPress(category.id)}
          />
        </View>
      ))}
      
      {/* Animated indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -8,
          height: 3,
          backgroundColor: '#6366F1',
          borderRadius: 1.5,
          left: Animated.add(indicatorLeft, Animated.divide(indicatorWidth, 4)),
          width: Animated.divide(indicatorWidth, 2),
        }}
      />
    </View>
  );
}
