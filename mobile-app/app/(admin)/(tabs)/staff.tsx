import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import type { StaffKind, StaffMember } from '@/api/types';
import { useCreateStaff, useDeleteStaff, useStaff, useUpdateStaff } from '@/query/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Screen,
  SegmentedControl,
  SheetModal,
  Text,
  TopBar,
} from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

const KIND_TABS: { label: string; value: StaffKind }[] = [
  { label: 'Staff', value: 'staff' },
  { label: 'Service providers', value: 'service_provider' },
];

type StaffForm = {
  id?: string;
  name: string;
  kind: StaffKind;
  category: string;
  phone: string;
  company: string;
};

export default function AdminStaff() {
  const [kind, setKind] = useState<StaffKind>('staff');
  const staff = useStaff(kind);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const busy = createStaff.isPending || updateStaff.isPending || deleteStaff.isPending;

  const [form, setForm] = useState<StaffForm | null>(null);

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const openAdd = () =>
    setForm({ name: '', kind, category: '', phone: '', company: '' });

  const save = () => {
    if (!form) return;
    const name = form.name.trim();
    if (!name) return;
    const input = {
      name,
      kind: form.kind,
      category: form.category.trim() || 'general',
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
    };
    const opts = { onSuccess: () => setForm(null), onError };
    if (form.id) updateStaff.mutate({ id: form.id, input }, opts);
    else createStaff.mutate(input, opts);
  };

  const confirmDelete = (m: StaffMember) =>
    Alert.alert('Remove entry', `Remove ${m.name} from the directory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteStaff.mutate(m.id, { onError }) },
    ]);

  const list = staff.data ?? [];

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Staff & providers" />}>
      <View style={styles.container}>
        <SegmentedControl options={KIND_TABS} value={kind} onChange={setKind} />
        <Button title="Add entry" icon="add" onPress={openAdd} />

        {staff.isLoading ? (
          <Loading />
        ) : staff.isError ? (
          <ErrorState onRetry={staff.refetch} />
        ) : list.length > 0 ? (
          list.map((m) => (
            <Card key={m.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.info}>
                  <Text variant="bodyStrong">{m.name}</Text>
                  <Text variant="small" color={colors.textMuted}>
                    {m.category}
                    {m.phone ? ` · ${m.phone}` : ''}
                    {m.company ? ` · ${m.company}` : ''}
                  </Text>
                </View>
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
                      id: m.id,
                      name: m.name,
                      kind: m.kind,
                      category: m.category,
                      phone: m.phone ?? '',
                      company: m.company ?? '',
                    })
                  }
                />
                <Button
                  title="Remove"
                  size="sm"
                  fullWidth={false}
                  variant="dangerOutline"
                  disabled={busy}
                  onPress={() => confirmDelete(m)}
                />
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title={kind === 'staff' ? 'No staff yet' : 'No service providers yet'}
            message="Add your first entry."
          />
        )}
      </View>

      <SheetModal
        visible={form !== null}
        title={form?.id ? 'Edit entry' : 'Add entry'}
        onClose={() => setForm(null)}
      >
        <View style={styles.field}>
          <Text variant="label" color={colors.textMuted}>
            Type
          </Text>
          <View style={styles.chips}>
            {KIND_TABS.map((t) => {
              const active = form?.kind === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setForm((f) => (f ? { ...f, kind: t.value } : f))}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Name"
          value={form?.name ?? ''}
          onChangeText={(name) => setForm((f) => (f ? { ...f, name } : f))}
          placeholder="e.g. Ramesh Kumar"
          autoFocus
        />
        <Input
          label="Category"
          value={form?.category ?? ''}
          onChangeText={(category) => setForm((f) => (f ? { ...f, category } : f))}
          placeholder="e.g. plumber, security, electrician"
        />
        <Input
          label="Phone (optional)"
          value={form?.phone ?? ''}
          onChangeText={(phone) => setForm((f) => (f ? { ...f, phone } : f))}
          keyboardType="phone-pad"
          placeholder="+91…"
        />
        <Input
          label="Company (optional)"
          value={form?.company ?? ''}
          onChangeText={(company) => setForm((f) => (f ? { ...f, company } : f))}
          placeholder="e.g. QuickFix Services"
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
