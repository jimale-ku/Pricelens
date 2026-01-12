import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function SearchIcon({ width = 16, height = 16, color = '#FFF' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="11" 
        cy="11" 
        r="8" 
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m21 21-4.3-4.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
