import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BooksIconProps {
  size?: number;
  color?: string;
}

export default function BooksIcon({ size = 24, color = 'currentColor' }: BooksIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    </Svg>
  );
}
