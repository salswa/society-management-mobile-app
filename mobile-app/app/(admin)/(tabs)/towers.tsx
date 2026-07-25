import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import {
  useCreateTower,
  useDeleteTower,
  useFlats,
  useTowers,
  useUpdateTower,
} from '@/query/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Screen,
  SheetModal,
  Text,
  TopBar,
} from '@/components';
import { colors, spacing } from '@/theme/tokens';

type TowerForm = { id?: string; name: string };

export default function AdminTowers() {
  const towers = useTowers();
  const flats = useFlats();
  const createTower = useCreateTower();
  const updateTower = useUpdateTower();
  const deleteTower = useDeleteTower();
  const busy = createTower.isPending || updateTower.isPending || deleteTower.isPending;

  const [form, setForm] = useState<TowerForm | null>(null);

  const flatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of flats.data ?? []) counts.set(f.tower_id, (counts.get(f.tower_id) ?? 0) + 1);
    return counts;
  }, [flats.data]);

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const save = () => {
    const name = form?.name.trim();
    if (!name) return;
    const opts = { onSuccess: () => setForm(null), onError };
    if (form?.id) updateTower.mutate({ id: form.id, name }, opts);
    else createTower.mutate(name, opts);
  };

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Delete tower', `Delete ${name} and all its flats? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTower.mutate(id, { onError }) },
    ]);

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Towers" />}>
      {towers.isLoading ? (
        <Loading />
      ) : towers.isError ? (
        <ErrorState onRetry={towers.refetch} />
      ) : (
        <View style={styles.container}>
          <Button title="Add tower" icon="add" onPress={() => setForm({ name: '' })} />

          {(towers.data ?? []).length > 0 ? (
            (towers.data ?? []).map((t) => {
              const count = flatCounts.get(t.id) ?? 0;
              return (
                <Card key={t.id} style={styles.card}>
                  <View style={styles.rowTop}>
                    <View style={styles.info}>
                      <Text variant="bodyStrong">{t.name}</Text>
                      <Text variant="small" color={colors.textMuted}>
                        {count} flat{count === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      title="Rename"
                      size="sm"
                      fullWidth={false}
                      variant="outline"
                      icon="create-outline"
                      disabled={busy}
                      onPress={() => setForm({ id: t.id, name: t.name })}
                    />
                    <Button
                      title="Delete"
                      size="sm"
                      fullWidth={false}
                      variant="dangerOutline"
                      disabled={busy}
                      onPress={() => confirmDelete(t.id, t.name)}
                    />
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState icon="business-outline" title="No towers yet" message="Add your first tower." />
          )}
        </View>
      )}

      <SheetModal
        visible={form !== null}
        title={form?.id ? 'Rename tower' : 'Add tower'}
        onClose={() => setForm(null)}
      >
        <Input
          label="Tower name"
          value={form?.name ?? ''}
          onChangeText={(name) => setForm((f) => (f ? { ...f, name } : f))}
          placeholder="e.g. Tower A"
          autoFocus
        />
        <Button title="Save" loading={busy} onPress={save} />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
