/**
 * App Logo Component
 * 
 * Uses the PriceLens logo (SVG component) by default.
 * If you have a logo.png file, it will use that instead.
 * 
 * To use your own PNG logo:
 * 1. Save your logo image as logo.png in client/assets/ folder
 * 2. The component will automatically detect and use it
 */

import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import NewLogoSVG from './NewLogoSVG';
import PriceLensLogoSVG from './PriceLensLogoSVG';

interface AppLogoProps {
  size?: number;
  color?: string;
}

export default function AppLogo({ size = 32, color = '#FFFFFF' }: AppLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Try to load newLogo.png first (if it exists as PNG)
  let logoSource;
  try {
    logoSource = require('../assets/newLogo.png');
  } catch (e) {
    // If newLogo.png doesn't exist, try original logo.png
    try {
      logoSource = require('../assets/logo.png');
    } catch (e2) {
      logoSource = null;
    }
  }

  // If we have a PNG logo and it loaded successfully, use it
  if (logoSource && !imageError) {
    return (
      <Image
        source={logoSource}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2, // Make the image circular (half of size)
          resizeMode: 'cover', // Cover mode to fill the entire div
        }}
        onError={(error) => {
          console.log('⚠️ Logo image failed to load, using new SVG logo', error);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('✅ Logo image loaded successfully');
        }}
      />
    );
  }

  // Use the new logo SVG component (from newLogo.svg)
  return <NewLogoSVG size={size} />;
}

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

