/**
 * Categories Modal - Full-screen modal showing all categories
 * Elegant, professional design
 */

import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { CATEGORY_LIST } from '@/constants/categories';
import { getIconName } from '@/utils/iconMapper';

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
}

// Animated Category Card for Modal
function AnimatedCategoryCardModal({ 
  category, 
  iconName, 
  index,
  onPress
}: { 
  category: any; 
  iconName: string; 
  index: number;
  onPress: () => void;
}) {
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Initial entrance animation (staggered) - start from bottom
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 30), // Stagger animation (faster than homepage)
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  // Removed handlePressOut - now using direct onPress for explicit tap requirement
  // This prevents accidental navigation from just touching the card

  return (
    <Animated.View
      style={{
        width: '48%',
        height: 200, // Fixed height to match home screen cards exactly
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim },
        ],
      }}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%', // Fill parent container
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: shadowOpacityAnim,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress} // Use onPress instead of onPressOut to require explicit tap
          style={{
            width: '100%',
            height: '100%', // Fill parent (200px from outer container)
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 20,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(59, 130, 246, 0.2)',
            overflow: 'hidden',
            // Use flexbox column to ensure consistent layout
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          {/* Gradient overlay on press */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              opacity: shadowOpacityAnim,
            }}
          />
          
          {/* Icon Container - Fixed size */}
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16, // Fixed spacing
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            flexShrink: 0, // Don't shrink
          }}>
            <Ionicons name={iconName} size={28} color="#60A5FA" />
          </View>
          
          {/* Category Name - Fixed height, single line */}
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: '#E2E8F0',
            marginBottom: 8, // Fixed spacing
            letterSpacing: -0.3,
            height: 22, // Fixed height (prevents wrapping differences)
            lineHeight: 22,
          }} numberOfLines={1} ellipsizeMode="tail">
            {category.name}
          </Text>
          
          {/* Description - Fixed height container (exactly 2 lines) */}
          <View style={{ 
            height: 40, // Fixed height for description area (2 lines: 18px lineHeight * 2 + 4px buffer)
            justifyContent: 'flex-start',
            marginBottom: 12, // Fixed spacing before bottom indicator
            flexShrink: 0, // Don't shrink
          }}>
            <Text style={{
              fontSize: 12,
              color: '#94A3B8',
              lineHeight: 18,
              height: 36, // Exactly 2 lines (18px * 2)
            }} numberOfLines={2} ellipsizeMode="tail">
              {category.description}
            </Text>
          </View>
          
          {/* Subtle indicator for double tap - Fixed height at bottom */}
          <View style={{
            height: 18, // Fixed height for bottom indicator
            flexDirection: 'row',
            alignItems: 'center',
            opacity: 0.6,
            flexShrink: 0, // Don't shrink
          }}>
            <Ionicons name="arrow-forward-circle-outline" size={14} color="#64748B" />
            <Text style={{
              fontSize: 11,
              color: '#64748B',
              marginLeft: 4,
            }}>
              Tap to explore
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function CategoriesModal({ visible, onClose }: CategoriesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = CATEGORY_LIST.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (slug: string) => {
    // Close modal first
    onClose();
    // Small delay to prevent AppHeader from auto-selecting before navigation completes
    setTimeout(() => {
      router.push(`/category/${slug}`);
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#0B1020' }}>
        {/* Header */}
        <View style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#E2E8F0' }}>
              All Categories
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ position: 'relative' }}>
            <View style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: [{ translateY: -10 }],
              zIndex: 1,
            }}>
              <Ionicons name="search" size={20} color="#94A3B8" />
            </View>
            <TextInput
              placeholder="Search categories..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingLeft: 48,
                paddingRight: 16,
                color: '#ffffff',
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Categories Grid */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {filteredCategories.map((category, index) => {
              const iconName = getIconName(category.icon);
              
              return (
                <AnimatedCategoryCardModal
                  key={category.id}
                  category={category}
                  iconName={iconName}
                  index={index}
                  onPress={() => handleCategoryPress(category.slug)}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
