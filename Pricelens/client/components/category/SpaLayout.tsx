/**
 * Spa Layout - Custom Form Matching Figma Design
 * 
 * Features:
 * - "Find Spa Services" form
 * - Service description input
 * - ZIP Code input with location pin icon
 * - Popular Services section with selectable service buttons
 * - Compare Prices button with gradient
 * - Reset button
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import AppHeader from "@/components/AppHeader";
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import BottomNav from "@/components/BottomNav";
import { theme } from '@/constants/theme';
import CategoryAdCard from "@/components/CategoryAdCard";
import { getIconName } from '@/utils/iconMapper';

interface SpaLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

interface PopularService {
  id: string;
  label: string;
  icon?: string;
  gradient?: string[];
}

const POPULAR_SERVICES: PopularService[] = [
  { id: 'swedish60', label: '60-min Swedish Massage', icon: 'spa-outline', gradient: ['#8B5CF6', '#EC4899'] },
  { id: 'deepTissue60', label: '60-min Deep Tissue', icon: 'fitness-outline', gradient: ['#3B82F6', '#06B6D4'] },
  { id: 'facial', label: 'Facial Treatment', icon: 'flower-outline', gradient: ['#EC4899', '#F97316'] },
  { id: 'manicurePedicure', label: 'Manicure & Pedicure', icon: 'hand-right-outline', gradient: ['#F97316', '#FBBF24'] },
  { id: 'hotStone', label: 'Hot Stone Massage', icon: 'flame-outline', gradient: ['#EF4444', '#F97316'] },
  { id: 'bodyScrub', label: 'Body Scrub', icon: 'water-outline', gradient: ['#06B6D4', '#3B82F6'] },
  { id: 'couples', label: 'Couples Massage', icon: 'heart-outline', gradient: ['#EC4899', '#8B5CF6'] },
  { id: 'aromatherapy', label: 'Aromatherapy Massage', icon: 'leaf-outline', gradient: ['#10B981', '#06B6D4'] },
  { id: 'reflexology', label: 'Reflexology', icon: 'footsteps-outline', gradient: ['#8B5CF6', '#3B82F6'] },
  { id: 'prenatal', label: 'Prenatal Massage', icon: 'baby-outline', gradient: ['#EC4899', '#F472B6'] },
  { id: 'sports', label: 'Sports Massage', icon: 'barbell-outline', gradient: ['#3B82F6', '#06B6D4'] },
  { id: 'thai', label: 'Thai Massage', icon: 'body-outline', gradient: ['#F97316', '#EF4444'] },
];

interface ServiceResult {
  id: string;
  name: string;
  businessName: string;
  address: string;
  distance: string;
  rating?: number;
  reviewCount?: number;
  price?: string;
  priceRange?: string;
  phone?: string;
  website?: string;
  hours?: string;
}

export default function SpaLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: SpaLayoutProps) {
  const [serviceDescription, setServiceDescription] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedPopularService, setSelectedPopularService] = useState<string | null>(null);
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const iconName = getIconName(categoryIcon);

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handlePopularServiceClick = async (serviceId: string) => {
    if (!zipCode.trim()) {
      Alert.alert('Missing ZIP Code', 'Please enter a ZIP code to search for spa services.');
      return;
    }

    const service = POPULAR_SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    setSelectedPopularService(serviceId);
    setLoading(true);
    setHasSearched(true);

    try {
      const { API_ENDPOINTS } = require('../../constants/api');
      const apiUrl = API_ENDPOINTS.services.providers(
        categorySlug,
        serviceId,
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
      // Fallback to mock data for demo
      setResults(generateMockResults(service.label, zipCode));
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = (serviceName: string, zip: string): ServiceResult[] => {
    const mockSpas = [
      'Massage Envy',
      'Hand & Stone Massage',
      'Burke Williams Day Spa',
      'The Spa at Four Seasons',
      'Bliss Spa',
      'Local Day Spa',
      'Serenity Spa & Wellness',
      'Tranquil Touch Massage',
    ];

    return mockSpas.slice(0, 6).map((spa, index) => ({
      id: `spa-${index}`,
      name: spa,
      businessName: spa,
      address: `${Math.floor(Math.random() * 9999) + 1000} Main St, ZIP ${zip}`,
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`,
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 200 + 50),
      price: `$${Math.floor(Math.random() * 50 + 60)}`,
      priceRange: `$${Math.floor(Math.random() * 30 + 50)}-$${Math.floor(Math.random() * 50 + 100)}`,
      phone: `(${Math.floor(Math.random() * 900 + 100)}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      hours: 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM',
    }));
  };

  const handleComparePrices = () => {
    if (!zipCode.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code.');
      return;
    }

    if (!serviceDescription.trim() && selectedServices.size === 0) {
      Alert.alert('Missing Information', 'Please enter a service description or select a popular service.');
      return;
    }

    // Here you would typically call an API to search for spa services
    const selectedServiceNames = Array.from(selectedServices)
      .map(id => POPULAR_SERVICES.find(s => s.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    Alert.alert(
      'Compare Prices',
      `Comparing spa prices in ${zipCode}...\n\n${serviceDescription ? `Service: ${serviceDescription}\n` : ''}${selectedServiceNames ? `Selected: ${selectedServiceNames}` : ''}\n\nThis would connect to your spa services search API.`,
      [{ text: 'OK' }]
    );
  };

  const handleReset = () => {
    setServiceDescription('');
    setZipCode('');
    setSelectedServices(new Set());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.appHeaderSolid }}>
      <AppHeader />
      <CurrentCategoryBar categoryName={categoryName} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{
            backgroundColor: theme.colors.background.appHeader,
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

          {/* Find Spa Services Form */}
          <View style={{
            backgroundColor: theme.colors.background.appHeader,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 24,
            marginBottom: 24,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
            }}>
              <Ionicons name="navigate-outline" size={20} color={iconGradient[0]} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#E2E8F0',
              }}>
                Find Spa Services
              </Text>
            </View>

            {/* Service Description Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 8,
              }}>
                What service do you want?
              </Text>
              <TextInput
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="e.g., Massage, Facial, Manicure"
                placeholderTextColor="#64748B"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(96, 165, 250, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                }}
              />
            </View>

            {/* ZIP Code */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Ionicons name="location-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  ZIP Code
                </Text>
              </View>
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
                  paddingVertical: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                }}
              />
            </View>

            {/* Popular Services Section */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <Ionicons name="navigate-outline" size={18} color={iconGradient[0]} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#E2E8F0',
                }}>
                  Popular Services
                </Text>
              </View>

              {/* Service Buttons Grid */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {POPULAR_SERVICES.map((service) => {
                  const isSelected = selectedServices.has(service.id);
                  const isActive = selectedPopularService === service.id;
                  const serviceGradient = service.gradient || iconGradient;
                  
                  return (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => handlePopularServiceClick(service.id)}
                      activeOpacity={0.8}
                      style={{
                        minWidth: '45%',
                        borderRadius: 16,
                        overflow: 'hidden',
                        shadowColor: isActive ? serviceGradient[0] : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isActive ? 0.3 : 0.1,
                        shadowRadius: 8,
                        elevation: isActive ? 8 : 2,
                      }}
                    >
                      <LinearGradient
                        colors={isActive || isSelected 
                          ? serviceGradient 
                          : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          padding: 16,
                          borderWidth: isActive ? 2 : 1,
                          borderColor: isActive 
                            ? serviceGradient[0] 
                            : isSelected
                            ? iconGradient[0]
                            : 'rgba(96, 165, 250, 0.2)',
                          borderRadius: 16,
                        }}
                      >
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 8,
                        }}>
                          {service.icon && (
                            <Ionicons 
                              name={service.icon as any} 
                              size={20} 
                              color={isActive || isSelected ? '#FFFFFF' : iconGradient[0]} 
                            />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              color: isActive || isSelected ? '#FFFFFF' : '#E2E8F0',
                              fontSize: 13,
                              fontWeight: isActive || isSelected ? '700' : '600',
                              lineHeight: 18,
                            }} numberOfLines={2}>
                              {service.label}
                            </Text>
                          </View>
                        </View>
                        {isActive && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                          }}>
                            <Ionicons name="arrow-forward-circle" size={14} color="#FFFFFF" />
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: '500',
                            }}>
                              View Results
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              {/* Compare Prices Button */}
              <TouchableOpacity
                onPress={handleComparePrices}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Compare Prices
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={handleReset}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(96, 165, 250, 0.3)',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  color: '#60a5fa',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ready to Relax Section */}
          <View style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: '#FFFFFF',
            padding: 24,
            marginBottom: 24,
            alignItems: 'center',
          }}>
            {/* Icon */}
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            </LinearGradient>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Ready to Relax?
            </Text>

            {/* Description */}
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 20,
            }}>
              Enter your desired spa service and ZIP code to compare prices from local spas.
            </Text>

            {/* Suggested Spa Buttons */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
            }}>
              {['Massage Envy', 'Hand & Stone', 'Burke Williams', 'The Spa at Four Seasons', 'Bliss Spa', 'Local Day Spa'].map((spaName) => (
                <TouchableOpacity
                  key={spaName}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: iconGradient[0],
                    backgroundColor: 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: iconGradient[0],
                    fontWeight: '500',
                  }}>
                    {spaName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spa Money-Saving Tips Section */}
          <View style={{
            backgroundColor: '#1E3A5F',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}>
              <Ionicons name="trending-up-outline" size={20} color="#60a5fa" />
              <Ionicons name="bulb-outline" size={20} color="#60a5fa" />
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#E2E8F0',
              }}>
                Spa Money-Saving Tips
              </Text>
            </View>

            {/* Tips List */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#E2E8F0', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 20, flex: 1 }}>
                  Membership programs (like Massage Envy) can save 30-50% on regular visits
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#E2E8F0', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 20, flex: 1 }}>
                  Book appointments during off-peak hours
                </Text>
              </View>
            </View>
          </View>

          {/* Results Section */}
          {hasSearched && selectedPopularService && (
            <View style={{
              backgroundColor: theme.colors.background.appHeader,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.1)',
              padding: 24,
              marginBottom: 24,
            }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={iconGradient[0]} />
                  <Text style={{
                    color: '#94A3B8',
                    fontSize: 14,
                    marginTop: 16,
                  }}>
                    Finding spa services near you...
                  </Text>
                </View>
              ) : results.length === 0 ? (
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
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: '#E2E8F0',
                    }}>
                      {POPULAR_SERVICES.find(s => s.id === selectedPopularService)?.label}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPopularService(null);
                        setResults([]);
                        setHasSearched(false);
                      }}
                      style={{
                        padding: 8,
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                    marginBottom: 16,
                  }}>
                    {results.length} spa{results.length !== 1 ? 's' : ''} found near {zipCode}
                  </Text>

                  {/* Service Cards */}
                  <View style={{ gap: 16 }}>
                    {results.map((result, index) => (
                      <View
                        key={result.id}
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

                        {/* Spa Name & Rating */}
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
                            flex: 1,
                          }} numberOfLines={1}>
                            {result.name || result.businessName}
                          </Text>
                          
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
                            {result.address}
                          </Text>
                          {result.distance && (
                            <View style={{
                              backgroundColor: 'rgba(96, 165, 250, 0.1)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                            }}>
                              <Text style={{
                                color: '#60a5fa',
                                fontSize: 12,
                                fontWeight: '600',
                              }}>
                                {result.distance}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Price */}
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
                              Contact for pricing
                            </Text>
                          )}

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {result.phone && (
                              <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${result.phone}`)}
                                style={{
                                  backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                  borderRadius: 8,
                                  padding: 8,
                                }}
                              >
                                <Ionicons name="call" size={16} color="#60a5fa" />
                              </TouchableOpacity>
                            )}
                            {result.website && (
                              <TouchableOpacity
                                onPress={() => {
                                  const url = result.website!.startsWith('http') 
                                    ? result.website 
                                    : `https://${result.website}`;
                                  Linking.openURL(url);
                                }}
                                style={{
                                  backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                  borderRadius: 8,
                                  padding: 8,
                                }}
                              >
                                <Ionicons name="globe" size={16} color="#60a5fa" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sponsored ad at bottom – category-specific */}
          <CategoryAdCard categorySlug={categorySlug} />
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
