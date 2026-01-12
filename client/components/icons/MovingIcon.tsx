import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function MovingIcon({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 3h5v5" />
      <Path d="M8 3H3v5" />
      <Path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <Path d="m15 9 6-6" />
      <Path d="M3 21h18" />
    </Svg>
  );
}
