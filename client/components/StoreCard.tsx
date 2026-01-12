import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface StoreCardProps {
  rank: number;
  storeName: string;
  price: string;
  storeImage: string;
  isBestDeal?: boolean;
}

export default function StoreCard({ rank, storeName, price, storeImage, isBestDeal = false }: StoreCardProps) {
  if (isBestDeal) {
    // Best Deal Card - Highlighted with gradient background
    return (
      <View style={{
        position: 'relative',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#22d3ee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        flex: 1,
        minWidth: 250,
        overflow: 'hidden',
      }}>
        <LinearGradient
          colors={['#ecfeff', '#eff6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header Row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
            margin: 0,
            padding: 0,
          }}>
            {/* Rank Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <View style={{
                position: 'relative',
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <LinearGradient
                  colors={['#22d3ee', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    lineHeight: 16,
                    color: '#ffffff',
                    fontWeight: '600',
                  }}>
                    #{rank}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Best Deal Badge */}
            <View style={{
              position: 'relative',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#22d3ee',
              overflow: 'hidden',
            }}>
              <LinearGradient
                colors={['#22d3ee', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                }} numberOfLines={1}>
                  Best Deal
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Store Info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            margin: 0,
            padding: 0,
          }}>
            {/* Store Image */}
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: '#ffffff',
              borderRadius: 4,
            }}>
              <Image
                source={{ uri: storeImage }}
                style={{
                  width: 40,
                  height: 40,
                  padding: 6,
                }}
                resizeMode="contain"
              />
            </View>

            {/* Store Name & Price */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                lineHeight: 24,
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: 2,
                margin: 0,
                padding: 0,
              }}>
                {storeName}
              </Text>

              <Text style={{
                fontSize: 30,
                lineHeight: 36,
                fontWeight: '700',
                color: '#14532d',
                margin: 0,
                padding: 0,
              }}>
                {price}
              </Text>
            </View>
          </View>

          {/* View at Store Button */}
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                position: 'relative',
                width: '100%',
                height: 32,
                borderRadius: 6,
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  height: 32,
                }}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M15 3h6v6" />
                  <Path d="M10 14 21 3" />
                  <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </Svg>
                <Text style={{
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '600',
                  color: '#ffffff',
                }}>
                  View at Store
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Regular Glass Card - Non-highlighted
  return (
    <View style={{
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(139, 149, 168, 0.15)',
      backgroundColor: 'rgba(21, 27, 40, 0.6)',
      flex: 1,
      minWidth: 250,
    }}>
      {/* Header Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
        margin: 0,
        padding: 0,
      }}>
        {/* Rank Badge */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <View style={{
            position: 'relative',
            width: 28,
            height: 28,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['#22d3ee', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
              }}
            >
              <Text style={{
                fontSize: 12,
                lineHeight: 16,
                color: '#ffffff',
                fontWeight: '600',
              }}>
                #{rank}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Store Info */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        margin: 0,
        padding: 0,
      }}>
        {/* Store Image */}
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#ffffff',
          borderRadius: 4,
        }}>
          <Image
            source={{ uri: storeImage }}
            style={{
              width: 40,
              height: 40,
              padding: 6,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Store Name & Price */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '600',
            color: '#e8edf4',
            marginBottom: 2,
            margin: 0,
            padding: 0,
          }}>
            {storeName}
          </Text>

          <Text style={{
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '700',
            color: '#14532d',
            margin: 0,
            padding: 0,
          }}>
            {price}
          </Text>
        </View>
      </View>

      {/* View at Store Button */}
      <View style={{ marginTop: 8 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: '100%',
            height: 32,
            borderRadius: 6,
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
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 12,
              height: 32,
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 3h6v6" />
              <Path d="M10 14 21 3" />
              <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </Svg>
            <Text style={{
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '600',
              color: '#ffffff',
            }}>
              View at Store
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
