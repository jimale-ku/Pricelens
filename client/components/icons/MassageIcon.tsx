import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MassageIconProps {
  size?: number;
  color?: string;
}

export default function MassageIcon({ size = 24, color = 'currentColor' }: MassageIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12s3-2 8 0 8 0 8 0c2 0 2 0 2-2 0-4-3-6-3-6s-3-2-8-2-8 2-8 2c-5 0-8 2-8 6 0 2 0 2 2 2Z" />
      <Path d="M4 12c.76-2.6 1.9-4.93 2.6-6C7 4 9 2 12 2s5 2 5 4c.7 1.07 1.84 3.4 2.6 6" />
      <Path d="M12 22s-2-2-2-6c0-4 2-6 2-6s2 2 2 6c0 4-2 6-2 6Z" />
    </Svg>
  );
}
