/**
 * ShoppingBagIcon - Custom SVG Icon from Figma
 */

import Svg, { Path } from 'react-native-svg';

interface ShoppingBagIconProps {
  size?: number;
  color?: string;
}

export default function ShoppingBagIcon({ size = 24, color = 'currentColor' }: ShoppingBagIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <Path d="M3 6h18" />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </Svg>
  );
}
