/**
 * Food Delivery Layout - Custom Form Matching Figma Design
 * 
 * Features:
 * - "Enter Your Order Details" form
 * - Restaurant Name input
 * - ZIP Code input with map pin icon
 * - Add Order Items section with dynamic item list
 * - Item name and price inputs
 * - Add item button with plus icon
 * - Auto-fill suggestions helper text
 * - Compare Prices button
 * - Reset button
 */

import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from "@/components/AppHeader";
import CurrentCategoryBar from "@/components/CurrentCategoryBar";
import BottomNav from "@/components/BottomNav";
import CategoryAdCard from "@/components/CategoryAdCard";
import { getIconName } from '@/utils/iconMapper';

interface FoodDeliveryLayoutProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  iconGradient: string[];
}

interface OrderItem {
  id: string;
  name: string;
  price: string;
}

export default function FoodDeliveryLayout({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryIcon,
  iconGradient,
}: FoodDeliveryLayoutProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: '1', name: '', price: '' }
  ]);

  const iconName = getIconName(categoryIcon);

  const handleAddItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      price: '',
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: 'name' | 'price', value: string) => {
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleComparePrices = () => {
    if (!restaurantName.trim()) {
      Alert.alert('Missing Information', 'Please enter a restaurant name.');
      return;
    }

    if (!zipCode.trim()) {
      Alert.alert('Missing Information', 'Please enter a ZIP code.');
      return;
    }

    const validItems = orderItems.filter(item => item.name.trim() && item.price.trim());
    if (validItems.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one order item with name and price.');
      return;
    }

    // Here you would typically call an API to compare prices
    Alert.alert(
      'Compare Prices',
      `Comparing prices for ${restaurantName}...\n\nThis would connect to your food delivery price comparison API.`,
      [{ text: 'OK' }]
    );
  };

  const handleReset = () => {
    setRestaurantName('');
    setZipCode('');
    setOrderItems([{ id: '1', name: '', price: '' }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
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

          {/* Order Details Form */}
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
              <Ionicons name="search-outline" size={20} color={iconGradient[0]} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#E2E8F0',
              }}>
                Enter Your Order Details
              </Text>
            </View>

            {/* Restaurant Details Section */}
            <View style={{ marginBottom: 24 }}>
              {/* Restaurant Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#E2E8F0',
                  marginBottom: 8,
                }}>
                  Restaurant Name
                </Text>
                <TextInput
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="e.g., McDonald's, Chipotle, Olive Garden"
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
              <View>
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
            </View>

            {/* Order Items Section */}
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#E2E8F0',
                marginBottom: 16,
              }}>
                Add Order Items
              </Text>

              {/* Order Items List */}
              {orderItems.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#1F2937',
                    }}>
                      Item {index + 1}
                    </Text>
                    {orderItems.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id)}
                        style={{
                          padding: 4,
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Item Name */}
                  <View style={{ marginBottom: 12 }}>
                    <TextInput
                      value={item.name}
                      onChangeText={(value) => handleItemChange(item.id, 'name', value)}
                      placeholder="Item name (e.g., Big Mac)"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 16,
                      }}
                    />
                  </View>

                  {/* Price */}
                  <View>
                    <TextInput
                      value={item.price}
                      onChangeText={(value) => handleItemChange(item.id, 'price', value)}
                      placeholder="Price"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>
              ))}

              {/* Add Item Button */}
              <TouchableOpacity
                onPress={handleAddItem}
                activeOpacity={0.8}
                style={{
                  marginTop: 8,
                  marginBottom: 12,
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Helper Text */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                marginTop: 8,
              }}>
                <Ionicons name="sparkles-outline" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
                <Text style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  lineHeight: 18,
                  flex: 1,
                }}>
                  Type an item name to see auto-fill suggestions with prices from our database.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 24,
            }}>
              {/* Compare Prices Button */}
              <TouchableOpacity
                onPress={handleComparePrices}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#06B6D4']}
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

          {/* Ready to Compare Section */}
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
              <Ionicons name="restaurant" size={32} color="#FFFFFF" />
            </LinearGradient>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Ready to Compare?
            </Text>

            {/* Instructional Text */}
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 20,
            }}>
              Add your order items and location, then click "Compare Prices" to see which delivery platform offers the best deal
            </Text>

            {/* Platform Indicators */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 16,
              width: '100%',
            }}>
              <View style={{ alignItems: 'center', width: '45%' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#EF4444',
                  marginBottom: 4,
                }} />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>
                  DoorDash
                </Text>
              </View>
              <View style={{ alignItems: 'center', width: '45%' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#F97316',
                  marginBottom: 4,
                }} />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>
                  GrubHub
                </Text>
              </View>
              <View style={{ alignItems: 'center', width: '45%' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#10B981',
                  marginBottom: 4,
                }} />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>
                  Uber Eats
                </Text>
              </View>
              <View style={{ alignItems: 'center', width: '45%' }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#1F2937',
                  marginBottom: 4,
                }} />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>
                  Postmates
                </Text>
              </View>
            </View>
          </View>

          {/* Money-Saving Tips Section */}
          <View style={{
            backgroundColor: '#E0F2FE',
            borderRadius: 16,
            borderLeftWidth: 4,
            borderTopWidth: 4,
            borderColor: '#06B6D4',
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
              <Ionicons name="flash" size={20} color="#06B6D4" />
              <Ionicons name="bulb" size={20} color="#FBBF24" />
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1F2937',
              }}>
                Money-Saving Tips for Food Delivery
              </Text>
            </View>

            {/* Tips List */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#1E40AF', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20, flex: 1 }}>
                  Sign up for DashPass, Eats Pass, or Grubhub+ if you order 2+ times per month
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#1E40AF', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20, flex: 1 }}>
                  Menu prices are often 15-25% higher on delivery apps than in-restaurant
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#1E40AF', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20, flex: 1 }}>
                  Picking up your order yourself can save $10-15 in fees per order
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, color: '#1E40AF', marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20, flex: 1 }}>
                  Check for credit card cashback offers (Amex, Chase) on specific platforms
                </Text>
              </View>
            </View>
          </View>

          {/* DashPass Promotional Card */}
          <View style={{
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 24,
            position: 'relative',
            backgroundColor: '#FFFFFF',
          }}>
            {/* Top Benefits Row */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 16,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  Lower service fees
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  Cancel anytime
                </Text>
              </View>
            </View>

            {/* Start Free Trial Button */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('DashPass', 'Redirecting to DashPass signup...');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
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
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}>
                    Start Free Trial
                  </Text>
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Main Card */}
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ padding: 24, position: 'relative' }}
            >
              {/* Advertisement Label */}
              <View style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
                <Text style={{
                  fontSize: 11,
                  color: '#6B7280',
                  fontWeight: '600',
                }}>
                  Advertisement
                </Text>
              </View>

              {/* Icon */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="restaurant" size={48} color="#FFFFFF" />
              </View>

              {/* 30 Days Free Trial */}
              <Text style={{
                fontSize: 32,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                30 Days
              </Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 24,
              }}>
                Free Trial
              </Text>

              {/* Pricing Section */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                  Then only
                </Text>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                  $9.99/mo
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#FFFFFF',
                  textAlign: 'center',
                }}>
                  or <Text style={{ fontWeight: '700' }}>$96/year</Text>{' '}
                  <Text style={{ fontSize: 12, opacity: 0.9 }}>(save $24)</Text>
                </Text>
              </LinearGradient>

              {/* Features */}
              <View style={{ gap: 12, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="bag-outline" size={20} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>
                    600K+ restaurants
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="car-outline" size={20} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>
                    Fastest delivery
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>
                    Members-only deals
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Disclaimer */}
          <Text style={{
            fontSize: 11,
            color: '#94A3B8',
            textAlign: 'center',
            lineHeight: 16,
            marginBottom: 24,
            paddingHorizontal: 16,
          }}>
            Free trial for new DashPass members only. $0 delivery fee on orders $12+. Auto-renewal at $9.99/mo unless canceled. PriceLens may earn a commission from partner links.
          </Text>

          {/* Sponsored ad at bottom – category-specific */}
          <CategoryAdCard categorySlug={categorySlug} />
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
