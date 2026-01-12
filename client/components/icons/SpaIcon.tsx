import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function SpaIcon({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <Path d="M8.5 8.5v.01" />
      <Path d="M16 15.5v.01" />
      <Path d="M12 12v.01" />
      <Path d="M11 17v.01" />
      <Path d="M7 14v.01" />
    </Svg>
  );
}
