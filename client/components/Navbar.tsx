/**
 * Top App Header - PriceLens Branding
 * Pixel-perfect match to Figma design
 * 
 * TODO: Replace placeholder eye icon with actual SVG/image asset
 */

import { View, Text, useWindowDimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

export default function Navbar() {
  const { width } = useWindowDimensions();
  
  // Responsive sizing based on screen width
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  
  // Figma exact: 64x64 icon with rounded-2xl (16px)
  const iconSize = 64;
  const iconRadius = 16;
  const eyeIconSize = 32; // Figma exact: h-8 w-8 = 32x32 white eye icon
  
  // Text sizing - Figma exact
  const titleSize = 24; // text-2xl = 24px
  const taglineSize = isMobile ? 11 : isTablet ? 13 : 14;
  
  // Figma exact padding: px-4 py-5 sm:px-6 lg:px-8
  // py-5 = 20px vertical, px varies by screen size
  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32; // 16px, 24px, 32px
  const verticalPadding = 20; // py-5 = 20px top and bottom

  return (
    <View 
      style={{ 
        paddingHorizontal: horizontalPadding,
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
        maxWidth: 1280, // max-w-7xl
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        height: 64,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* App Logo Icon - Purple Gradient Square with Rounded Corners and Shadow */}
          {/* Figma: 64x64, rounded-2xl (16px), bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500, shadow-lg shadow-blue-500/50 */}
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconRadius,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#3B82F6',
              shadowOffset: {
                width: 0,
                height: 10,
              },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            {/* White Eye Icon - Figma: 32x32 lucide-eye icon in white */}
            <Svg
              width={eyeIconSize}
              height={eyeIconSize}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>

          {/* App Title & Tagline */}
          <View style={{ flex: 1 }}>
            {/* App Name - Figma: text-2xl font-bold tracking-tight #E8EDF4 */}
            <Text 
              style={{ 
                color: '#E8EDF4', 
                fontSize: titleSize,
                fontWeight: '700',
                letterSpacing: -0.5, // tracking-tight
              }}
            >
              PriceLens
            </Text>
            {/* Tagline - Lighter Gray/White Text */}
            <Text 
              style={{ 
                color: '#9CA3AF', 
                fontSize: taglineSize,
                marginTop: 2,
              }}
            >
              See the Savings Clearly
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
