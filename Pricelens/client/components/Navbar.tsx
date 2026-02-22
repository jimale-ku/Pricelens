/**
 * Top App Header - PriceLens Branding
 * Pixel-perfect match to Figma design
 * 
 * TODO: Replace placeholder eye icon with actual SVG/image asset
 */

import { View, Text, useWindowDimensions } from "react-native";
import AppLogo from './AppLogo';

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
          {/* App Logo Icon - Circular with Dark Background */}
          <View
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2, // Fully circular
              backgroundColor: '#0F172A', // Dark background
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border for professionalism
            }}
          >
            {/* App Logo - Fills the circular div (90% of container for padding) */}
            <AppLogo size={iconSize * 0.9} color="#FFFFFF" />
          </View>

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
