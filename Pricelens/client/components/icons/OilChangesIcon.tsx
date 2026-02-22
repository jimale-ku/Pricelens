import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface OilChangesIconProps {
  size?: number;
  color?: string;
}

export default function OilChangesIcon({ size = 24, color = 'currentColor' }: OilChangesIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2.69L5.64 9a4.8 4.8 0 0 0 0 6.78c.68.68 1.83 1.07 2.92 1.07H12v6h2v-6h3.44c1.1-.01 2.25-.39 2.92-1.07a4.8 4.8 0 0 0 0-6.78L12 2.69zM12 18v-4" />
    </Svg>
  );
}
