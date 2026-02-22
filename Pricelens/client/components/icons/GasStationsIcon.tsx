import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface GasStationsIconProps {
  size?: number;
  color?: string;
}

export default function GasStationsIcon({ size = 24, color = 'currentColor' }: GasStationsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="3" x2="15" y1="22" y2="22" />
      <Line x1="4" x2="14" y1="9" y2="9" />
      <Path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <Path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </Svg>
  );
}
