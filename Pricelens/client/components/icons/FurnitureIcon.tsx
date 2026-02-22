import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function FurnitureIcon({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 13V2l8 4-8 4" />
      <Path d="M20 8v8" />
      <Path d="M4 8v8" />
      <Path d="M4 13h16" />
      <Path d="M6 22v-3" />
      <Path d="M18 22v-3" />
      <Rect width="20" height="4" x="2" y="13" rx="2" />
    </Svg>
  );
}
