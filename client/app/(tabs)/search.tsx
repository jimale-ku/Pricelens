/**
 * Search Tab Screen - Universal Search
 */

import { ScrollView, View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { transformCompareResponse } from '@/utils/apiTransform';
import ProductCard from '@/components/ProductCard';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products.compareMultiStore}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const transformed = transformCompareResponse(data);
      setSearchResults(transformed);
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.name !== 'AbortError') {
        // Show empty state on error
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500); // Debounce 500ms
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Search Header */}
          <View style={{
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(139, 149, 168, 0.15)',
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Ionicons name="search" size={32} color="#06B6D4" />
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
                Universal Search
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#94A3B8', lineHeight: 20 }}>
              Search for any product across 100+ retailers and compare prices instantly
            </Text>
          </View>

          {/* Search Input */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 16,
            marginBottom: 24,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for iPhone, LEGO, running shoes, coffee maker..."
                placeholderTextColor="#64748B"
                style={{
                  flex: 1,
                  color: '#FFFFFF',
                  fontSize: 16,
                }}
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#06B6D4" />
              )}
            </View>
          </View>

          {/* Results */}
          {hasSearched && !isSearching && (
            <View>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 16,
              }}>
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                  : 'No results found'}
              </Text>

              {searchResults.length === 0 ? (
                <View style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 16,
                  padding: 40,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                }}>
                  <Ionicons name="search-outline" size={48} color="#64748B" />
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 16,
                    marginTop: 16,
                    textAlign: 'center',
                  }}>
                    No products found. Try a different search term.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {searchResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isElectronics={false}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Empty State - Before Search */}
          {!hasSearched && (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
            }}>
              <Ionicons name="search-outline" size={64} color="#64748B" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 20,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}>
                Start Searching
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 14,
                textAlign: 'center',
                maxWidth: 300,
              }}>
                Enter a product name above to search across 100+ retailers and compare prices
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
