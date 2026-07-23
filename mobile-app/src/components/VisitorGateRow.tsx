import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Visitor } from '@/api/types';
import { ApiError } from '@/api/client';
import { useVisitorAction } from '@/query/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { flatLabel, visitorStatusMeta, visitorTypeMeta } from '@/lib/format';
import { Badge } from './Badge';
import { Text } from './Text';

/** Guard visitor row with an inline check-in / check-out action; row opens the detail. */
export function VisitorGateRow({ visitor, onPress }: { visitor: Visitor; onPress?: () => void }) {
  const action = useVisitorAction();
  const type = visitorTypeMeta(visitor.type);
  const status = visitorStatusMeta(visitor.status);

  const run = (act: 'checkIn' | 'checkOut') =>
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
          {type.label} · {flatLabel(visitor.flat)}
        </Text>
      </View>

      {visitor.status === 'approved' ? (
        <IconAction
          icon="log-in-outline"
          bg={colors.primary}
          loading={action.isPending}
          onPress={() => run('checkIn')}
        />
      ) : visitor.status === 'checked_in' ? (
        <IconAction
          icon="log-out-outline"
          bg={colors.ink}
          loading={action.isPending}
          onPress={() => run('checkOut')}
        />
      ) : (
        <Badge label={status.label} tone={status.tone} />
      )}
    </Pressable>
  );
}

function IconAction({
  icon,
  bg,
  loading,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      hitSlop={6}
      style={[styles.iconBtn, { backgroundColor: bg }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textInverse} size="small" />
      ) : (
        <Ionicons name={icon} size={22} color={colors.textInverse} />
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
