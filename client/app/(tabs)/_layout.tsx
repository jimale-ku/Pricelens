/**
 * Tab Layout with Bottom Navigation
 * Bottom tabs sync with header pills:
 * - Home → Homepage (index)
 * - Search → Search pill
 * - Lists → My List pill
 * - Profile → Profile pill
 */

import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Sync bottom tab navigation with header pills
  useEffect(() => {
    // When bottom tab changes, ensure header pill is active
    // This is handled by AppHeader's pathname detection
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1F35',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
      screenListeners={{
        tabPress: (e) => {
          // When bottom tab is pressed, it will navigate automatically
          // AppHeader will detect the pathname change and update active pill
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Home tab = Homepage (index page)
            // This will show the homepage content
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Search tab = Search pill content
            // AppHeader will detect pathname and highlight Search pill
          },
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Lists tab = My List pill content
            // AppHeader will detect pathname and highlight My List pill
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Profile tab = Profile pill content
            // AppHeader will detect pathname and highlight Profile pill
          },
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: 'Plus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          href: null, // Hide from bottom tab bar, only accessible via header pills
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          href: null, // Hide from bottom tab bar, only accessible via header pills
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          href: null, // Not a main tab - access via Lists card or Profile
        }}
      />
      <Tabs.Screen
        name="purchase-history"
        options={{
          title: 'Purchase History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
          href: null, // Belongs inside Lists > History
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: null, // Hidden from bottom nav - access via Profile > Premium Features or Plus page
        }}
      />
      <Tabs.Screen
        name="barcode-scanner"
        options={{
          href: null, // Hidden from bottom nav - access via Profile > Premium Features or Plus page
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hidden from bottom nav - access via Profile > App Settings
        }}
      />
      <Tabs.Screen
        name="developer-dashboard"
        options={{
          href: null, // Hidden from bottom nav - access via Profile > Developer Dashboard
          tabBarStyle: { display: 'none' }, // Hide tab bar when on this screen
        }}
      />
    </Tabs>
  );
}
