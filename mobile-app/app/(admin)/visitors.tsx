import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { VisitorStatus } from '@/api/types';
import { useVisitors } from '@/query/hooks';
import { EmptyState, ErrorState, Loading, Screen, SegmentedControl, Text, VisitorCard } from '@/components';
import { spacing } from '@/theme/tokens';

const FILTERS: { label: string; value: VisitorStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Inside', value: 'checked_in' },
  { label: 'Left', value: 'checked_out' },
];

export default function AdminVisitors() {
  const router = useRouter();
  const [filter, setFilter] = useState<VisitorStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching } = useVisitors({
    status: filter,
    limit: 100,
  });

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Visitor log</Text>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No visitors" />}
          renderItem={({ item }) => (
            <VisitorCard visitor={item} onPress={() => router.push(`/(admin)/visitor/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  list: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
});
