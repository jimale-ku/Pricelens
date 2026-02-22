/**
 * PriceLens Logo - SVG Component
 * Based on the client's logo design:
 * - Magnifying glass with gradient (purple to blue)
 * - Dollar bill with dollar sign inside (golden yellow with purple $)
 * - Wings on both sides (golden yellow)
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Path, Text, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PriceLensLogoSVGProps {
  size?: number;
}

export default function PriceLensLogoSVG({ size = 32 }: PriceLensLogoSVGProps) {
  const viewBoxSize = 512;
  const scale = size / viewBoxSize;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <Defs>
          {/* Gradient for magnifying glass rim */}
          <LinearGradient id="magnifyingGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
            <Stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
            <Stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Left Wing */}
        <Path
          d="M 120 200 L 80 160 L 120 120 L 160 160 Z"
          fill="#FDE047"
          opacity="0.9"
        />
        <Path
          d="M 120 200 L 80 240 L 120 280 L 160 240 Z"
          fill="#FDE047"
          opacity="0.9"
        />
        <Path
          d="M 100 180 L 60 140 L 100 100 L 140 140 Z"
          fill="#FCD34D"
          opacity="0.7"
        />
        <Path
          d="M 100 220 L 60 260 L 100 300 L 140 260 Z"
          fill="#FCD34D"
          opacity="0.7"
        />

        {/* Right Wing */}
        <Path
          d="M 392 200 L 432 160 L 392 120 L 352 160 Z"
          fill="#FDE047"
          opacity="0.9"
        />
        <Path
          d="M 392 200 L 432 240 L 392 280 L 352 240 Z"
          fill="#FDE047"
          opacity="0.9"
        />
        <Path
          d="M 412 180 L 452 140 L 412 100 L 372 140 Z"
          fill="#FCD34D"
          opacity="0.7"
        />
        <Path
          d="M 412 220 L 452 260 L 412 300 L 372 260 Z"
          fill="#FCD34D"
          opacity="0.7"
        />

        {/* Magnifying Glass Circle (gradient border) */}
        <Circle
          cx="256"
          cy="256"
          r="100"
          fill="none"
          stroke="url(#magnifyingGlassGradient)"
          strokeWidth="20"
        />

        {/* Dollar Bill inside magnifying glass */}
        <Rect
          x="200"
          y="220"
          width="112"
          height="72"
          rx="8"
          fill="#FDE047"
        />
        
        {/* Dollar Sign on the bill */}
        <Text
          x="256"
          y="270"
          fontSize="64"
          fontWeight="bold"
          fill="#8B5CF6"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Arial, sans-serif"
        >
          $
        </Text>

        {/* Magnifying Glass Handle */}
        <Path
          d="M 320 320 L 380 380 L 400 360 L 340 300 Z"
          fill="#06B6D4"
        />
        <Path
          d="M 320 320 L 380 380"
          stroke="#06B6D4"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

