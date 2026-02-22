/**
 * App Logo Component
 *
 * Uses newLogo2.jpeg as the app logo, displayed in a circle.
 * Falls back to newLogo.png, logo.png, or SVG if the image is missing.
 */

import React, { useState } from 'react';
import { Image } from 'react-native';
import NewLogoSVG from './NewLogoSVG';

interface AppLogoProps {
  size?: number;
  color?: string;
}

export default function AppLogo({ size = 32 }: AppLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Prefer newLogo2.jpeg (circular app logo)
  let logoSource: number | null = null;
  try {
    logoSource = require('../assets/newLogo2.jpeg');
  } catch (e) {
    try {
      logoSource = require('../assets/newLogo.png');
    } catch (e2) {
      try {
        logoSource = require('../assets/logo.png');
      } catch (e3) {
        logoSource = null;
      }
    }
  }

  if (logoSource && !imageError) {
    return (
      <Image
        source={logoSource}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return <NewLogoSVG size={size} />;
}
