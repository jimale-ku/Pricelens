/**
 * Custom Bottom Navigation Bar
 * Shows on all pages (consistent with top header)
 */

import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const bottomNavItems = [
  { 
    key: 'home', 
    label: 'Home', 
    icon: 'home-outline', 
    activeIcon: 'home',
    route: '/(tabs)',
    pillSlug: 'search' // Maps to Search pill
  },
  { 
    key: 'search', 
    label: 'Search', 
    icon: 'search-outline', 
    activeIcon: 'search',
    route: '/(tabs)/search',
    pillSlug: 'search'
  },
  { 
    key: 'lists', 
    label: 'Lists', 
    icon: 'list-outline', 
    activeIcon: 'list',
    route: '/(tabs)/lists',
    pillSlug: 'my-list'
  },
  { 
    key: 'profile', 
    label: 'Profile', 
    icon: 'person-outline', 
    activeIcon: 'person',
    route: '/(tabs)/profile',
    pillSlug: 'profile'
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname === '/(tabs)/index';
    }
    return pathname === route || pathname?.startsWith(route);
  };

  const handlePress = (route: string) => {
    // Use replace when switching to a tab so we don't stack (e.g. from category → profile)
    if (pathname !== route && pathname !== route + '/') {
      router.replace(route as any);
    }
  };

  return (
    <View style={{
      backgroundColor: '#1A1F35',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 8,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }}>
      {bottomNavItems.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
          >
            {active ? (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons 
                  name={item.activeIcon as any} 
                  size={24} 
                  color="#06B6D4" 
                />
                <Text style={{ 
                  fontSize: 12, 
                  color: '#06B6D4',
                  fontWeight: '600',
                }}>
                  {item.label}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color="#9CA3AF" 
                />
                <Text style={{ 
                  fontSize: 12, 
                  color: '#9CA3AF',
                  fontWeight: '400',
                }}>
                  {item.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}













