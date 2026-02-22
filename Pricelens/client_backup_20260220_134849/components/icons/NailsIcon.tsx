import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface NailsIconProps {
  size?: number;
  color?: string;
}

export default function NailsIcon({ size = 24, color = 'currentColor' }: NailsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11.5 5.5c-.71 0-1.4.21-2 .6L2 11.5V22h10.5l9.4-9.4a2.12 2.12 0 0 0 0-3l-7.2-7.2c-.5-.5-1.22-.76-1.95-.76z" />
      <Path d="M2 11.5 12.5 22" />
      <Path d="M18.2 6.5 15.6 3.9" />
    </Svg>
  );
}
