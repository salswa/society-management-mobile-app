import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const TONES: Record<Tone, { bg: string; border: string; fg: string }> = {
  neutral: { bg: 'transparent', border: colors.border, fg: colors.textMuted },
  success: { bg: colors.successSoft, border: colors.success, fg: colors.success },
  warning: { bg: colors.warningSoft, border: colors.warning, fg: colors.warning },
  danger: { bg: colors.dangerSoft, border: colors.danger, fg: colors.danger },
  info: { bg: colors.infoSoft, border: colors.info, fg: colors.info },
  primary: { bg: colors.primarySoft, border: colors.primary, fg: colors.primary },
};

/** Outline pill badge (Syne, uppercase), tinted per status tone. */
export function Badge({
  label,
  tone = 'neutral',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <Text variant="label" color={t.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  text: { fontSize: 10, letterSpacing: 0.5 },
});
