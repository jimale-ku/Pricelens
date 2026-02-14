/**
 * Tires Layout - Custom Layout Matching Figma Design
 * 
 * Features:
 * - "Tires Price Comparison" title with car icon
 * - Vehicle information form (Year, Make, Model, Tire Size, Zip Code)
 * - "Find Tires" button
 * - Tip box about tire size
 * - Results table
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import BottomNav from "@/components/BottomNav";

interface TiresLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

export default function TiresLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: TiresLayoutProps) {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [tireSize, setTireSize] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when category changes
  useEffect(() => {
    setYear('');
    setMake('');
    setModel('');
    setTireSize('');
    setZipCode('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
  }, [categorySlug]);

  const handleSearch = async () => {
    // Validate required fields
    if (!year?.trim()) {
      Alert.alert('Missing Information', 'Please enter the vehicle year.');
      return;
    }
    if (!make?.trim()) {
      Alert.alert('Missing Information', 'Please enter the vehicle make.');
      return;
    }
    if (!model?.trim()) {
      Alert.alert('Missing Information', 'Please enter the vehicle model.');
      return;
    }
    if (!zipCode?.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { API_ENDPOINTS } = require('../../constants/api');
      const apiUrl = API_ENDPOINTS.services.search(categorySlug, {
        year,
        make,
        model,
        tireSize: tireSize || undefined,
        zipCode,
      });

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
      <CurrentCategoryBar categoryName={categoryName} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        bounces={false}
        scrollEventThrottle={16}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          {/* Tires Price Comparison Section */}
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

            {/* Title with Car Icon */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              position: 'relative',
              zIndex: 10,
            }}>
              <Ionicons name="car" size={24} color={iconGradient[0]} />
              <MaskedView
                maskElement={
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    lineHeight: 32,
                  }}>
                    Tires Price Comparison
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
                    Tires Price Comparison
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            {/* Subtitle */}
            <Text style={{
              fontSize: 14,
              color: '#94A3B8',
              lineHeight: 20,
              position: 'relative',
              zIndex: 10,
            }}>
              Compare tire prices from top retailers and installers.
            </Text>
          </View>

          {/* Find Tires for Your Vehicle Section */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            {/* Section Title */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}>
              <Ionicons name="search" size={20} color={iconGradient[0]} />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#E2E8F0',
              }}>
                Find Tires for Your Vehicle
              </Text>
            </View>

            {/* Input Fields - First Row */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Year *
                </Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="e.g., 2020"
                  placeholderTextColor="#64748B"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Make *
                </Text>
                <TextInput
                  value={make}
                  onChangeText={setMake}
                  placeholder="e.g., Toyota"
                  placeholderTextColor="#64748B"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Model *
                </Text>
                <TextInput
                  value={model}
                  onChangeText={setModel}
                  placeholder="e.g., RAV4"
                  placeholderTextColor="#64748B"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            {/* Input Fields - Second Row */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16,
              alignItems: 'flex-end',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Tire Size (Optional)
                </Text>
                <TextInput
                  value={tireSize}
                  onChangeText={setTireSize}
                  placeholder="e.g., P225/65R17"
                  placeholderTextColor="#64748B"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Zip Code *
                </Text>
                <TextInput
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="e.g., 90210"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Find Tires Button - Same width as Model field (flex: 1) */}
              <View style={{ flex: 1 }}>
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
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48, // Match input field height
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
                        Find Tires
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tip Box */}
            <View style={{
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <Ionicons name="bulb" size={20} color="#FBBF24" />
              <Text style={{
                color: '#E2E8F0',
                fontSize: 14,
                lineHeight: 20,
                flex: 1,
              }}>
                Tip: Don't know your tire size? Check the sidewall of your current tire or your vehicle's door jamb sticker.
              </Text>
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
              marginBottom: 24,
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
                    {results.length} Results Found
                  </Text>
                  
                  {/* Results Table */}
                  <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.1)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    {/* Table Header */}
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: 'rgba(148, 163, 184, 0.05)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                    }}>
                      <View style={{ flex: 0.5, padding: 12 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Rank</Text>
                      </View>
                      <View style={{ flex: 2, padding: 12 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Shop</Text>
                      </View>
                      <View style={{ flex: 2, padding: 12 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Address</Text>
                      </View>
                      <View style={{ flex: 1.5, padding: 12 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Price</Text>
                      </View>
                      <View style={{ flex: 1, padding: 12 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Distance</Text>
                      </View>
                    </View>

                    {/* Table Rows */}
                    {results.map((result, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          borderBottomWidth: index < results.length - 1 ? 1 : 0,
                          borderBottomColor: 'rgba(148, 163, 184, 0.1)',
                          backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                        }}
                      >
                        <View style={{ flex: 0.5, padding: 12 }}>
                          <Text style={{ color: '#E2E8F0', fontSize: 14 }}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 2, padding: 12 }}>
                          <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>
                            {result.shop || result.name || 'N/A'}
                          </Text>
                        </View>
                        <View style={{ flex: 2, padding: 12 }}>
                          <Text style={{ color: '#94A3B8', fontSize: 12 }} numberOfLines={2}>
                            {result.address || 'N/A'}
                          </Text>
                        </View>
                        <View style={{ flex: 1.5, padding: 12 }}>
                          <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '600' }}>
                            {result.price || 'N/A'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, padding: 12 }}>
                          <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                            {result.distance || 'N/A'}
                          </Text>
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
