import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Option<T> = { label: string; value: T };

type Props<T extends string | undefined> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
};

/** Segmented pill control: light track, dark active pill (Syne, uppercase). */
export function SegmentedControl<T extends string | undefined>({
  options,
  value,
  onChange,
  style,
}: Props<T>) {
  return (
    <View style={[styles.track, style]}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text
              variant="label"
              color={active ? colors.textInverse : colors.textMuted}
              style={styles.segText}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 3,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segActive: { backgroundColor: colors.ink },
  segText: { fontSize: 10.5, letterSpacing: 0.4 },
});
