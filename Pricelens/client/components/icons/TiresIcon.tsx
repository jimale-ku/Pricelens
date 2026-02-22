import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface TiresIconProps {
  size?: number;
  color?: string;
}

export default function TiresIcon({ size = 24, color = 'currentColor' }: TiresIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 12h.01" />
      <Path d="M19.5 13.57a6 6 0 1 0 0-3.14" />
    </Svg>
  );
}
