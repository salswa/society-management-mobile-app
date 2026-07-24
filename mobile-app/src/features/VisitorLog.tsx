import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Visitor } from '@/api/types';
import { useVisitorHistory } from '@/query/hooks';
import { EmptyState, ErrorState, Loading, Screen, Text } from '@/components';
import { flatLabel, formatRelativeTime, visitorTypeMeta } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

/** Read-only entry/exit log of completed visits. Shared by the guard History
 *  tab and the admin Visitor log tab. */
export function VisitorLog({
  title,
  subtitle,
  onOpen,
}: {
  title: string;
  subtitle: string;
  onOpen: (id: string) => void;
}) {
  const { data, isLoading, isError, refetch, isRefetching } = useVisitorHistory({ limit: 100 });

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">{title}</Text>
        <Text variant="small" color={colors.textMuted}>
          {subtitle}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.fill}>
          <Loading />
        </View>
      ) : isError ? (
        <View style={styles.fill}>
          <ErrorState onRetry={refetch} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No records yet"
              message="Completed visits appear here."
            />
          }
          renderItem={({ item }) => <LogRow visitor={item} onPress={() => onOpen(item.id)} />}
        />
      )}
    </Screen>
  );
}

function LogRow({ visitor, onPress }: { visitor: Visitor; onPress: () => void }) {
  const type = visitorTypeMeta(visitor.type);
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
        <View style={styles.times}>
          <View style={styles.timeItem}>
            <Ionicons name="log-in-outline" size={13} color={colors.success} />
            <Text variant="small" color={colors.success}>
              {formatRelativeTime(visitor.entry_at)}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="log-out-outline" size={13} color={colors.danger} />
            <Text variant="small" color={colors.danger}>
              {formatRelativeTime(visitor.exit_at)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 2,
  },
  fill: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
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
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
