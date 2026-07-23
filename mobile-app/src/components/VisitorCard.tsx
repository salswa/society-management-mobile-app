import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Visitor } from '@/api/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { flatLabel, formatRelativeTime, visitorStatusMeta, visitorTypeMeta } from '@/lib/format';
import { Badge } from './Badge';
import { Text } from './Text';

type Props = {
  visitor: Visitor;
  onPress?: () => void;
  showFlat?: boolean;
};

export function VisitorCard({ visitor, onPress, showFlat = true }: Props) {
  const status = visitorStatusMeta(visitor.status);
  const type = visitorTypeMeta(visitor.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Ionicons name={type.icon as never} size={20} color={colors.ink} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {visitor.name}
        </Text>
        <Text variant="small" color={colors.textMuted} numberOfLines={1}>
          {type.label}
          {showFlat ? ` · ${flatLabel(visitor.flat)}` : ` · ${formatRelativeTime(visitor.created_at)}`}
        </Text>
      </View>
      <Badge label={status.label} tone={status.tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
  },
  body: { flex: 1, gap: 2 },
});
