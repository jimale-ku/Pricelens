import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { addPurchaseRecord } from '@/utils/purchaseHistoryService';

interface StoreCardProps {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  priceDifference?: string; // e.g., "+$0.04 more"
  productUrl?: string; // URL to the product on the store's website
  /** Distance in miles from user's ZIP (when "Find stores near you" is used) */
  distanceMiles?: number | null;
  // Product info for purchase tracking
  productId?: string | number;
  productName?: string;
  productImage?: string;
  category?: string;
}

export default function StoreCard({ 
  rank, 
  storeName, 
  price, 
  storeImage, 
  isBestDeal = false,
  priceDifference,
  productUrl,
  distanceMiles,
  productId,
  productName,
  productImage,
  category,
}: StoreCardProps) {
  const [logoError, setLogoError] = useState(false);

  const renderStoreLogo = (containerStyle: object) => {
    if (logoError || !storeImage) {
      const initial = (storeName || '?').charAt(0).toUpperCase();
      return (
        <View style={[containerStyle, { backgroundColor: 'rgba(30, 39, 54, 0.8)' }]}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#8b95a8' }}>{initial}</Text>
        </View>
      );
    }
    return (
      <Image
        source={{ uri: storeImage }}
        style={{ width: 40, height: 40 }}
        resizeMode="contain"
        onError={() => setLogoError(true)}
      />
    );
  };

  // Handle Shop Now button press
  const handleShopNow = async () => {
    console.log(`🛒 Shop Now clicked for ${storeName}:`, {
      productUrl,
      hasUrl: !!productUrl,
      urlType: typeof productUrl,
      urlLength: productUrl?.length,
    });
    
    // Check if productUrl is valid (not empty, not just whitespace, starts with http)
    const isValidUrl = productUrl && 
                       typeof productUrl === 'string' && 
                       productUrl.trim().length > 0 && 
                       (productUrl.startsWith('http://') || productUrl.startsWith('https://'));
    
    if (!isValidUrl) {
      console.warn(`⚠️ Invalid productUrl for ${storeName}:`, productUrl);
      Alert.alert(
        'Product Link Unavailable',
        `Sorry, we couldn't find a direct link to this product at ${storeName}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Use the validated URL
      const urlToOpen = productUrl.trim();
      console.log(`🔗 Attempting to open URL: ${urlToOpen}`);
      
      // Check if URL can be opened
      const canOpen = await Linking.canOpenURL(urlToOpen);
      if (canOpen) {
        await Linking.openURL(urlToOpen);
        console.log(`✅ Successfully opened product URL: ${urlToOpen}`);
        
        // Track purchase attempt (user clicked Shop Now)
        // Note: We can't know if they actually purchased, but we track the intent
        if (productId && productName && productImage && category) {
          try {
            const priceNum = parseFloat(price.replace('$', '').replace(',', '')) || 0;
            await addPurchaseRecord(
              productId.toString(),
              productName,
              productImage,
              category,
              storeName,
              priceNum,
              1, // quantity
              storeImage,
              urlToOpen
            );
            console.log('📝 Purchase record added');
          } catch (error) {
            console.error('Error recording purchase:', error);
            // Don't show error to user - purchase tracking is silent
          }
        }
      } else {
        console.warn(`⚠️ Linking.canOpenURL returned false for: ${urlToOpen}`);
        Alert.alert(
          'Invalid Link',
          'This product link is not valid or cannot be opened.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error opening product URL:', error);
      Alert.alert(
        'Error',
        `Could not open the product link: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };
  if (isBestDeal) {
    // Best Deal Card - Highlighted with light blue gradient background
    return (
      <View style={{
        position: 'relative',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#22d3ee', // cyan-400
        overflow: 'hidden',
        marginBottom: 12,
        width: '100%',
        height: '100%', // Fill parent container (220px)
      }}>
        <LinearGradient
          colors={['#ecfeff', '#eff6ff']} // cyan-50 to blue-50
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ 
            padding: 16,
            minHeight: 200, // Minimum height to ensure button fits
            flexDirection: 'column',
            justifyContent: 'space-between', // Distribute content evenly
          }}
        >
          {/* Header Row - Rank and Best Price Badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            {/* Rank Badge - Top Left */}
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#22d3ee', // cyan-400
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                #{rank}
              </Text>
            </View>

            {/* Best Price Badge - Top Right */}
            <View style={{
              backgroundColor: '#22d3ee', // cyan-400
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Best Price
              </Text>
            </View>
          </View>

          {/* Store Info Row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}>
            {/* Store Logo */}
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: '#ffffff',
              borderRadius: 4,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {renderStoreLogo({ width: 40, height: 40 })}
            </View>

            {/* Store Name */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1f2937', // gray-800
                marginBottom: 4,
              }}>
                {storeName}
              </Text>
            </View>
          </View>

          {/* Price */}
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#10b981', // green-500
            marginBottom: 12,
          }}>
            {price}
          </Text>

          {/* Shop Now Button - Always at bottom */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShopNow}
            style={{
              width: '100%',
              borderRadius: 8,
              overflow: 'hidden',
              marginTop: 'auto', // Push button to bottom
            }}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']} // blue-500 to purple-500
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
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 3h6v6" />
                <Path d="M10 14 21 3" />
                <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </Svg>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Shop Now
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Regular Card - Dark background
  return (
    <View style={{
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(21, 27, 40, 0.6)', // Dark background
      marginBottom: 12,
      width: '100%',
      minHeight: 200, // Minimum height to ensure button fits
      flexDirection: 'column',
      justifyContent: 'space-between', // Distribute content evenly
    }}>
      {/* Header Row - Rank Only */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        {/* Rank Badge - Top Left */}
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(139, 149, 168, 0.3)', // Dark gray
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#e8edf4',
          }}>
            #{rank}
          </Text>
        </View>
      </View>

      {/* Store Info Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}>
        {/* Store Logo */}
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#ffffff',
          borderRadius: 4,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {renderStoreLogo({ width: 40, height: 40 })}
        </View>

        {/* Store Name + distance when ZIP was used */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#e8edf4',
            marginBottom: 2,
          }}>
            {storeName}
          </Text>
          {distanceMiles != null && Number.isFinite(distanceMiles) && (
            <Text style={{
              fontSize: 12,
              color: '#94a3b8',
            }}>
              {distanceMiles.toFixed(1)} mi away
            </Text>
          )}
        </View>
      </View>

      {/* Price */}
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
      }}>
        {price}
      </Text>

      {/* Price Difference - Red text (fixed height to prevent size differences) */}
      <View style={{ height: 20, marginBottom: 12, justifyContent: 'flex-start' }}>
        {priceDifference && (
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#ef4444', // red-500
          }}>
            {priceDifference}
          </Text>
        )}
      </View>

      {/* Shop Now Button - Always at bottom */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleShopNow}
        style={{
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          marginTop: 'auto', // Push button to bottom
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']} // blue-500 to purple-500
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
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 3h6v6" />
            <Path d="M10 14 21 3" />
            <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </Svg>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#ffffff',
          }}>
            Shop Now
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
