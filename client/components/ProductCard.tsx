import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polyline } from 'react-native-svg';
import { memo } from 'react';
import StoreCard from './StoreCard';

interface StorePrice {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
  shippingInfo?: string;
  totalPrice?: number;
  savings?: number;
}

interface ProductCardProps {
  productName: string;
  productImage: string;
  category: string;
  storePrices: StorePrice[];
  maxSavings?: number;
  bestPrice?: number;
  bestPriceStore?: string;
}

const ProductCardComponent = function ProductCard({ 
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
  
  // Check if this is Electronics category to use special layout
  const isElectronics = category.toLowerCase() === 'electronics';
  
  // Determine final image URL - reject placeholder URLs
  let finalImageUri = 'https://via.placeholder.com/96x96/1e2736/8b95a8?text=No+Image';
  
  if (productImage && typeof productImage === 'string') {
    const trimmed = productImage.trim();
    // Accept if it's a valid HTTP URL AND not a placeholder
    // Check for common placeholder patterns
    const isPlaceholder = trimmed.includes('placeholder') || 
                         trimmed.includes('via.placeholder') ||
                         trimmed === 'https://via.placeholder.com/96';
    
    if (trimmed.startsWith('http') && !isPlaceholder) {
      finalImageUri = trimmed;
    }
  }
  
  console.log('🖼️ Final image URI:', finalImageUri, 'from input:', productImage);
  
  // Extract brand and model from product name (e.g., "Sony WH-1000XM5 Wireless..." -> ["Sony", "WH-1000XM5"])
  const extractBrandModel = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return {
        brand: parts[0],
        model: parts[1],
      };
    }
    return { brand: '', model: '' };
  };
  
  const { brand, model } = extractBrandModel(productName);
  
  // Get first 6 stores for the 2x3 grid
  const displayStores = storePrices.slice(0, 6);
  const totalStoreCount = storePrices.length;
  
  if (isElectronics) {
    // Electronics-specific layout matching Figma design
    return (
      <View style={{
        backgroundColor: 'rgba(21, 27, 40, 0.6)',
        borderRadius: 12, // rounded-xl
        padding: 0,
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 235, 0.3)', // cyan-400/30
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Content Container - matches .px-6.pt-6.[&:last-child]:pb-6 */}
        <View style={{
          paddingHorizontal: 24, // px-6
          paddingTop: 24, // pt-6
          paddingBottom: 24, // pb-6 (will be applied as last child in list)
          backgroundColor: 'transparent',
        }}>
          {/* Product Information Section - .flex.items-start.gap-4.mb-4 */}
          <View style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 16, // gap-4 (calc(var(--spacing) * 4))
            marginBottom: 16, // mb-4
            margin: 0,
            padding: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
            position: 'relative',
          }}>
            {/* Product Image - .w-24.h-24.object-cover.rounded-lg.border-2.border-cyan-300 */}
            <Image
              source={{ uri: finalImageUri }}
              style={{
                width: 96, // w-24 (calc(var(--spacing) * 24))
                height: 96, // h-24 (calc(var(--spacing) * 24))
                borderRadius: 8, // rounded-lg (var(--radius))
                borderWidth: 2, // border-2
                borderColor: '#67e8f9', // border-cyan-300
                resizeMode: 'cover', // object-cover
                backgroundColor: '#1e2736', // Dark background for placeholder
              }}
              onError={(error) => {
                console.log('❌ Image failed to load:', finalImageUri, error.nativeEvent.error);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', finalImageUri);
              }}
            />
            
            {/* Product Details - .flex-1 */}
            <View style={{
              flex: 1,
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: 0,
              margin: 0,
              padding: 0,
              borderWidth: 0,
              backgroundColor: 'transparent',
            }}>
              {/* Product Title - div with text node */}
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: 'rgb(255, 255, 255)',
                lineHeight: 25.2, // 1.4 * 18px
                margin: 0,
                padding: 0,
                textAlign: 'left',
              }}>
                {productName}
              </Text>
              
              {/* Brand and Model Tags - .flex.flex-wrap.gap-2 */}
              {brand && model && (
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8, // gap-2
                  marginTop: 8,
                }}>
                  {/* Brand Tag - .inline-flex.items-center.justify-center.rounded-md.border.px-2.py-0.5.text-xs.font-medium... */}
                  <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6, // rounded-md (calc(var(--radius) - 2px))
                    borderWidth: 1,
                    borderColor: 'transparent',
                    paddingHorizontal: 8, // px-2
                    paddingVertical: 2, // py-0.5
                    backgroundColor: 'rgb(30, 39, 54)', // bg-secondary
                    width: 'auto', // w-fit
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    <Text style={{
                      fontSize: 12, // text-xs
                      lineHeight: 16,
                      fontWeight: '500', // font-medium
                      color: 'rgb(232, 237, 244)', // text-secondary-foreground
                    }}>
                      {brand}
                    </Text>
                  </View>
                  {/* Model Tag */}
                  <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6, // rounded-md
                    borderWidth: 1,
                    borderColor: 'transparent',
                    paddingHorizontal: 8, // px-2
                    paddingVertical: 2, // py-0.5
                    backgroundColor: 'rgb(30, 39, 54)', // bg-secondary
                    width: 'auto', // w-fit
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    <Text style={{
                      fontSize: 12, // text-xs
                      lineHeight: 16,
                      fontWeight: '500', // font-medium
                      color: 'rgb(232, 237, 244)', // text-secondary-foreground
                    }}>
                      {model}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Savings Callout - .bg-green-600.text-white */}
              {maxSavings > 0 && (
                <View style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6, // rounded-md (calc(var(--radius) - 2px))
                  borderWidth: 1,
                  borderColor: 'transparent',
                  paddingHorizontal: 8, // px-2
                  paddingVertical: 2, // py-0.5
                  backgroundColor: '#16a34a', // bg-green-600
                  width: 'auto', // w-fit
                  flexShrink: 0,
                  overflow: 'hidden',
                  gap: 4, // gap-1
                  marginTop: 8,
                }}>
                  <Text style={{
                    fontSize: 12, // text-xs
                    lineHeight: 16,
                    fontWeight: '500', // font-medium
                    color: 'rgb(255, 255, 255)', // text-white
                  }}>
                    Save up to ${maxSavings.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Best Price Summary - Top Right */}
            {bestPrice > 0 && bestPriceStore && (
              <View style={{
                alignItems: 'flex-end',
                position: 'absolute',
                top: 24,
                right: 24,
              }}>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 12,
                  marginBottom: 4,
                }}>
                  From
                </Text>
                <Text style={{
                  color: '#10b981',
                  fontSize: 28,
                  fontWeight: '700',
                  marginBottom: 4,
                }}>
                  ${bestPrice.toFixed(2)}
                </Text>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 12,
                }}>
                  {bestPriceStore}
                </Text>
              </View>
            )}
          </View>
          
          {/* Retailer Price Comparison Grid - .grid.grid-cols-2.md:grid-cols-3.gap-3 */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            margin: 0,
            padding: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
            justifyContent: 'space-between', // Distribute items evenly
          }}>
            {displayStores.map((store, index) => {
              // For 2 columns: each card takes ~48% width, with gap between
              const isEvenIndex = index % 2 === 0;
              
              return (
              <View
                key={store.rank}
                style={{
                  width: '48%', // 2 columns with gap
                  marginBottom: index < displayStores.length - 2 ? 12 : 0, // gap-3 (12px) between rows
                  padding: 12, // p-3 (12px all sides)
                  borderRadius: 8, // rounded-lg (var(--radius))
                  borderWidth: 2, // border-2
                  borderColor: store.isBestDeal ? '#22d3ee' : '#d1d5db', // border-cyan-400 for best deal, border-gray-300 for others
                  backgroundColor: store.isBestDeal ? 'transparent' : '#ffffff', // bg-white for regular cards
                  overflow: 'hidden', // For gradient background
                }}
              >
                {/* Gradient Background for Best Deal Card */}
                {store.isBestDeal && (
                  <LinearGradient
                    colors={['#ecfeff', '#eff6ff']} // from-cyan-50 to-blue-50
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
                )}
                
                {/* Store Name - .flex.items-center.gap-2.mb-2 */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8, // gap-2
                  marginBottom: 8, // mb-2
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                  }}>
                    {store.storeName}
                  </Text>
                </View>
                
                {/* Price - .text-xl.font-bold.mb-1 */}
                <Text style={{
                  fontSize: 20, // text-xl
                  fontWeight: '700', // font-bold
                  color: store.isBestDeal ? '#10b981' : '#374151',
                  marginBottom: 4, // mb-1
                }}>
                  {store.price}
                </Text>
                
                {/* Shipping Info - .text-xs.text-gray-500 */}
                <Text style={{
                  fontSize: 12, // text-xs
                  color: '#6b7280', // text-gray-500
                  marginBottom: store.isBestDeal ? 8 : 0, // mb-2 for best deal (mt-2 for tag)
                }}>
                  {store.shippingInfo || 'Free Shipping'}
                </Text>
                
                {/* Best Price Tag - .bg-green-500.text-white.text-xs.mt-2 */}
                {store.isBestDeal && (
                  <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#22c55e', // bg-green-500
                    paddingHorizontal: 8, // px-2
                    paddingVertical: 2, // py-0.5
                    borderRadius: 6, // rounded-md
                    borderWidth: 1,
                    borderColor: 'transparent',
                    width: 'auto', // w-fit
                    flexShrink: 0,
                    overflow: 'hidden',
                    marginTop: 8, // mt-2
                  }}>
                    <Text style={{
                      fontSize: 12, // text-xs
                      fontWeight: '500', // font-medium
                      color: 'rgb(255, 255, 255)', // text-white
                    }}>
                      Best Price
                    </Text>
                  </View>
                )}
              </View>
              );
            })}
          </View>
          
          {/* Action Buttons */}
          <View style={{
            marginTop: 12, // mt-3
            flexDirection: 'row',
            gap: 8, // gap-2
            flexWrap: 'wrap',
          }}>
          {/* View All Prices Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              minWidth: 120,
              height: 40,
              backgroundColor: '#1e3a8a',
              borderWidth: 1,
              borderColor: '#3b82f6',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '600',
            }}>
              View All {totalStoreCount} Prices
            </Text>
          </TouchableOpacity>
          
          {/* Compare All Prices Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              minWidth: 120,
              height: 40,
              backgroundColor: '#10b981',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '600',
            }}>
              Compare All Prices
            </Text>
          </TouchableOpacity>
          
          {/* Shop Best Price Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              minWidth: 120,
              height: 40,
              backgroundColor: '#3b82f6',
              borderWidth: 1,
              borderColor: '#ffffff',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Ionicons name="bag-outline" size={16} color="#ffffff" />
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '600',
            }}>
              Shop Best Price
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    );
  }
  
  // Original layout for other categories (Groceries, etc.)
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
      {/* Card Header */}
      <View style={{
        paddingTop: 24,
        paddingRight: 24,
        paddingLeft: 24,
        paddingBottom: 0,
        gap: 6,
        width: '100%',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          {/* Product Image */}
          <Image
            source={{ uri: finalImageUri }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#1e2736', // Dark background for placeholder
            }}
            resizeMode="cover"
            onError={(error) => {
              console.log('❌ Image failed to load:', finalImageUri, error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', finalImageUri);
            }}
          />
          
          {/* Product Details */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: '#e8edf4',
              fontSize: 16,
              lineHeight: 16,
              fontWeight: '400',
              margin: 0,
              padding: 0,
            }}>
              {productName}
            </Text>
            
            {/* Category Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginTop: 8,
              backgroundColor: '#1e2736',
              borderRadius: 6,
              overflow: 'hidden',
              alignSelf: 'flex-start',
            }}>
              <Text style={{
                color: '#e8edf4',
                fontSize: 12,
                lineHeight: 16,
                fontWeight: '600',
              }}>
                {category}
              </Text>
            </View>
            
            {/* Add List Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
                paddingHorizontal: 10,
                marginTop: 8,
                borderRadius: 6,
                gap: 6,
                position: 'relative',
                overflow: 'hidden',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6', '#06b6d4']}
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
              <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 2 }} />
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                lineHeight: 20,
                fontWeight: '600',
              }}>
                Add List
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Card Content Section */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
      }}>
        {/* Price Comparison Header */}
        <View style={{
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <Text style={{
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '600',
            color: '#f1f5f9',
          }}>
            Price Comparison
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            margin: 0,
            padding: 0,
          }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <Polyline points="16 17 22 17 22 11" />
            </Svg>
            <Text style={{
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '400',
              color: '#6b7280',
              margin: 0,
              padding: 0,
            }}>
              Sorted: Lowest to Highest
            </Text>
          </View>
        </View>

        {/* Store Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          margin: 0,
          padding: 0,
        }}>
          {storePrices.map((store, index) => (
            <StoreCard
              key={index}
              rank={store.rank}
              storeName={store.storeName}
              price={store.price}
              storeImage={store.storeImage}
              isBestDeal={store.isBestDeal}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Memoize ProductCard to prevent unnecessary re-renders
export default memo(ProductCardComponent);
