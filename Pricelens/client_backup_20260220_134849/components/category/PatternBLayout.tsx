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

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Pressable, Linking, Image } from "react-native";
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import BottomNav from "@/components/BottomNav";
import { getIconName } from '@/utils/iconMapper';
import { trackEvent } from '@/utils/analytics';

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
  
  // Table column configuration
  tableColumns?: Array<{
    id: string;
    label: string;
    width?: string | number;
  }>;
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
  tableColumns,
}: PatternBLayoutProps) {
  // Initialize state with defaultSearchValues or empty object
  const initialSearchValues = defaultSearchValues || {};
  const [searchValues, setSearchValues] = useState<Record<string, string>>(initialSearchValues);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
  
  // Use refs to track previous values and avoid infinite loops
  const prevCategorySlugRef = useRef<string>(categorySlug);
  const prevDefaultSearchValuesStrRef = useRef<string>('');

  // Reset state when category changes (without remounting component)
  // Only reset when categorySlug actually changes, not when defaultSearchValues object reference changes
  useEffect(() => {
    const currentDefaultSearchValues = defaultSearchValues || {};
    const currentDefaultSearchValuesStr = JSON.stringify(currentDefaultSearchValues);
    
    // Only reset if categorySlug actually changed
    const categoryChanged = prevCategorySlugRef.current !== categorySlug;
    
    // Only reset if defaultSearchValues content actually changed (not just object reference)
    const defaultValuesChanged = prevDefaultSearchValuesStrRef.current !== currentDefaultSearchValuesStr;
    
    if (categoryChanged || defaultValuesChanged) {
      prevCategorySlugRef.current = categorySlug;
      prevDefaultSearchValuesStrRef.current = currentDefaultSearchValuesStr;
      
      // Only update state if values actually changed to prevent unnecessary re-renders
      const currentSearchValuesStr = JSON.stringify(searchValues);
      if (currentSearchValuesStr !== currentDefaultSearchValuesStr) {
        setSearchValues(currentDefaultSearchValues);
      }
      
      // Always reset these when category changes
      if (categoryChanged) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        setDropdownVisible(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]); // Only depend on categorySlug - defaultSearchValues comparison is done inside

  const iconName = getIconName(categoryIcon);

  const handleSearch = async () => {
    // Special validation for airfare (doesn't need ZIP code)
    if (categorySlug === 'airfare') {
      if (!searchValues.origin?.trim() || !searchValues.destination?.trim()) {
        Alert.alert('Missing Information', 'Please enter both origin and destination.');
        return;
      }
      if (!searchValues.departDate?.trim()) {
        Alert.alert('Missing Information', 'Please select a departure date.');
        return;
      }
    } else {
      // Validate required fields for other categories
      const zipCode = searchValues.zipCode || searchValues.location;
      if (!zipCode?.trim()) {
        Alert.alert('Missing Information', 'Please enter a ZIP code to search.');
        return;
      }
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Build API URL based on category
      let apiUrl: string;
      
      if (categorySlug === 'gas-stations') {
        const { API_ENDPOINTS } = require('../../constants/api');
        apiUrl = API_ENDPOINTS.services.gasStations(zipCode, searchValues.gasType);
      } else if (categorySlug === 'gym') {
        const { API_ENDPOINTS } = require('../../constants/api');
        apiUrl = API_ENDPOINTS.services.gyms(zipCode, searchValues.membershipType);
      } else if (categorySlug === 'oil-changes') {
        const { API_ENDPOINTS } = require('../../constants/api');
        apiUrl = API_ENDPOINTS.services.oilChanges(zipCode, searchValues.vehicleType);
      } else if (categorySlug === 'hotels') {
        const { API_ENDPOINTS } = require('../../constants/api');
        apiUrl = API_ENDPOINTS.services.hotels(
          searchValues.location || zipCode,
          searchValues.checkIn,
          searchValues.checkOut,
          searchValues.guests ? parseInt(searchValues.guests) : undefined
        );
      } else if (categorySlug === 'airfare') {
        const { API_ENDPOINTS } = require('../../constants/api');
        if (!searchValues.origin || !searchValues.destination) {
          Alert.alert('Missing Information', 'Please enter both origin and destination.');
          setLoading(false);
          return;
        }
        apiUrl = API_ENDPOINTS.services.airfare(
          searchValues.origin,
          searchValues.destination,
          searchValues.departDate,
          searchValues.returnDate,
          searchValues.passengers ? parseInt(searchValues.passengers) : undefined
        );
      } else {
        // Generic search for other Pattern B categories
        const { API_ENDPOINTS } = require('../../constants/api');
        const searchParams: Record<string, string> = { zipCode };
        // Add all other search values
        Object.keys(searchValues).forEach(key => {
          if (key !== 'zipCode' && searchValues[key]) {
            searchParams[key] = searchValues[key];
          }
        });
        apiUrl = API_ENDPOINTS.services.search(categorySlug, searchParams);
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      
      // Track service search analytics
      const zipCode = searchValues.zipCode || searchValues.location || '';
      trackEvent({
        eventType: 'service_search',
        categorySlug,
        categoryName,
        serviceCategory: categorySlug,
        searchQuery: categorySlug,
        metadata: {
          zipCode: zipCode.trim(),
          ...searchValues,
        },
      });
    } catch (error: any) {
      console.error('❌ Search error:', error);
      Alert.alert(
        'Search Error',
        error.message || 'Failed to search. Please try again.',
        [{ text: 'OK' }]
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setSearchValues(prev => ({ ...prev, [fieldId]: value }));
    setDropdownVisible(null);
  };

  // Get default table columns based on category if not provided
  const getDefaultTableColumns = (): Array<{ id: string; label: string }> => {
    if (tableColumns && tableColumns.length > 0) return tableColumns;
    
    // Default columns based on category slug
    const defaultColumns: Record<string, Array<{ id: string; label: string }>> = {
      'gas-stations': [
        { id: 'rank', label: 'Rank' },
        { id: 'station', label: 'Station' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price' },
        { id: 'distance', label: 'Distance' },
      ],
      'gym': [
        { id: 'rank', label: 'Rank' },
        { id: 'gym', label: 'Gym' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price/Month' },
        { id: 'distance', label: 'Distance' },
      ],
      'car-insurance': [
        { id: 'rank', label: 'Rank' },
        { id: 'company', label: 'Company' },
        { id: 'price', label: 'Price/Month' },
        { id: 'coverage', label: 'Coverage' },
      ],
      'renters-insurance': [
        { id: 'rank', label: 'Rank' },
        { id: 'company', label: 'Company' },
        { id: 'price', label: 'Price/Month' },
        { id: 'coverage', label: 'Coverage' },
      ],
      'tires': [
        { id: 'rank', label: 'Rank' },
        { id: 'shop', label: 'Shop' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price' },
        { id: 'distance', label: 'Distance' },
      ],
      'mattresses': [
        { id: 'rank', label: 'Rank' },
        { id: 'store', label: 'Store' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price' },
        { id: 'distance', label: 'Distance' },
      ],
      'oil-changes': [
        { id: 'rank', label: 'Rank' },
        { id: 'shop', label: 'Shop' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price' },
        { id: 'distance', label: 'Distance' },
      ],
      'car-washes': [
        { id: 'rank', label: 'Rank' },
        { id: 'location', label: 'Location' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price' },
        { id: 'distance', label: 'Distance' },
      ],
      'rental-cars': [
        { id: 'rank', label: 'Rank' },
        { id: 'company', label: 'Company' },
        { id: 'price', label: 'Price/Day' },
        { id: 'dates', label: 'Dates' },
      ],
      'hotels': [
        { id: 'rank', label: 'Rank' },
        { id: 'hotel', label: 'Hotel' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price/Night' },
        { id: 'rating', label: 'Rating' },
      ],
      'airfare': [
        { id: 'rank', label: 'Rank' },
        { id: 'airline', label: 'Airline' },
        { id: 'price', label: 'Price' },
        { id: 'times', label: 'Times' },
      ],
      'storage': [
        { id: 'rank', label: 'Rank' },
        { id: 'facility', label: 'Facility' },
        { id: 'address', label: 'Address' },
        { id: 'price', label: 'Price/Month' },
        { id: 'size', label: 'Size' },
      ],
      'meal-kits': [
        { id: 'rank', label: 'Rank' },
        { id: 'service', label: 'Service' },
        { id: 'price', label: 'Price/Week' },
        { id: 'meals', label: 'Meals/Week' },
      ],
    };
    
    return defaultColumns[categorySlug] || [
      { id: 'rank', label: 'Rank' },
      { id: 'name', label: 'Name' },
      { id: 'price', label: 'Price' },
    ];
  };

  const columns = getDefaultTableColumns();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <AppHeader />
      <CurrentCategoryBar categoryName={categoryName} />
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
                    <TouchableOpacity
                      onPress={() => setDropdownVisible(dropdownVisible === field.id ? null : field.id)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                        {field.options.find(opt => opt.value === searchValues[field.id])?.label || field.placeholder || 'Select...'}
                      </Text>
                      <Ionicons 
                        name={dropdownVisible === field.id ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#94A3B8" 
                      />
                    </TouchableOpacity>
                  ) : null}
                  
                  {/* Dropdown Modal */}
                  {field.type === 'select' && dropdownVisible === field.id && field.options && (
                    <Modal
                      transparent={true}
                      visible={true}
                      animationType="fade"
                      onRequestClose={() => setDropdownVisible(null)}
                    >
                      <Pressable
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={() => setDropdownVisible(null)}
                      >
                        <View
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(148, 163, 184, 0.2)',
                            minWidth: 250,
                            maxWidth: '90%',
                            maxHeight: 400,
                          }}
                          onStartShouldSetResponder={() => true}
                        >
                          <ScrollView>
                            {field.options.map((option, index) => (
                              <TouchableOpacity
                                key={option.value}
                                onPress={() => handleFieldChange(field.id, option.value)}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 12,
                                  borderBottomWidth: index !== field.options!.length - 1 ? 1 : 0,
                                  borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                                  backgroundColor: searchValues[field.id] === option.value 
                                    ? 'rgba(96, 165, 250, 0.1)' 
                                    : 'transparent',
                                }}
                              >
                                <Text style={{
                                  color: searchValues[field.id] === option.value ? '#60a5fa' : '#E2E8F0',
                                  fontSize: 16,
                                  fontWeight: searchValues[field.id] === option.value ? '500' : '400',
                                }}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </Pressable>
                    </Modal>
                  )}
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
              ) : categorySlug === 'rental-cars' && results[0]?.bookUrl ? (
                /* Rental Cars: card layout with Book CTA for referral/affiliate */
                <View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#E2E8F0',
                    marginBottom: 8,
                  }}>
                    Compare rental companies
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                    marginBottom: 16,
                  }}>
                    Tap "Book" to go to the site and complete your reservation. We may earn a referral fee.
                  </Text>
                  {results.map((result: any, index: number) => (
                    <TouchableOpacity
                      key={result.companySlug || index}
                      activeOpacity={0.85}
                      onPress={() => result.bookUrl && Linking.openURL(result.bookUrl).catch(() => {})}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(148, 163, 184, 0.15)',
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {result.companyLogo ? (
                          <Image
                            source={{ uri: result.companyLogo }}
                            style={{ width: 48, height: 48 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name="car-sport" size={28} color="#94A3B8" />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 17, fontWeight: '600', color: '#F1F5F9' }} numberOfLines={1}>
                            {result.company}
                          </Text>
                          {result.sponsored && (
                            <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#FBBF24' }}>Sponsored</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#60A5FA' }}>
                            {result.pricePerDayFormatted || result.pricePerDay || result.price}
                          </Text>
                          {result.totalEstimateFormatted && (
                            <Text style={{ fontSize: 13, color: '#94A3B8' }}>{result.totalEstimateFormatted}</Text>
                          )}
                          {result.rating != null && (
                            <Text style={{ fontSize: 13, color: '#94A3B8' }}>★ {result.rating}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); result.bookUrl && Linking.openURL(result.bookUrl).catch(() => {}); }}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: '#3B82F6',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Book</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                  <View style={{
                    marginTop: 8,
                    padding: 14,
                    backgroundColor: 'rgba(96, 165, 250, 0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.2)',
                  }}>
                    <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>
                      Prices are estimates. Final rate and availability on the provider’s site. Sponsored spots help us run the app.
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#E2E8F0',
                    marginBottom: 16,
                  }}>
                    Results ({results.length})
                  </Text>
                  
                  {/* Results Table */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{
                      borderWidth: 1,
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}>
                      {/* Table Header */}
                      <View style={{
                        flexDirection: 'row',
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
                      }}>
                        {columns.map((col, index) => (
                          <View
                            key={col.id}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              minWidth: 120,
                              borderRightWidth: index !== columns.length - 1 ? 1 : 0,
                              borderRightColor: 'rgba(148, 163, 184, 0.2)',
                            }}
                          >
                            <Text style={{
                              color: '#E2E8F0',
                              fontSize: 14,
                              fontWeight: '600',
                            }}>
                              {col.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {/* Table Rows */}
                      {results.map((result, rowIndex) => (
                        <View
                          key={rowIndex}
                          style={{
                            flexDirection: 'row',
                            backgroundColor: rowIndex % 2 === 0 
                              ? 'rgba(255, 255, 255, 0.02)' 
                              : 'transparent',
                            borderBottomWidth: rowIndex !== results.length - 1 ? 1 : 0,
                            borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                          }}
                        >
                          {columns.map((col, colIndex) => (
                            <View
                              key={col.id}
                              style={{
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                minWidth: 120,
                                borderRightWidth: colIndex !== columns.length - 1 ? 1 : 0,
                                borderRightColor: 'rgba(148, 163, 184, 0.1)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              {col.id === 'rank' && (
                                <Text style={{
                                  fontSize: 16,
                                  fontWeight: '700',
                                  color: rowIndex === 0 ? '#FBBF24' : '#94A3B8',
                                }}>
                                  {rowIndex === 0 ? '🏆' : `${rowIndex + 1}`}
                                </Text>
                              )}
                              <Text style={{
                                color: '#E2E8F0',
                                fontSize: 14,
                                flex: 1,
                              }} numberOfLines={1}>
                                {result[col.id] ?? result.pricePerDayFormatted ?? result.company ?? '-'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  
                  {/* Savings Calculator (if applicable) */}
                  {results.length > 1 && (results[0]?.price || results[0]?.pricePerDay) && (results[results.length - 1]?.price || results[results.length - 1]?.pricePerDay) && (
                    <View style={{
                      marginTop: 16,
                      padding: 16,
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(96, 165, 250, 0.2)',
                    }}>
                      <Text style={{
                        color: '#60a5fa',
                        fontSize: 14,
                        fontWeight: '600',
                        textAlign: 'center',
                      }}>
                        💰 Compare options above to find the best deal for you.
                      </Text>
                    </View>
                  )}
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

