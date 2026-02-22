import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface GymsIconProps {
  size?: number;
  color?: string;
}

export default function GymsIcon({ size = 24, color = 'currentColor' }: GymsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m6.5 6.5 11 11" />
      <Path d="m21 21-1.5-1.5" />
      <Path d="M3 3l1.5 1.5" />
      <Path d="m16 6 2-2" />
      <Path d="m2 18-2 2" />
      <Path d="m7 2 2 2" />
      <Path d="m22 16-2 2" />
      <Path d="m22 2-2 2" />
      <Path d="m2 22 2-2" />
    </Svg>
  );
}
