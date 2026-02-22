/**
 * Search Tab Screen - Redirects to All Retailers page
 * This is the unified search interface
 */

import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Redirect to All Retailers page (the unified search interface); pass q in URL so the page auto-fills and runs search
  useEffect(() => {
    const q = params.q && typeof params.q === 'string' ? params.q.trim() : '';
    if (q) {
      router.replace(`/category/all-retailers?q=${encodeURIComponent(q)}`);
    } else {
      router.replace('/category/all-retailers');
    }
  }, []);

  // Show loading while redirecting
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#94A3B8" />
    </SafeAreaView>
  );
}
