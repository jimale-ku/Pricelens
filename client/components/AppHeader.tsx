/**
 * Shared App Header - Fixed across all pages
 * Contains: Logo + Category Pills Navigation
 */

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Dimensions, InteractionManager } from "react-native";
import AppLogo from './AppLogo';
import { useRouter, usePathname, useSegments } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_LIST } from "@/constants/categories";
import { getIconName } from "@/utils/iconMapper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isPlusSubscriber, setIsPlusSubscriber] = useState(true);
  const [tabPositions, setTabPositions] = useState<{ [key: string]: number }>({});
  const activeTabRef = useRef<string>('search'); // Use ref for immediate updates
  const pendingNavigationRef = useRef<NodeJS.Timeout | null>(null); // Track pending navigation

  const segments = useSegments();
  
  // Determine active tab from pathname and segments (optimized for speed)
  const getActiveTab = () => {
    const currentPath = pathname || '';
    
    // Handle tabs routes (bottom navigation) - check exact matches first for speed
    if (currentPath === '/(tabs)/search' || currentPath.endsWith('/search')) return 'search';
    if (currentPath === '/(tabs)/lists' || currentPath.endsWith('/lists')) return 'my-list';
    if (currentPath === '/(tabs)/profile' || currentPath.endsWith('/profile')) return 'profile';
    if (currentPath === '/(tabs)/plus' || currentPath.endsWith('/plus')) return 'plus';
    if (currentPath === '/(tabs)/analytics' || currentPath.endsWith('/analytics')) return 'analytics';
    
    // Home tab - when on index/homepage, highlight Search pill (homepage shows search content)
    if (currentPath === '/(tabs)' || currentPath === '/(tabs)/' || currentPath === '/(tabs)/index' || 
        currentPath === '/' || currentPath === '/index' || currentPath === '/(tabs)/index') {
      return 'search'; // Home tab content = Search functionality
    }
    
    // Handle category routes
    if (currentPath.startsWith('/category/')) {
      const slug = currentPath.split('/category/')[1]?.split('?')[0]; // Remove query params
      return slug || 'search';
    }
    
    return 'search'; // Default
  };

  const [activeTab, setActiveTab] = useState(() => {
    const tab = getActiveTab();
    activeTabRef.current = tab; // Sync ref
    return tab;
  });
  const [, forceUpdate] = useState(0); // Force re-render counter

  // Update active tab immediately when route changes (useLayoutEffect for synchronous updates)
  useLayoutEffect(() => {
    const newActiveTab = getActiveTab();
    // Only update if the pathname actually matches the expected route
    // This prevents race conditions where stale pathname triggers wrong active tab
    if (newActiveTab !== activeTabRef.current) {
      // Double-check: verify pathname matches the category slug to prevent stale updates
      if (pathname?.includes(newActiveTab) || newActiveTab === 'search') {
        activeTabRef.current = newActiveTab; // Update ref immediately
        setActiveTab(newActiveTab); // Update state synchronously
      }
    }
  }, [pathname]);

  const handleCategoryPress = (slug: string, index: number) => {
    // CRITICAL: Cancel any pending navigation to prevent race conditions
    if (pendingNavigationRef.current) {
      clearTimeout(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
    
    // CRITICAL: Update ref and state SYNCHRONOUSLY for instant visual feedback
    // This must happen BEFORE any async operations
    activeTabRef.current = slug;
    setActiveTab(slug);
    forceUpdate(prev => prev + 1); // Force immediate re-render
    
    // Navigate immediately using replace (not push) to avoid navigation stack issues
    // Store timeout ref so we can cancel it if user clicks again
    pendingNavigationRef.current = setTimeout(() => {
      // Use replace instead of push to avoid navigation stack buildup
      if (slug === 'search') {
        router.replace('/(tabs)/search');
      } else if (slug === 'my-list') {
        router.replace('/(tabs)/lists');
      } else if (slug === 'plus') {
        router.replace('/(tabs)/plus');
      } else if (slug === 'profile') {
        router.replace('/(tabs)/profile');
      } else if (slug === 'analytics') {
        router.replace('/(tabs)/analytics');
      } else {
        router.replace(`/category/${slug}`);
      }
      pendingNavigationRef.current = null;
    }, 0);
    
    // Auto-scroll to center the active tab (defer to not block UI update)
    if (scrollViewRef.current && tabPositions[slug]) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: tabPositions[slug] - SCREEN_WIDTH / 2 + 60,
          y: 0,
          animated: true,
        });
      }, 100);
    }
  };

  const handleTabLayout = (slug: string, event: any) => {
    const { x } = event.nativeEvent.layout;
    setTabPositions(prev => ({ ...prev, [slug]: x }));
  };

  return (
    <View>
      {/* ============ TOP HEADER ============ */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Left Side: Logo + Title */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}
          >
            {/* Logo - Circular with Dark Background */}
            <View
              style={{
                height: 64,
                width: 64,
                borderRadius: 32, // Fully circular (half of 64)
                backgroundColor: '#0F172A', // Dark background
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border for professionalism
              }}
            >
              {/* App Logo - Fills the circular div (90% of container for padding) */}
              <AppLogo size={58} color="#FFFFFF" />
            </View>
            
            {/* Title + Subtitle */}
            <View>
              <Text style={{ 
                fontSize: 28, 
                fontWeight: 'bold', 
                color: '#60A5FA',
                textShadowColor: '#A78BFA',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
                letterSpacing: -0.5,
              }}>
                PriceLens
              </Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' }}>
                See the Savings Clearly
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right Side: Plus Badge */}
          {isPlusSubscriber && (
            <LinearGradient
              colors={['#3B82F6', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                shadowColor: '#9333EA',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons name="trophy-outline" size={18} color="#FDE047" />
              <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '600' }}>
                Plus
              </Text>
            </LinearGradient>
          )}
        </View>
      </View>

      {/* ============ CATEGORY PILLS (Horizontal Scroll) ============ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 12,
          padding: 6,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={true}
            persistentScrollbar={true}
            contentContainerStyle={{ 
              gap: 6,
              paddingHorizontal: 6,
              paddingVertical: 6,
              minWidth: '100%',
            }}
            style={{ flexGrow: 0 }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            removeClippedSubviews={false}
            bounces={false}
          >
            {CATEGORY_LIST.map((category, index) => {
              // Check ref for instant updates (updated before state), or state as fallback
              const isActive = activeTabRef.current === category.slug || activeTab === category.slug;
              const isPlusTab = category.slug === 'plus';
              const iconName = getIconName(category.icon);
              
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategoryPress(category.slug, index)}
                  onLayout={(event) => handleTabLayout(category.slug, event)}
                  activeOpacity={0.7}
                  style={{ borderRadius: 8, overflow: 'hidden' }}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={isPlusTab ? ['#A855F7', '#EC4899'] : ['#3B82F6', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        gap: 8,
                        shadowColor: isPlusTab ? '#A855F7' : '#3B82F6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Ionicons name={iconName} size={16} color="#ffffff" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                        {category.name}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      gap: 8,
                      backgroundColor: 'transparent',
                    }}>
                      <Ionicons name={iconName} size={16} color="#94A3B8" />
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#94A3B8' }}>
                        {category.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
