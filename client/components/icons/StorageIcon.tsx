import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function StorageIcon({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="20" height="5" x="2" y="3" rx="1" />
      <Path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <Path d="M10 12h4" />
    </Svg>
  );
}
