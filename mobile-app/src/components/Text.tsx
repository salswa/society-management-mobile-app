import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Variant = keyof typeof typography;

type Props = RNTextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

/** Typed text primitive that pulls from the typography scale. */
export function Text({ variant = 'body', color, center, style, ...rest }: Props) {
  return (
    <RNText
      style={[
        typography[variant],
        { color: color ?? colors.text },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
