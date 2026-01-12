import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FitnessIconProps {
  size?: number;
  color?: string;
}

export default function FitnessIcon({ size = 24, color = 'currentColor' }: FitnessIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <Path d="M3.2 12.8H2v4h2" />
      <Path d="M10 12h-1l1.4.7c.3.1.6.4.8.7l2 3.6c.2.4.7.5 1.1.2l1.4-.7c.3-.1.6-.4.8-.7l2-3.6c.2-.4.7-.5 1.1-.2l1.4.7H22" />
    </Svg>
  );
}
