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
  VisitorGateRow,
} from '@/components';
import { spacing } from '@/theme/tokens';

const FILTERS: { label: string; value: VisitorStatus }[] = [
  { label: 'To arrive', value: 'approved' },
  { label: 'Inside', value: 'checked_in' },
  { label: 'Pending', value: 'pending' },
];

const EMPTY: Record<string, { icon: 'enter-outline' | 'business-outline' | 'hourglass-outline'; title: string; message: string }> = {
  approved: { icon: 'enter-outline', title: 'No one expected', message: 'Approved visitors ready to enter appear here.' },
  checked_in: { icon: 'business-outline', title: 'No one inside', message: 'Visitors currently inside appear here.' },
  pending: { icon: 'hourglass-outline', title: 'No pending approvals', message: 'These are waiting on the resident.' },
};

export default function GuardApprovals() {
  const router = useRouter();
  const [filter, setFilter] = useState<VisitorStatus>('approved');
  const { data, isLoading, isError, refetch, isRefetching } = useVisitors({ status: filter });
  const empty = EMPTY[filter];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Approvals</Text>
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
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState icon={empty.icon} title={empty.title} message={empty.message} />
          }
          renderItem={({ item }) => (
            <VisitorGateRow visitor={item} onPress={() => router.push(`/(guard)/visitor/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  fill: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
});
