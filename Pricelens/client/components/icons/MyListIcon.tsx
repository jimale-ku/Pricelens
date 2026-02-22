import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MyListIconProps {
  size?: number;
  color?: string;
}

export default function MyListIcon({ size = 24, color = 'currentColor' }: MyListIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12h.01" />
      <Path d="M3 18h.01" />
      <Path d="M3 6h.01" />
      <Path d="M8 12h13" />
      <Path d="M8 18h13" />
      <Path d="M8 6h13" />
    </Svg>
  );
}
