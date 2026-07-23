import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Visitor } from '@/api/types';
import { ApiError } from '@/api/client';
import { useVisitorAction } from '@/query/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { flatLabel, formatRelativeTime, visitorTypeMeta } from '@/lib/format';
import { Text } from './Text';

type Props = {
  visitor: Visitor;
  onPress?: () => void;
  showFlat?: boolean;
};

/** Visitor row with inline round approve/reject buttons; the row opens the detail. */
export function VisitorActionRow({ visitor, onPress, showFlat = true }: Props) {
  const action = useVisitorAction();
  const type = visitorTypeMeta(visitor.type);

  const run = (act: 'approve' | 'reject') =>
    action.mutate(
      { id: visitor.id, action: act },
      {
        onError: (e) =>
          Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.'),
      }
    );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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

      {action.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => run('reject')} style={[styles.round, styles.reject]} hitSlop={6}>
            <Ionicons name="close" size={18} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => run('approve')} style={[styles.round, styles.approve]} hitSlop={6}>
            <Ionicons name="checkmark" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      )}
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
  pressed: { opacity: 0.85 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  spinner: { paddingHorizontal: spacing.md },
  round: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  reject: { backgroundColor: 'transparent', borderColor: colors.ink },
  approve: { backgroundColor: colors.primary, borderColor: colors.primary },
});
