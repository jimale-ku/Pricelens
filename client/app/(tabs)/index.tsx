/**
 * Home Screen - PriceLens Homepage
 * Elegant, professional design
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Animated } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from "react";
import { router } from 'expo-router';
import AppHeader from "@/components/AppHeader";
import { CATEGORY_LIST } from "@/constants/categories";
import { getIconName } from '@/utils/iconMapper';
import CategoriesModal from "@/components/CategoriesModal";

// Featured categories to show on homepage (most popular)
const FEATURED_CATEGORIES = [
  'groceries',
  'electronics',
  'kitchen',
  'clothing',
  'footwear',
  'books',
  'household',
  'medicine',
];

// Animated Category Card Component
function AnimatedCategoryCard({ 
  category, 
  iconName, 
  index 
}: { 
  category: any; 
  iconName: string; 
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.1)).current;
  const lastTapRef = useRef<number | null>(null);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial entrance animation (staggered) - start from bottom
  useEffect(() => {
    translateYAnim.setValue(30); // Start 30px below
    shadowOpacityAnim.setValue(0);
    
    Animated.sequence([
      Animated.delay(index * 50), // Stagger animation
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressOut = () => {
    // Release animation - card raises up with bounce (no press down)
    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: -6, // Raise up 6px
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // After raising, settle back to normal position
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected - navigate immediately
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
      lastTapRef.current = null;
      
      // Enhanced raise animation for double tap
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 400,
          friction: 6,
        }),
        Animated.spring(translateYAnim, {
          toValue: -12,
          useNativeDriver: true,
          tension: 300,
          friction: 5,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Navigate after animation
        router.push(`/category/${category.slug}`);
      });
    } else {
      // Single tap - wait to see if it's a double tap
      lastTapRef.current = now;
      pressTimeoutRef.current = setTimeout(() => {
        // Single tap - just animate, don't navigate
        lastTapRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const shadowColor = shadowOpacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.6)'],
  });

  return (
    <Animated.View
      style={{
        width: '48%',
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim },
        ],
      }}
    >
      <Animated.View
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: shadowOpacityAnim,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={{
            width: '100%',
            height: 200, // Fixed height for all cards (was minHeight: 180)
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 20,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(59, 130, 246, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Gradient overlay on press */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              opacity: shadowOpacityAnim,
            }}
          />
          
          {/* Icon Container */}
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}>
            <Ionicons name={iconName} size={28} color="#60A5FA" />
          </View>
          
          {/* Category Name */}
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: '#E2E8F0',
            marginBottom: 8,
            letterSpacing: -0.3,
          }}>
            {category.name}
          </Text>
          
          {/* Description */}
          <View style={{ flex: 1, justifyContent: 'flex-start' }}>
            <Text style={{
              fontSize: 12,
              color: '#94A3B8',
              lineHeight: 18,
              minHeight: 36, // Ensure consistent height for 2 lines
            }} numberOfLines={2}>
              {category.description}
            </Text>
          </View>
          
          {/* Subtle indicator for double tap */}
          <View style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: 0.6,
          }}>
            <Ionicons name="arrow-forward-circle-outline" size={14} color="#64748B" />
            <Text style={{
              fontSize: 11,
              color: '#64748B',
              marginLeft: 4,
            }}>
              Double tap to explore
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get featured categories
  const featuredCategories = CATEGORY_LIST.filter((cat) =>
    FEATURED_CATEGORIES.includes(cat.slug)
  );

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to all-retailers page with search query
      router.push({
        pathname: '/category/all-retailers',
        params: { q: searchQuery.trim() },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Fixed Header + Category Pills */}
        <AppHeader />

        {/* Hero Section - Elegant & Professional */}
        <View style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 }}>
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.4)',
            borderRadius: 20,
            padding: 32,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '700',
              color: '#E2E8F0',
              marginBottom: 12,
              letterSpacing: -0.5,
            }}>
              Compare Prices
            </Text>
            <Text style={{
              fontSize: 32,
              fontWeight: '700',
              color: '#E2E8F0',
              marginBottom: 16,
              letterSpacing: -0.5,
            }}>
              Across 100+ Retailers
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#94A3B8',
              lineHeight: 24,
              marginBottom: 24,
            }}>
              Find the best deals on products from Amazon, Walmart, Target, and more. Save time and money with intelligent price comparison.
            </Text>
            
            {/* Universal Search Input */}
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)',
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}>
                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search any product across all categories..."
                  placeholderTextColor="#64748B"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#E2E8F0',
                    paddingVertical: 14,
                  }}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>
        </View>

        {/* Featured Categories Section */}
        <View style={{
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 8,
          gap: 20,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#E2E8F0',
                marginBottom: 4,
                letterSpacing: -0.3,
              }}>
                Featured Categories
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
              }}>
                Explore popular categories
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCategoriesModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#94A3B8',
              }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Featured Categories Grid - 2 columns with animations */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {featuredCategories.map((category, index) => {
              const iconName = getIconName(category.icon);
              return (
                <AnimatedCategoryCard
                  key={category.id}
                  category={category}
                  iconName={iconName}
                  index={index}
                />
              );
            })}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Categories Modal */}
      <CategoriesModal
        visible={categoriesModalVisible}
        onClose={() => setCategoriesModalVisible(false)}
      />
    </SafeAreaView>
  );
}
