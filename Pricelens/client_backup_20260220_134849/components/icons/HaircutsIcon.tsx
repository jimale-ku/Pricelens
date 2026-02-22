import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface HaircutsIconProps {
  size?: number;
  color?: string;
}

export default function HaircutsIcon({ size = 24, color = 'currentColor' }: HaircutsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="6" cy="7" r="3" />
      <Path d="M8.12 8.12 12 12" />
      <Path d="M20 4 8.12 15.88" />
      <Circle cx="6" cy="17" r="3" />
      <Path d="M14.8 14.8 20 20" />
    </Svg>
  );
}
