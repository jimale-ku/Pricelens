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

  const handlePressOut = () => {
    // Release animation - card raises up with bounce
    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: -6, // Raise up 6px
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // After raising, settle back to normal position
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Navigate after animation completes
        onPress();
      });
    });
  };

  return (
    <Animated.View
      style={{
        width: '48%',
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim },
        ],
      }}
    >
      <Animated.View
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: shadowOpacityAnim,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={handlePressOut}
          style={{
            width: '100%',
            minHeight: 160, // Ensure consistent card height
            backgroundColor: 'rgba(21, 27, 40, 0.6)',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1.5,
            borderColor: 'rgba(59, 130, 246, 0.2)',
            overflow: 'hidden',
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
          
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}>
            <Ionicons name={iconName} size={24} color="#60A5FA" />
          </View>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#E2E8F0',
            marginBottom: 4,
          }}>
            {category.name}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#94A3B8',
            lineHeight: 16,
          }} numberOfLines={2}>
            {category.description}
          </Text>
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
    onClose();
    router.push(`/category/${slug}`);
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
