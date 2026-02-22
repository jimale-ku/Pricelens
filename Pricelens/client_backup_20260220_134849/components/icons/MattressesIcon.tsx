import Svg, { Rect, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function MattressesIcon({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Path d="M3 9h18" />
      <Path d="M3 15h18" />
    </Svg>
  );
}
