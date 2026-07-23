import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/** Subtle dotted background pattern for the app canvas. */
export function DotGrid() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dots" width={18} height={18} patternUnits="userSpaceOnUse">
          <Circle cx={1} cy={1} r={1} fill={colors.ink} opacity={0.05} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}
