import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import type { Flat } from '@/api/types';
import {
  useCreateFlat,
  useDeleteFlat,
  useFlats,
  useTowers,
  useUpdateFlat,
} from '@/query/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Screen,
  SectionTitle,
  SheetModal,
  Text,
  TopBar,
} from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

type FlatForm = { id?: string; tower_id: string; number: string; floor: string };

export default function AdminFlats() {
  const flats = useFlats();
  const towers = useTowers();
  const createFlat = useCreateFlat();
  const updateFlat = useUpdateFlat();
  const deleteFlat = useDeleteFlat();
  const busy = createFlat.isPending || updateFlat.isPending || deleteFlat.isPending;

  const [form, setForm] = useState<FlatForm | null>(null);

  const towerList = towers.data ?? [];
  const towerName = (id: string) => towerList.find((t) => t.id === id)?.name ?? 'Other';

  const groups = useMemo(() => {
    const byTower = new Map<string, Flat[]>();
    for (const f of flats.data ?? []) {
      const list = byTower.get(f.tower_id) ?? [];
      list.push(f);
      byTower.set(f.tower_id, list);
    }
    return [...byTower.entries()].sort(([a], [b]) => towerName(a).localeCompare(towerName(b)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flats.data, towerList]);

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const openAdd = () => {
    if (towerList.length === 0) {
      Alert.alert('Add a tower first', 'Create a tower before adding flats.');
      return;
    }
    setForm({ tower_id: towerList[0].id, number: '', floor: '' });
  };

  const save = () => {
    if (!form) return;
    const number = form.number.trim();
    if (!number) return;
    const floor = form.floor.trim() ? Number(form.floor.trim()) : undefined;
    const opts = { onSuccess: () => setForm(null), onError };
    if (form.id) updateFlat.mutate({ id: form.id, number, floor }, opts);
    else createFlat.mutate({ tower_id: form.tower_id, number, floor }, opts);
  };

  const confirmDelete = (f: Flat) =>
    Alert.alert('Delete flat', `Delete ${f.number}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFlat.mutate(f.id, { onError }) },
    ]);

  const isLoading = flats.isLoading || towers.isLoading;

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Flats" />}>
      {isLoading ? (
        <Loading />
      ) : flats.isError || towers.isError ? (
        <ErrorState
          onRetry={() => {
            flats.refetch();
            towers.refetch();
          }}
        />
      ) : (
        <View style={styles.container}>
          <Button title="Add flat" icon="add" onPress={openAdd} />

          {groups.length > 0 ? (
            groups.map(([towerId, list]) => (
              <View key={towerId} style={styles.group}>
                <SectionTitle>{towerName(towerId)}</SectionTitle>
                {list
                  .slice()
                  .sort((a, b) => a.number.localeCompare(b.number))
                  .map((f) => (
                    <Card key={f.id} style={styles.card}>
                      <View style={styles.info}>
                        <Text variant="bodyStrong">{f.number}</Text>
                        <Text variant="small" color={colors.textMuted}>
                          {f.floor != null ? `Floor ${f.floor} · ` : ''}
                          {f.flat_residents?.[0]?.profile?.name ?? 'Vacant'}
                        </Text>
                      </View>
                      <View style={styles.actions}>
                        <Button
                          title="Edit"
                          size="sm"
                          fullWidth={false}
                          variant="outline"
                          icon="create-outline"
                          disabled={busy}
                          onPress={() =>
                            setForm({
                              id: f.id,
                              tower_id: f.tower_id,
                              number: f.number,
                              floor: f.floor != null ? String(f.floor) : '',
                            })
                          }
                        />
                        <Button
                          title="Delete"
                          size="sm"
                          fullWidth={false}
                          variant="dangerOutline"
                          disabled={busy}
                          onPress={() => confirmDelete(f)}
                        />
                      </View>
                    </Card>
                  ))}
              </View>
            ))
          ) : (
            <EmptyState
              icon="grid-outline"
              title="No flats yet"
              message="Add flats to your towers."
            />
          )}
        </View>
      )}

      <SheetModal
        visible={form !== null}
        title={form?.id ? 'Edit flat' : 'Add flat'}
        onClose={() => setForm(null)}
      >
        {!form?.id ? (
          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              Tower
            </Text>
            <View style={styles.chips}>
              {towerList.map((t) => {
                const active = form?.tower_id === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setForm((f) => (f ? { ...f, tower_id: t.id } : f))}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      variant="small"
                      color={active ? colors.textInverse : colors.ink}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <Text variant="small" color={colors.textMuted}>
            {towerName(form.tower_id)}
          </Text>
        )}

        <Input
          label="Flat number"
          value={form?.number ?? ''}
          onChangeText={(number) => setForm((f) => (f ? { ...f, number } : f))}
          placeholder="e.g. A-101"
          autoFocus
        />
        <Input
          label="Floor (optional)"
          value={form?.floor ?? ''}
          onChangeText={(floor) => setForm((f) => (f ? { ...f, floor } : f))}
          placeholder="e.g. 1"
          keyboardType="number-pad"
        />
        <Button title="Save" loading={busy} onPress={save} />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  group: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  info: { gap: 2, flexShrink: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
});
