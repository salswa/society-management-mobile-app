import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Complaint, ComplaintStatus } from '@/api/types';
import { useComplaints } from '@/query/hooks';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  SegmentedControl,
  Text,
} from '@/components';
import { complaintStatusMeta, formatRelativeTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const FILTERS: { label: string; value: ComplaintStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'open' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
];

type Props = {
  scope: 'mine' | 'all';
  onOpen: (id: string) => void;
  onNew?: () => void;
  showAuthor?: boolean;
};

export function ComplaintsList({ scope, onOpen, onNew, showAuthor = false }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching } = useComplaints({ scope, status });

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1">Helpdesk</Text>
        {onNew ? (
          <Button title="Raise a complaint" icon="add" onPress={onNew} />
        ) : (
          <Text variant="small" color={colors.textMuted}>
            Every complaint raised in the society.
          </Text>
        )}
        <SegmentedControl options={FILTERS} value={status} onChange={setStatus} />
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
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No complaints"
              message={onNew ? 'Raise one and track it here.' : 'Nothing has been raised yet.'}
            />
          }
          renderItem={({ item }) => (
            <Row complaint={item} showAuthor={showAuthor} onPress={() => onOpen(item.id)} />
          )}
        />
      )}
    </Screen>
  );
}

function Row({
  complaint,
  showAuthor,
  onPress,
}: {
  complaint: Complaint;
  showAuthor: boolean;
  onPress: () => void;
}) {
  const status = complaintStatusMeta(complaint.status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowTop}>
        <Text variant="bodyStrong" style={styles.title} numberOfLines={1}>
          {complaint.title}
        </Text>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text variant="small" color={colors.textMuted} numberOfLines={1}>
        {complaint.category} · {formatRelativeTime(complaint.created_at)}
        {showAuthor && complaint.raised_by_profile ? ` · ${complaint.raised_by_profile.name}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  back: { width: 30, height: 30, justifyContent: 'center', marginLeft: -4 },
  fill: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 24, flexGrow: 1 },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  pressed: { opacity: 0.85 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1 },
});
