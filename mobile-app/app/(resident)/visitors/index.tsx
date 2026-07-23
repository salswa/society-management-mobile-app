import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { VisitorStatus } from '@/api/types';
import { useVisitors } from '@/query/hooks';
import {
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  SegmentedControl,
  Text,
  VisitorActionRow,
  VisitorCard,
} from '@/components';
import { spacing } from '@/theme/tokens';

const FILTERS: { label: string; value: VisitorStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Inside', value: 'checked_in' },
];

const EMPTY: Record<string, { title: string; message: string }> = {
  pending: { title: 'No pending visitors', message: 'Nothing needs your approval right now.' },
  checked_in: { title: 'No one inside', message: 'Visitors currently inside will appear here.' },
  all: { title: 'No visitors yet', message: 'Visitors registered at the gate will show up here.' },
};

export default function ResidentVisitors() {
  const router = useRouter();
  const [filter, setFilter] = useState<VisitorStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching } = useVisitors({
    status: filter,
    mine: true,
  });

  const empty = EMPTY[filter ?? 'all'] ?? EMPTY.all;
  const open = (id: string) => router.push(`/(resident)/visitors/${id}`);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Visitors</Text>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
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
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={empty.title} message={empty.message} />
          }
          renderItem={({ item }) =>
            item.status === 'pending' ? (
              <VisitorActionRow visitor={item} showFlat={false} onPress={() => open(item.id)} />
            ) : (
              <VisitorCard visitor={item} showFlat={false} onPress={() => open(item.id)} />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  fill: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
});
