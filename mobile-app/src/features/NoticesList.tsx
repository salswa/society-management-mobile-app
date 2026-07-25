import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotices } from '@/query/hooks';
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, Text } from '@/components';
import { formatDateTime } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

/** Notice board list, reused by every role. `onOpen` navigates to the detail route. */
export function NoticesList({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate?: () => void;
}) {
  const { data, isLoading, isError, refetch, isRefetching } = useNotices();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Notices</Text>
        {onCreate ? (
          <Text variant="bodyStrong" color={colors.primary} onPress={onCreate}>
            + New
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState icon="megaphone-outline" title="No notices" message="Check back later." />
          }
          renderItem={({ item }) => (
            <Card onPress={() => onOpen(item.id)}>
              <View style={styles.titleRow}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.is_pinned ? (
                  <Ionicons name="pin" size={16} color={colors.primary} />
                ) : null}
              </View>
              <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
                {formatDateTime(item.published_at)}
              </Text>
              <Text
                variant="body"
                color={colors.textMuted}
                numberOfLines={2}
                style={{ marginTop: spacing.sm }}
              >
                {item.body}
              </Text>
              <View style={styles.badgeRow}>
                <Badge label={item.category} tone="primary" />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badgeRow: { flexDirection: 'row', marginTop: spacing.md },
});
