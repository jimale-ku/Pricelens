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

import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

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

  // Generate product slug from product name (with safety check)
  const productSlug = (productName || 'unnamed-product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Handle "View Prices" button - navigate to comparison page
  const handleViewPrices = () => {
    // Navigate to: /category/[categorySlug]/[productSlug]/compare?productId=[id]
    // Pass product ID as query param so we can fetch directly by ID instead of searching by name
    const productIdParam = productId ? `?productId=${encodeURIComponent(productId)}` : '';
    router.push(`/category/${categorySlug}/${productSlug}/compare${productIdParam}`);
  };

  // Handle favorite toggle
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to backend/favorites
  };

  // Determine final image URL
  let finalImageUri = 'https://via.placeholder.com/200x200/1e2736/8b95a8?text=No+Image';
  
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    const isPlaceholder = trimmed.includes('placeholder') || 
                         trimmed.includes('via.placeholder') ||
                         trimmed.includes('example.com') ||
                         trimmed === '' ||
                         trimmed.length < 10;
    
    const isValidUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    
    if (isValidUrl && !isPlaceholder) {
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
        {imageError || finalImageUri.includes('placeholder') ? (
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
        ) : (
          <Image
            source={{ uri: finalImageUri }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
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
          {productName}
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
            {category}
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

        {/* Add to List Button (Optional - can be hidden if not needed) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(139, 149, 168, 0.2)',
          }}
        >
          <Ionicons name="add-outline" size={18} color="#8b95a8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

