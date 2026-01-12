import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MedicinesIconProps {
  size?: number;
  color?: string;
}

export default function MedicinesIcon({ size = 24, color = 'currentColor' }: MedicinesIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <Path d="m8.5 8.5 7 7" />
    </Svg>
  );
}
