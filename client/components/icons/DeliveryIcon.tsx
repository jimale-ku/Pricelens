import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface DeliveryIconProps {
  size?: number;
  color?: string;
}

export default function DeliveryIcon({ size = 24, color = 'currentColor' }: DeliveryIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m7.5 4.27 9 5.15" />
      <Path d="M21 8.03V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.03c0-.45.19-.9.52-1.22L12 2 20.48 6.81c.33.32.52.77.52 1.22z" />
      <Path d="m12 22 8.5-5L12 12 3.5 17Z" />
      <Path d="m7.5 10.36 9 5.15" />
    </Svg>
  );
}
