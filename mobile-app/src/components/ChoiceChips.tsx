import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Choice<T> = { label: string; value: T; icon?: keyof typeof Ionicons.glyphMap };

type Props<T extends string> = {
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Wrapping selectable pills (optionally with icons). Matches the SegmentedControl look. */
export function ChoiceChips<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = value === o.value;
        const fg = active ? colors.textInverse : colors.textMuted;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active ? styles.active : styles.idle]}
          >
            {o.icon ? <Ionicons name={o.icon} size={14} color={fg} /> : null}
            <Text variant="label" color={fg} style={styles.label}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  idle: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSoft },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { fontSize: 10.5, letterSpacing: 0.4 },
});
