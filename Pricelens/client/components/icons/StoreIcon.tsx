import Svg, { Path } from 'react-native-svg';

interface StoreIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function StoreIcon({ width = 24, height = 24, color = '#FFFFFF' }: StoreIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <Path d="M2 7h20" />
      <Path d="M22 7 18 3" />
      <Path d="M2 7 6 3" />
    </Svg>
  );
}
