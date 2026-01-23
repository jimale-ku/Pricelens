/**
 * New Logo SVG Component
 * Renders the newLogo.svg file
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Text, Defs, LinearGradient, Stop } from 'react-native-svg';

interface NewLogoSVGProps {
  size?: number;
}

export default function NewLogoSVG({ size = 32 }: NewLogoSVGProps) {
  const viewBoxSize = 512;
  const scale = size / viewBoxSize;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="magnifyingGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#6366F1" stopOpacity="1" />
            <Stop offset="1" stopColor="#06B6D4" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Magnifying Glass Circle */}
        <Circle
          cx="256"
          cy="256"
          r="94.53"
          stroke="url(#magnifyingGlassGradient)"
          strokeWidth="20"
          fill="rgba(217, 221, 208, 0.54)"
        />
        
        {/* Dollar Sign */}
        <Text
          x="256"
          y="270"
          fontSize="64"
          fontWeight="bold"
          fill="#8B5CF6"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Arial, sans-serif"
          transform="matrix(-3.08958, 0, 0, -1.688624, 2.188273, -8.111712)"
        >
          $
        </Text>
        
        {/* Magnifying Glass Handle */}
        <Line
          x1="321.094"
          y1="330.94"
          x2="388.752"
          y2="394.222"
          stroke="#06B6D4"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

