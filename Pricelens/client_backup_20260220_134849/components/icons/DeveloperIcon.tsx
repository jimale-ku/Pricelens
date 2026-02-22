import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface DeveloperIconProps {
  size?: number;
  color?: string;
}

export default function DeveloperIcon({ size = 24, color = 'currentColor' }: DeveloperIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <Path d="M18 17V9" />
      <Path d="M13 17V5" />
      <Path d="M8 17v-3" />
    </Svg>
  );
}
