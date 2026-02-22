/**
 * PriceLens Logo Component
 * Composite icon using Lucide icons to approximate the client's logo design:
 * - Magnifying glass (Search icon)
 * - Dollar sign inside (DollarSign icon)
 * - Wing-like elements on sides (custom SVG wings)
 * 
 * This is an approximation using Lucide icons. For the exact logo design,
 * use the image file at client/assets/logo.png instead.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Search, DollarSign } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface PriceLensLogoProps {
  size?: number;
  color?: string;
}

export default function PriceLensLogo({ size = 32, color = '#FFFFFF' }: PriceLensLogoProps) {
  // Calculate proportional sizes
  const magnifyingGlassSize = size * 0.85;
  const dollarSignSize = size * 0.35; // Dollar sign inside the magnifying glass
  const wingSize = size * 0.4; // Wings on the sides

  return (
    <View style={[styles.container, { width: size * 1.5, height: size }]}>
      {/* Left Wing - stylized upward wing */}
      <View style={[styles.wing, styles.leftWing]}>
        <Svg width={wingSize} height={wingSize} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 12L8 4L12 8L8 12L3 12Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.3}
          />
          <Path
            d="M3 12L8 20L12 16L8 12L3 12Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.3}
          />
        </Svg>
      </View>

      {/* Center: Magnifying Glass with Dollar Sign */}
      <View style={[styles.centerIcon, { width: magnifyingGlassSize, height: magnifyingGlassSize }]}>
        {/* Magnifying Glass */}
        <Search 
          size={magnifyingGlassSize} 
          color={color} 
          strokeWidth={2.5}
        />
        
        {/* Dollar Sign - positioned inside the magnifying glass lens (center-left area) */}
        <View style={[styles.dollarSignContainer, { 
          width: dollarSignSize, 
          height: dollarSignSize,
          top: magnifyingGlassSize * 0.2,
          left: magnifyingGlassSize * 0.2,
        }]}>
          <DollarSign 
            size={dollarSignSize} 
            color={color} 
            strokeWidth={3}
          />
        </View>
      </View>

      {/* Right Wing - stylized upward wing (mirrored) */}
      <View style={[styles.wing, styles.rightWing]}>
        <Svg width={wingSize} height={wingSize} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 12L16 4L12 8L16 12L21 12Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.3}
          />
          <Path
            d="M21 12L16 20L12 16L16 12L21 12Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.3}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dollarSignContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  wing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  leftWing: {
    left: -2,
  },
  rightWing: {
    right: -2,
  },
});

