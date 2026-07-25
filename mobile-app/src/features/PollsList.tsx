import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Poll } from '@/api/types';
import { usePolls } from '@/query/hooks';
import { Badge, Button, EmptyState, ErrorState, Loading, Screen, Text } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = { onOpen: (id: string) => void; onNew?: () => void };

export function PollsList({ onOpen, onNew }: Props) {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = usePolls();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1">Polls</Text>
        {onNew ? <Button title="Create a poll" icon="add" onPress={onNew} /> : null}
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
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="bar-chart-outline"
              title="No polls"
              message={onNew ? 'Create one for the society to vote on.' : 'Nothing to vote on yet.'}
            />
          }
          renderItem={({ item }) => <Row poll={item} onPress={() => onOpen(item.id)} />}
        />
      )}
    </Screen>
  );
}

function Row({ poll, onPress }: { poll: Poll; onPress: () => void }) {
  const open = poll.status === 'open';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowTop}>
        <Text variant="bodyStrong" style={styles.q} numberOfLines={2}>
          {poll.question}
        </Text>
        <Badge label={open ? 'Open' : 'Closed'} tone={open ? 'info' : 'neutral'} />
      </View>
      <Text variant="small" color={colors.textMuted}>
        {poll.options?.length ?? 0} options{poll.is_multi ? ' · multiple choice' : ''}
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
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  q: { flex: 1 },
});
