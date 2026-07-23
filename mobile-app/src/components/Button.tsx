import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerOutline' | 'ghost';
type Size = 'md' | 'sm';

type Props = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  icon,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && styles.fullWidth,
        (pressed || isDisabled) && styles.dim,
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
            <Text style={[styles.label, { color: palette.fg }]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.textInverse, border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.ink },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  danger: { bg: colors.danger, fg: colors.textInverse, border: colors.danger },
  dangerOutline: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sm: { height: 44, paddingHorizontal: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontFamily: fonts.heading, fontSize: 15 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dim: { opacity: 0.7 },
});
