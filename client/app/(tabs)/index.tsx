/**
 * Home Screen - PriceLens Homepage
 */

import { ScrollView, View, Text, SafeAreaView, Animated, Easing, TextInput, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from "react";
import MaskedView from '@react-native-masked-view/masked-view';
import { router } from 'expo-router';
import AppHeader from "@/components/AppHeader";
import { CATEGORY_LIST } from "@/constants/categories";
import { getIconName } from '@/utils/iconMapper';

// Helper to get gradient colors from iconColor
function getGradientFromColor(color: string): string[] {
  const colorMap: Record<string, string[]> = {
    '#10B981': ['#10B981', '#059669'], // green
    '#3B82F6': ['#3B82F6', '#2563EB'], // blue
    '#F97316': ['#F97316', '#EA580C'], // orange
    '#06B6D4': ['#06B6D4', '#0891B2'], // cyan
    '#8B5CF6': ['#8B5CF6', '#7C3AED'], // purple
    '#EF4444': ['#EF4444', '#DC2626'], // red
    '#FBBF24': ['#FBBF24', '#F59E0B'], // yellow
    '#EC4899': ['#EC4899', '#DB2777'], // pink
    '#6B7280': ['#6B7280', '#4B5563'], // gray
    '#A855F7': ['#A855F7', '#9333EA'], // violet
  };
  
  return colorMap[color] || ['#3B82F6', '#8B5CF6']; // default blue-purple
}

export default function HomeScreen() {
  // Animation for floating icon
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Fixed Header + Category Pills */}
        <AppHeader />

        {/* AI-Powered Glass Card Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            padding: 48,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated Background Blobs */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              width: 500,
              height: 500,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: 250,
              opacity: 0.5,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: '25%',
              width: 500,
              height: 500,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderRadius: 250,
              opacity: 0.5,
            }} />
            <View style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 300,
              height: 300,
              backgroundColor: 'rgba(34, 211, 238, 0.1)',
              borderRadius: 150,
              transform: [{ translateX: -150 }, { translateY: -150 }],
              opacity: 0.5,
            }} />

            {/* Content Container - Inner div with proper specs */}
            <View style={{
              maxWidth: 896,
              width: '100%',
              position: 'relative',
              zIndex: 10,
              paddingVertical: 0,
              paddingHorizontal: 0,
              borderWidth: 0,
            }}>
              {/* Flex Container with Logo/Icon and Text */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
              }}>
                {/* Animated Search Icon Container */}
                <Animated.View style={{ transform: [{ translateY }] }}>
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6', '#22d3ee']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 80,
                      height: 80,
                      padding: 16,
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#3b82f6',
                      shadowOffset: { width: 0, height: 25 },
                      shadowOpacity: 0.3,
                      shadowRadius: 50,
                      elevation: 12,
                    }}
                  >
                    <Ionicons name="search" size={48} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>

                {/* Text content with gradient heading */}
                <View style={{ flex: 1 }}>
                  <MaskedView
                    maskElement={
                      <Text style={{
                        fontSize: 36,
                        fontWeight: '700',
                        lineHeight: 40,
                        marginBottom: 4,
                        backgroundColor: 'transparent',
                      }}>
                        Universal Search
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={['rgb(79, 143, 247)', 'rgb(167, 139, 250)', 'rgb(34, 211, 238)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={{
                        fontSize: 36,
                        fontWeight: '700',
                        lineHeight: 40,
                        marginBottom: 4,
                        opacity: 0,
                      }}>
                        Universal Search
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                  
                  <Text style={{
                    fontSize: 14,
                    color: '#94a3b8',
                  }}>
                    Powered by AI • 100+ Retailers
                  </Text>
                </View>
              </View>

              {/* Description Paragraph */}
              <Text style={{
                fontSize: 18,
                color: 'rgb(203, 213, 225)',
                marginBottom: 32,
                maxWidth: 672,
                lineHeight: 29.25,
                textAlign: 'center',
                alignSelf: 'center',
              }}>
                Search ANY product across <Text style={{ color: '#60a5fa', fontWeight: '600' }}>100+ major retailers</Text>. Compare prices, find deals, and save money effortlessly.
              </Text>

              {/* Search Form Container */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                maxWidth: 800,
                alignSelf: 'center',
                width: '100%',
                marginBottom: 32,
                paddingHorizontal: 8,
              }}>
                {/* Input field with search icon */}
                <View style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {/* Search Icon */}
                  <View style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: [{ translateY: -10 }],
                    zIndex: 1,
                  }}>
                    <Ionicons 
                      name="search" 
                      size={20} 
                      color={isFocused ? '#60a5fa' : '#94a3b8'} 
                    />
                  </View>

                  {/* Text Input */}
                  <TextInput
                    placeholder="Search for iPhone, LEGO, running shoes, coffee maker..."
                    placeholderTextColor="#64748b"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    numberOfLines={1}
                    multiline={false}
                    ellipsizeMode="tail"
                    style={{
                      width: '100%',
                      height: 64,
                      backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: isFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 16,
                      paddingLeft: 56,
                      paddingRight: 24,
                      paddingVertical: 4,
                      color: '#ffffff',
                      fontSize: 18,
                      fontWeight: '400',
                      lineHeight: 28,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 20 },
                      shadowOpacity: 0.2,
                      shadowRadius: 25,
                      elevation: 8,
                    }}
                  />
                </View>

                {/* Search Button */}
                <LinearGradient
                  colors={['#4f8ff7', '#a78bfa', '#22d3ee', '#4f8ff7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 64,
                    paddingHorizontal: 40,
                    paddingVertical: 8,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#3b82f6',
                    shadowOffset: { width: 0, height: 25 },
                    shadowOpacity: 0.3,
                    shadowRadius: 50,
                    elevation: 12,
                  }}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}>
                    Search
                  </Text>
                </LinearGradient>
              </View>

              {/* Quick Search Pills */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                maxWidth: 800,
                alignSelf: 'center',
              }}>
                {/* Label */}
                <Text style={{
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  Trending:
                </Text>

                {/* Trending Pills */}
                {['iPhone 15', 'AirPods Pro', 'Nike Running Shoes', 'LEGO Sets', 'Instant Pot', 'Organic Milk'].map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    activeOpacity={0.8}
                    style={{ 
                      paddingHorizontal: 20, 
                      paddingVertical: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ 
                      color: '#cbd5e1', 
                      fontSize: 16,
                      fontWeight: '400',
                      textAlign: 'center',
                    }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Browse by Category Section */}
        <View style={{
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 40,
          gap: 24,
        }}>
          {/* Header Container */}
          <View style={{
            margin: 0,
            padding: 0,
            borderWidth: 0,
          }}>
            {/* Heading */}
            <Text style={{
              fontSize: 24,
              lineHeight: 32,
              fontWeight: '700',
              color: 'rgb(226, 232, 240)',
              marginBottom: 4,
              margin: 0,
              padding: 0,
              textAlign: 'left',
            }}>
              Browse by Category
            </Text>

            {/* Description */}
            <Text style={{
              fontSize: 16,
              lineHeight: 24,
              fontWeight: '400',
              color: 'rgb(148, 163, 184)',
              margin: 0,
              padding: 0,
              textAlign: 'left',
            }}>
              Explore our 39 comparison categories
            </Text>
          </View>

          {/* Category Cards Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            {CATEGORY_LIST.map((category) => {
              const iconGradient = getGradientFromColor(category.iconColor || '#3B82F6');
              const iconName = getIconName(category.icon);
              
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/category/${category.slug}`)}
                  style={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card Container */}
                  <View style={{
                    position: 'relative',
                    backgroundColor: 'rgba(21, 27, 40, 0.6)',
                    borderRadius: 12,
                    padding: 28,
                    borderWidth: 1,
                    borderColor: 'rgba(139, 149, 168, 0.15)',
                    overflow: 'hidden',
                  }}>
                    {/* Hover Gradient Overlay */}
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 0,
                    }}>
                      <LinearGradient
                        colors={[`${iconGradient[0]}15`, `${iconGradient[1]}15`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                      />
                    </View>

                    {/* Card Content */}
                    <View style={{
                      position: 'relative',
                      zIndex: 10,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 16,
                    }}>
                      {/* Icon Container with Gradient Background */}
                      <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        overflow: 'hidden',
                        shadowColor: iconGradient[0],
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}>
                        <LinearGradient
                          colors={iconGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 60,
                            height: 60,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={iconName} size={28} color="#ffffff" />
                        </LinearGradient>
                      </View>

                      {/* Text Content */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: '#E2E8F0',
                            lineHeight: 24,
                          }}>
                            {category.name}
                          </Text>
                          {category.isNew && (
                            <View style={{
                              backgroundColor: '#3B82F6',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                              <Text style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: '#FFFFFF',
                                textTransform: 'uppercase',
                              }}>
                                NEW
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{
                          fontSize: 14,
                          color: '#94A3B8',
                          lineHeight: 20,
                        }}>
                          {category.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Glass Card with Gradient Background */}
        <View style={{
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 40,
        }}>
          <View style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            padding: 40,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            {/* Absolute Gradient Background Overlay */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.05)', 'rgba(139, 92, 246, 0.05)', 'rgba(34, 211, 238, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            </View>

            {/* Grid Container - relative z-10 */}
            <View style={{
              position: 'relative',
              zIndex: 10,
            }}>
              <Text style={{ color: 'white' }}>Grid content goes here</Text>
            </View>
          </View>
        </View>

        {/* Homepage Content */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 40 }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            Welcome to PriceLens
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 16, lineHeight: 24 }}>
            Compare prices across 39 categories and thousands of stores. Tap any category above to get started.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
