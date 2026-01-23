import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polyline } from 'react-native-svg';
import { memo, useState } from 'react';
import StoreCard from './StoreCard';
import { addItemToList } from '@/utils/listService';
import ListPickerModal from './ListPickerModal';

interface StorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  shippingInfo?: string;
  totalPrice?: number;
  savings?: number;
  priceDifference?: string; // e.g., "+$0.04 more"
}

interface ProductCardProps {
  productId?: string; // Product ID for adding to list
  productName: string;
  productImage: string;
  category: string;
  storePrices: StorePrice[];
  maxSavings?: number;
  bestPrice?: number;
  bestPriceStore?: string;
}

const ProductCardComponent = function ProductCard({ 
  productId,
  productName, 
  productImage, 
  category, 
  storePrices,
  maxSavings = 0,
  bestPrice = 0,
  bestPriceStore = '',
}: ProductCardProps) {
  // Log image URL for debugging
  console.log('🖼️ ProductCard received:', {
    productName,
    productImage,
    imageType: typeof productImage,
    imageLength: productImage?.length,
    startsWithHttp: productImage?.startsWith('http'),
  });
  
  // Determine final image URL - reject placeholder URLs and invalid URLs
  let finalImageUri = 'https://via.placeholder.com/96x96/1e2736/8b95a8?text=No+Image';
  
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    // Accept if it's a valid HTTP URL AND not a placeholder
    // Check for common placeholder patterns and invalid URLs
    const isPlaceholder = trimmed.includes('placeholder') || 
                         trimmed.includes('via.placeholder') ||
                         trimmed === 'https://via.placeholder.com/96' ||
                         trimmed.includes('example.com') ||
                         trimmed === '' ||
                         trimmed.length < 10;
    
    // Check if it's a valid URL format
    const isValidUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    
    if (isValidUrl && !isPlaceholder) {
      finalImageUri = trimmed;
    } else {
      console.warn(`⚠️ Rejected invalid image URL: "${trimmed}" (isPlaceholder: ${isPlaceholder}, isValidUrl: ${isValidUrl})`);
    }
  } else {
    console.warn(`⚠️ Product image is invalid:`, { productImage, type: typeof productImage });
  }
  
  console.log('🖼️ Final image URI:', finalImageUri, 'from input:', productImage);
  
  // Debug: Log store prices
  console.log('🏪 ProductCard storePrices:', {
    count: storePrices?.length || 0,
    stores: storePrices?.map(s => ({ name: s.storeName, price: s.price, rank: s.rank })),
    isEmpty: !storePrices || storePrices.length === 0,
  });
  
  // State for showing more stores
  const [showAllStores, setShowAllStores] = useState(false);
  
  // State for image loading errors
  const [imageError, setImageError] = useState(false);

  // State for list picker modal
  const [showListPicker, setShowListPicker] = useState(false);

  // Handle "Add to List" button press
  const handleAddToList = () => {
    // Show list picker modal
    setShowListPicker(true);
  };

  // Handle list selection from modal
  const handleSelectList = (listId: string) => {
    // Generate productId if not provided
    const finalProductId = productId || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = addItemToList(
      finalProductId,
      productName,
      productImage,
      category,
      storePrices.map(sp => ({
        rank: sp.rank,
        storeName: sp.storeName,
        price: sp.price,
        storeImage: sp.storeImage,
        isBestDeal: sp.isBestDeal,
      })),
      bestPrice,
      bestPriceStore,
      listId // Use selected list ID
    );

    if (result.success) {
      Alert.alert('✅ Success', result.message);
    } else {
      Alert.alert('❌ Error', result.message);
    }
  };
  
  // Show 4 stores initially, or all if expanded
  const initialStoreCount = 4;
  const displayStores = showAllStores ? (storePrices || []) : (storePrices || []).slice(0, initialStoreCount);
  const totalStoreCount = storePrices?.length || 0;
  const hasMoreStores = totalStoreCount > initialStoreCount;
  
  // Debug: Log display stores
  console.log('🏪 Display stores:', {
    showAll: showAllStores,
    displayCount: displayStores.length,
    totalCount: totalStoreCount,
    hasMore: hasMoreStores,
  });
  
  // Standard layout matching the image design - used for ALL categories
  return (
    <View style={{
      backgroundColor: 'rgba(21, 27, 40, 0.6)',
      borderRadius: 16,
      padding: 0,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Product Header Section */}
      <View style={{
        paddingTop: 24,
        paddingRight: 24,
        paddingLeft: 24,
        paddingBottom: 16,
        width: '100%',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          {/* Product Image */}
          {imageError || finalImageUri.includes('placeholder') ? (
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              backgroundColor: '#1e2736',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>No Image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: finalImageUri }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: '#1e2736',
              }}
              resizeMode="cover"
              onError={(error) => {
                console.log('❌ Image failed to load:', finalImageUri, error.nativeEvent.error);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', finalImageUri);
                setImageError(false);
              }}
            />
          )}
          
          {/* Product Details */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: '#e8edf4',
              fontSize: 16,
              lineHeight: 22,
              fontWeight: '600',
              marginBottom: 8,
            }}>
              {productName}
            </Text>
            
            {/* Category Badge */}
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginBottom: 8,
              backgroundColor: '#1e2736',
              borderRadius: 6,
              alignSelf: 'flex-start',
            }}>
              <Text style={{
                color: '#e8edf4',
                fontSize: 12,
                fontWeight: '600',
              }}>
                {category}
              </Text>
            </View>
            
            {/* Add to List Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddToList}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
                paddingHorizontal: 10,
                borderRadius: 6,
                gap: 6,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              />
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                Add to List
              </Text>
            </TouchableOpacity>
        </View>
      </View>

        {/* Sorting Indicator */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <Polyline points="16 17 22 17 22 11" />
            </Svg>
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: '#6b7280',
            }}>
              Sorted: Lowest to Highest
            </Text>
          </View>
        </View>

      {/* Store Cards Section - Vertical Stack */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
      }}>
        {/* Debug: Show if no stores */}
        {(!storePrices || storePrices.length === 0) && (
          <View style={{
            padding: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <Text style={{
              color: '#ef4444',
              fontSize: 14,
              textAlign: 'center',
            }}>
              ⚠️ No store prices available for this product
            </Text>
          </View>
        )}
        
        {/* Store Cards - Vertical Stack */}
        {displayStores && displayStores.length > 0 && (
        <View style={{
            gap: 0,
        }}>
            {displayStores.map((store, index) => {
              console.log(`🏪 Rendering StoreCard ${index + 1}:`, {
                rank: store.rank,
                name: store.storeName,
                price: store.price,
                isBestDeal: store.isBestDeal,
              });
              
              return (
            <StoreCard
                  key={`store-${store.rank}-${index}`}
              rank={store.rank}
              storeName={store.storeName}
              price={store.price}
              storeImage={store.storeImage}
              isBestDeal={store.isBestDeal}
                  priceDifference={store.priceDifference}
              productUrl={store.productUrl}
            />
              );
            })}
        </View>
        )}

        {/* Show More Stores Button */}
        {hasMoreStores && !showAllStores && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAllStores(true)}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#3b82f6',
            }}>
              Show more stores
            </Text>
          </TouchableOpacity>
        )}

        {/* Show Less Button */}
        {showAllStores && hasMoreStores && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAllStores(false)}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#3b82f6',
            }}>
              Show less
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List Picker Modal */}
      <ListPickerModal
        visible={showListPicker}
        onClose={() => setShowListPicker(false)}
        onSelectList={handleSelectList}
        category={category}
      />
    </View>
  );
};

// Memoize ProductCard to prevent unnecessary re-renders
export default memo(ProductCardComponent);
