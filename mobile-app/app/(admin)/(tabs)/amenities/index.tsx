import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/api/client';
import type { Amenity } from '@/api/types';
import { useAmenities, useCreateAmenity, useUpdateAmenity } from '@/query/hooks';
import {
  Badge,
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
import { colors, radius, spacing } from '@/theme/tokens';

type AmenityForm = {
  id?: string;
  name: string;
  description: string;
  capacity: string;
  open_time: string;
  close_time: string;
  slot_minutes: string;
  is_active: boolean;
};

const EMPTY: AmenityForm = {
  name: '',
  description: '',
  capacity: '1',
  open_time: '06:00',
  close_time: '22:00',
  slot_minutes: '60',
  is_active: true,
};

export default function AdminAmenities() {
  const router = useRouter();
  const amenities = useAmenities();
  const createAmenity = useCreateAmenity();
  const updateAmenity = useUpdateAmenity();
  const busy = createAmenity.isPending || updateAmenity.isPending;

  const [form, setForm] = useState<AmenityForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AmenityForm>(k: K, v: AmenityForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const openEdit = (a: Amenity) =>
    setForm({
      id: a.id,
      name: a.name,
      description: a.description ?? '',
      capacity: String(a.capacity),
      open_time: a.open_time.slice(0, 5),
      close_time: a.close_time.slice(0, 5),
      slot_minutes: String(a.slot_minutes),
      is_active: a.is_active,
    });

  const save = () => {
    if (!form) return;
    setError(null);
    const name = form.name.trim();
    if (!name) return setError('Enter a name.');
    const time = /^\d{2}:\d{2}$/;
    if (!time.test(form.open_time) || !time.test(form.close_time))
      return setError('Times must be HH:MM.');
    const capacity = Number(form.capacity);
    const slot_minutes = Number(form.slot_minutes);
    if (!capacity || capacity < 1) return setError('Capacity must be at least 1.');
    if (!slot_minutes || slot_minutes < 15) return setError('Slot length must be ≥ 15 minutes.');

    const input = {
      name,
      description: form.description.trim() || undefined,
      capacity,
      open_time: form.open_time,
      close_time: form.close_time,
      slot_minutes,
      is_active: form.is_active,
    };
    const opts = { onSuccess: () => setForm(null), onError };
    if (form.id) updateAmenity.mutate({ id: form.id, input }, opts);
    else createAmenity.mutate(input, opts);
  };

  const list = amenities.data ?? [];

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Amenities" />}>
      <View style={styles.container}>
        <Button title="Add amenity" icon="add" onPress={() => setForm({ ...EMPTY })} />

        {amenities.isLoading ? (
          <Loading />
        ) : amenities.isError ? (
          <ErrorState onRetry={amenities.refetch} />
        ) : list.length > 0 ? (
          list.map((a) => (
            <Card key={a.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.info}>
                  <Text variant="bodyStrong">{a.name}</Text>
                  <Text variant="small" color={colors.textMuted}>
                    {a.open_time.slice(0, 5)}–{a.close_time.slice(0, 5)} · {a.slot_minutes}-min · cap {a.capacity}
                  </Text>
                </View>
                <Badge label={a.is_active ? 'Active' : 'Inactive'} tone={a.is_active ? 'success' : 'neutral'} />
              </View>
              <View style={styles.actions}>
                <Button
                  title="Edit"
                  size="sm"
                  fullWidth={false}
                  variant="outline"
                  icon="create-outline"
                  disabled={busy}
                  onPress={() => openEdit(a)}
                />
                <Button
                  title="Bookings"
                  size="sm"
                  fullWidth={false}
                  variant="secondary"
                  icon="calendar-outline"
                  onPress={() => router.push(`/(admin)/amenities/${a.id}`)}
                />
              </View>
            </Card>
          ))
        ) : (
          <EmptyState icon="tennisball-outline" title="No amenities" message="Add the first shared facility." />
        )}
      </View>

      <SheetModal
        visible={form !== null}
        title={form?.id ? 'Edit amenity' : 'Add amenity'}
        onClose={() => {
          setForm(null);
          setError(null);
        }}
      >
        <Input label="Name" value={form?.name ?? ''} onChangeText={(v) => set('name', v)} placeholder="e.g. Clubhouse" autoFocus />
        <Input
          label="Description (optional)"
          value={form?.description ?? ''}
          onChangeText={(v) => set('description', v)}
          placeholder="Short note"
        />
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Input label="Opens (HH:MM)" value={form?.open_time ?? ''} onChangeText={(v) => set('open_time', v)} placeholder="06:00" autoCapitalize="none" />
          </View>
          <View style={styles.pairItem}>
            <Input label="Closes (HH:MM)" value={form?.close_time ?? ''} onChangeText={(v) => set('close_time', v)} placeholder="22:00" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Input label="Slot minutes" value={form?.slot_minutes ?? ''} onChangeText={(v) => set('slot_minutes', v)} keyboardType="number-pad" placeholder="60" />
          </View>
          <View style={styles.pairItem}>
            <Input label="Capacity" value={form?.capacity ?? ''} onChangeText={(v) => set('capacity', v)} keyboardType="number-pad" placeholder="1" />
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="label" color={colors.textMuted}>
            STATUS
          </Text>
          <View style={styles.chips}>
            {[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
            ].map((s) => {
              const active = form?.is_active === s.value;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => set('is_active', s.value)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <Text variant="small" color={colors.danger}>
            {error}
          </Text>
        ) : null}

        <Button title="Save" loading={busy} onPress={save} />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  info: { gap: 2, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
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
