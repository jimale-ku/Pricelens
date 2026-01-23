/**
 * Pattern C Layout - Service Listings
 * 
 * Used by: Haircuts, Massage Parlors, Nail Salons, Spa Services, Apartments,
 * Moving Companies, Storage Units, Food Delivery, Services
 * 
 * Features:
 * - Service type selector (big buttons)
 * - Location search (ZIP code)
 * - Service cards (not table, not product cards)
 * - Ratings & reviews (stars, review count)
 * - Business info (hours, address, distance)
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { getIconName } from '@/utils/iconMapper';

interface ServiceType {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
}

interface PatternCLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
  
  // Service types for this category
  serviceTypes?: ServiceType[];
  
  // Default service type
  defaultServiceType?: string;
}

export default function PatternCLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
  serviceTypes = [],
  defaultServiceType,
}: PatternCLayoutProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<string>(defaultServiceType || serviceTypes[0]?.id || '');
  const [zipCode, setZipCode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when category changes (without remounting component)
  useEffect(() => {
    setSelectedServiceType(defaultServiceType || serviceTypes[0]?.id || '');
    setZipCode('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
  }, [categorySlug, defaultServiceType, serviceTypes]);

  const iconName = getIconName(categoryIcon);

  const handleSearch = async () => {
    if (!zipCode.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code to search.');
      return;
    }

    if (!selectedServiceType) {
      Alert.alert('Missing Information', 'Please select a service type.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { API_ENDPOINTS } = require('../../constants/api');
      const apiUrl = API_ENDPOINTS.services.providers(
        categorySlug,
        selectedServiceType,
        zipCode
      );

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

          {/* Service Type Selector */}
          {serviceTypes.length > 0 && (
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
                Select Service Type
              </Text>

              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {serviceTypes.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setSelectedServiceType(service.id)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      padding: 20,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedServiceType === service.id 
                        ? iconGradient[0] 
                        : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor: selectedServiceType === service.id
                        ? `${iconGradient[0]}20`
                        : 'rgba(255, 255, 255, 0.05)',
                      alignItems: 'center',
                    }}
                  >
                    {service.emoji && (
                      <Text style={{ fontSize: 32, marginBottom: 8 }}>
                        {service.emoji}
                      </Text>
                    )}
                    {service.icon && (
                      <Ionicons 
                        name={service.icon as any} 
                        size={32} 
                        color={selectedServiceType === service.id ? iconGradient[0] : '#94A3B8'} 
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    <Text style={{
                      color: selectedServiceType === service.id ? '#FFFFFF' : '#94A3B8',
                      fontSize: 16,
                      fontWeight: selectedServiceType === service.id ? '600' : '400',
                      textAlign: 'center',
                    }}>
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Location Search */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter ZIP code"
                placeholderTextColor="#64748B"
                style={{
                  flex: 1,
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
              <TouchableOpacity
                onPress={handleSearch}
                activeOpacity={0.8}
                disabled={loading}
                style={{
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LinearGradient
                  colors={iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      Search
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
                    {results.length} Results Near You
                  </Text>
                  
                  {/* Service Cards */}
                  <View style={{ gap: 16 }}>
                    {results.map((result, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: index === 0 
                            ? 'rgba(251, 191, 36, 0.3)' 
                            : 'rgba(148, 163, 184, 0.1)',
                          padding: 20,
                          position: 'relative',
                        }}
                      >
                        {/* Best Deal Badge */}
                        {index === 0 && (
                          <View style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: '#FBBF24',
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}>
                            <Text style={{
                              color: '#000000',
                              fontSize: 12,
                              fontWeight: '700',
                            }}>
                              🏆 Best Deal
                            </Text>
                          </View>
                        )}
                        
                        {/* Business Name & Rating */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                          paddingRight: index === 0 ? 80 : 0,
                        }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: '#E2E8F0',
                          }}>
                            {result.name || result.businessName || 'Business Name'}
                          </Text>
                          
                          {/* Rating Stars */}
                          {result.rating && (
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <Ionicons name="star" size={16} color="#FBBF24" />
                              <Text style={{
                                color: '#E2E8F0',
                                fontSize: 14,
                                fontWeight: '600',
                              }}>
                                {result.rating}
                              </Text>
                              {result.reviewCount && (
                                <Text style={{
                                  color: '#94A3B8',
                                  fontSize: 12,
                                }}>
                                  ({result.reviewCount})
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                        
                        {/* Address & Distance */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 12,
                        }}>
                          <Ionicons name="location" size={16} color="#94A3B8" />
                          <Text style={{
                            color: '#94A3B8',
                            fontSize: 14,
                            flex: 1,
                          }} numberOfLines={1}>
                            {result.address || 'Address not available'}
                          </Text>
                          {result.distance && (
                            <Text style={{
                              color: '#60a5fa',
                              fontSize: 14,
                              fontWeight: '500',
                            }}>
                              {result.distance}
                            </Text>
                          )}
                        </View>
                        
                        {/* Hours */}
                        {result.hours && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 12,
                          }}>
                            <Ionicons name="time" size={16} color="#94A3B8" />
                            <Text style={{
                              color: '#94A3B8',
                              fontSize: 14,
                            }}>
                              {result.hours}
                            </Text>
                          </View>
                        )}
                        
                        {/* Pricing */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(148, 163, 184, 0.1)',
                        }}>
                          {result.priceRange ? (
                            <Text style={{
                              color: '#E2E8F0',
                              fontSize: 16,
                              fontWeight: '600',
                            }}>
                              {result.priceRange}
                            </Text>
                          ) : result.price ? (
                            <Text style={{
                              color: '#E2E8F0',
                              fontSize: 16,
                              fontWeight: '600',
                            }}>
                              {result.price}
                            </Text>
                          ) : (
                            <Text style={{
                              color: '#94A3B8',
                              fontSize: 14,
                            }}>
                              Price varies
                            </Text>
                          )}
                          
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: 'rgba(96, 165, 250, 0.1)',
                              borderRadius: 8,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(96, 165, 250, 0.3)',
                            }}
                          >
                            <Text style={{
                              color: '#60a5fa',
                              fontSize: 14,
                              fontWeight: '600',
                            }}>
                              View Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
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

