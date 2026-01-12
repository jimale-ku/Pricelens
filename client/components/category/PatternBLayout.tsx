/**
 * Pattern B Layout - Direct Comparison Table
 * 
 * Used by: Gas Stations, Gym Memberships, Car Insurance, Renters Insurance,
 * Tires, Mattresses, Oil Changes, Car Washes, Rental Cars, Hotels, Airfare, Storage Units, Meal Kits
 * 
 * Features:
 * - Search form first (ZIP code, options)
 * - Table layout (rows and columns)
 * - Sorted by price (cheapest first)
 * - Savings calculator at bottom
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { getIconName } from '@/utils/iconMapper';

interface PatternBLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
  
  // Search form configuration
  searchFields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  
  // Default search field values
  defaultSearchValues?: Record<string, string>;
}

export default function PatternBLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
  searchFields = [
    { id: 'zipCode', label: 'ZIP Code', type: 'text', placeholder: 'Enter ZIP code' },
  ],
  defaultSearchValues = {},
}: PatternBLayoutProps) {
  const [searchValues, setSearchValues] = useState<Record<string, string>>(defaultSearchValues);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when category changes (without remounting component)
  useEffect(() => {
    setSearchValues(defaultSearchValues);
    setResults([]);
    setHasSearched(false);
    setLoading(false);
  }, [categorySlug, defaultSearchValues]);

  const iconName = getIconName(categoryIcon);

  const handleSearch = async () => {
    // Validate required fields
    const zipCode = searchValues.zipCode || searchValues.location;
    if (!zipCode?.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code to search.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    // TODO: Implement actual API call based on category
    // For now, show placeholder
    setTimeout(() => {
      setResults([]);
      setLoading(false);
      Alert.alert('Coming Soon', `Search functionality for ${categoryName} will be available soon.`);
    }, 1000);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setSearchValues(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        bounces={false}
        scrollEventThrottle={16}
      >

        {/* Hero Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 32,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Gradient Overlay */}
            <LinearGradient
              colors={[`${iconGradient[0]}15`, `${iconGradient[1]}15`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: 12,
              position: 'relative',
              zIndex: 10,
            }}>
              {/* Category Icon */}
              <LinearGradient
                colors={iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName as any} size={32} color="#ffffff" />
              </LinearGradient>

              {/* Category Title */}
              <View style={{ flex: 1 }}>
                <MaskedView
                  maskElement={
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      lineHeight: 32,
                    }}>
                      {categoryName}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      lineHeight: 32,
                      opacity: 0,
                    }}>
                      {categoryName}
                    </Text>
                  </LinearGradient>
                </MaskedView>
              </View>
            </View>

            {/* Category Description */}
            <Text style={{
              fontSize: 14,
              color: '#94A3B8',
              lineHeight: 20,
              position: 'relative',
              zIndex: 10,
            }}>
              {categoryDescription}
            </Text>
          </View>

          {/* Search Form */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#E2E8F0',
              marginBottom: 16,
            }}>
              Search {categoryName}
            </Text>

            {/* Search Fields */}
            <View style={{ gap: 16, marginBottom: 16 }}>
              {searchFields.map((field) => (
                <View key={field.id}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#CBD5E1',
                    marginBottom: 8,
                  }}>
                    {field.label}
                  </Text>
                  
                  {field.type === 'text' ? (
                    <TextInput
                      value={searchValues[field.id] || ''}
                      onChangeText={(value) => handleFieldChange(field.id, value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        color: '#FFFFFF',
                        fontSize: 16,
                      }}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                        {field.options.find(opt => opt.value === searchValues[field.id])?.label || field.placeholder || 'Select...'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Search Button */}
            <TouchableOpacity
              onPress={handleSearch}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      Search Prices
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          {hasSearched && !loading && (
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
              padding: 24,
            }}>
              {results.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="information-circle-outline" size={48} color="#64748B" />
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 16,
                    marginTop: 16,
                    textAlign: 'center',
                  }}>
                    No results found. Try adjusting your search criteria.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#E2E8F0',
                    marginBottom: 16,
                  }}>
                    Results
                  </Text>
                  {/* Table will be rendered here when results are available */}
                  <Text style={{ color: '#94A3B8', textAlign: 'center', paddingVertical: 20 }}>
                    Results table coming soon...
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

