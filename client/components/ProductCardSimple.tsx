/**
 * Simplified Product Card for Category Pages
 * 
 * This component displays ONLY product information (no store prices).
 * Store prices are shown on the Product Comparison Page.
 * 
 * Features:
 * - Product image
 * - Product name and category
 * - Quick insight (store count, min price)
 * - "View Prices" button (primary CTA)
 * - Save/Favorite button (secondary action)
 * - Add to List button (optional)
 */

import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { addItemToList, getCurrentList } from '@/utils/listService';
import { setProductImageForCompare, setProductImageForCompareByName } from '@/utils/priceDataCache';
import { toggleFavorite, isFavorite as checkIsFavorite } from '@/utils/favoritesService';
import type { FavoriteProduct } from '@/utils/favoritesService';

interface ProductCardSimpleProps {
  productId: string | number;
  productName: string;
  productImage: string;
  category: string;
  categorySlug: string;
  // Quick insights (real data from backend)
  storeCount?: number; // Number of stores selling this product
  minPrice?: number; // Minimum price across all stores
  // Optional: Full product data for comparison page
  fullProductData?: any;
}

export default function ProductCardSimple({
  productId,
  productName,
  productImage,
  category,
  categorySlug,
  storeCount = 0,
  minPrice = 0,
  fullProductData,
}: ProductCardSimpleProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const cardRef = useRef<View>(null);

  // Load favorite status on mount
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      const favorite = await checkIsFavorite(productId.toString());
      setIsFavorite(favorite);
    };
    loadFavoriteStatus();
  }, [productId]);

  // Generate product slug from product name (with safety check)
  const productSlug = (productName || 'unnamed-product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Handle "View Prices" button - navigate to comparison page
  const handleViewPrices = () => {
    // Cache product image by id and name so compare page can show it if API doesn't return one (some categories omit image)
    if (productImage && typeof productImage === 'string' && (productImage.startsWith('http://') || productImage.startsWith('https://'))) {
      if (productId) setProductImageForCompare(productId.toString(), productImage);
      if (productName) setProductImageForCompareByName(productName, productImage);
    }
    // Navigate to: /category/[categorySlug]/[productSlug]/compare?productId=[id]&productName=[name]
    const params = new URLSearchParams();
    if (productId) {
      params.append('productId', productId.toString());
    }
    if (productName) {
      params.append('productName', productName);
    }
    const queryString = params.toString();
    router.push(`/category/${categorySlug}/${productSlug}/compare${queryString ? `?${queryString}` : ''}`);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    try {
      const favoriteProduct: FavoriteProduct = {
        productId: productId.toString(),
        productName,
        productImage,
        category,
        categorySlug,
        minPrice,
        storeCount,
      };
      
      const result = await toggleFavorite(favoriteProduct);
      setIsFavorite(result.isFavorite);
      
      if (result.success && result.isFavorite) {
        Alert.alert('Added to Favorites', 'You have added this item to the favorite page.');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle add to list - add to current/default list
  const handleAddToList = async () => {
    if (isAddingToList) return;
    
    setIsAddingToList(true);
    try {
      // Get current list (grocery or default)
      const currentList = await getCurrentList();
      
      // Create store prices array from available data
      const storePrices = fullProductData?.storePrices || [];
      
      const result = await addItemToList(
        productId.toString(),
        productName,
        productImage,
        category,
        storePrices,
        minPrice,
        undefined, // bestPriceStore
        currentList.id // Use current list ID
      );
      
      if (result.success) {
        Alert.alert('Added to list', result.message || `Added to ${result.listName || 'your list'}!`);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      Alert.alert('Error', 'Failed to add item to list');
    } finally {
      setIsAddingToList(false);
    }
  };


  // Lazy load images - only load when component is mounted (for initial page load)
  // This prevents loading all 6 images simultaneously, improving performance on slow WiFi
  useEffect(() => {
    // Small delay to prioritize visible items first
    const timer = setTimeout(() => {
      setShouldLoadImage(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Determine final image URL - accept any valid http(s) URL including placeholders
  let finalImageUri = 'https://via.placeholder.com/200x200/1e2736/8b95a8?text=No+Image';
  
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    const isValidUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const isTestUrl = trimmed.includes('example.com');
    
    // Accept any valid URL including placeholders (they're unique per product now)
    if (isValidUrl && !isTestUrl && trimmed.length >= 10) {
      finalImageUri = trimmed;
    }
  }

  return (
    <View style={{
      backgroundColor: 'rgba(21, 27, 40, 0.6)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(139, 149, 168, 0.15)',
      overflow: 'hidden',
    }}>
      {/* Product Image */}
      <View style={{
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#1e2736',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {imageError ? (
          <View style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="image-outline" size={48} color="#6b7280" />
            <Text style={{ color: '#6b7280', marginTop: 8, fontSize: 12 }}>
              No Image
            </Text>
          </View>
        ) : shouldLoadImage ? (
          <Image
            source={{ uri: finalImageUri }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
            // Performance optimizations
            progressiveRenderingEnabled={true}
            cache="force-cache"
          />
        ) : (
          // Show placeholder while waiting to load (prevents blocking)
          <View style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e2736',
          }}>
            <Ionicons name="image-outline" size={32} color="#3b4758" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{
          color: '#e8edf4',
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 6,
          numberOfLines: 2,
        }}>
          {typeof productName === 'string' ? productName.replace(/\b\w/g, c => c.toUpperCase()) : productName}
        </Text>
        
        {/* Category Badge */}
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: '#1e2736',
          borderRadius: 6,
          alignSelf: 'flex-start',
          marginBottom: 8,
        }}>
          <Text style={{
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: '500',
          }}>
            {typeof category === 'string' ? category.replace(/\b\w/g, c => c.toUpperCase()) : category}
          </Text>
        </View>
      </View>


      {/* Primary Action - View Prices */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleViewPrices}
        style={{
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#ffffff" />
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: '#ffffff',
          }}>
            View Prices
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Secondary Actions Row */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
      }}>
        {/* Favorite Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleFavorite}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: isFavorite 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: isFavorite 
              ? 'rgba(239, 68, 68, 0.4)' 
              : 'rgba(139, 149, 168, 0.2)',
          }}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color={isFavorite ? "#ef4444" : "#8b95a8"} 
          />
        </TouchableOpacity>

        {/* Add to List Button (+) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToList}
          disabled={isAddingToList}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: isAddingToList 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(59, 130, 246, 0.15)',
            borderWidth: 1,
            borderColor: isAddingToList 
              ? 'rgba(59, 130, 246, 0.4)' 
              : 'rgba(59, 130, 246, 0.3)',
            opacity: isAddingToList ? 0.7 : 1,
          }}
        >
          <Ionicons 
            name={isAddingToList ? "hourglass-outline" : "add"} 
            size={18} 
            color={isAddingToList ? "#3B82F6" : "#3B82F6"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

