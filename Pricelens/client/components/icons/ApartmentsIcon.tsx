import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ApartmentsIconProps {
  size?: number;
  color?: string;
}

export default function ApartmentsIcon({ size = 24, color = 'currentColor' }: ApartmentsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <Path d="M10 6h4" />
      <Path d="M10 10h4" />
      <Path d="M10 14h4" />
      <Path d="M10 18h4" />
    </Svg>
  );
}
