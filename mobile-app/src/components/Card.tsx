import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

/** White rounded surface with a hairline ink border, on the dotted canvas. */
export function Card({ children, onPress, style }: Props) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.85 },
});
