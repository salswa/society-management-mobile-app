import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import type { Flat, Member, Role } from '@/api/types';
import {
  useApproveResident,
  useAssignResidentFlat,
  useDeleteResident,
  useResidents,
  useSetResidentStatus,
} from '@/query/hooks';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FlatPickerSheet,
  Loading,
  Screen,
  SectionTitle,
  Text,
  TopBar,
  type Tone,
} from '@/components';
import { flatLabel } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const ROLE_META: Record<Role, { label: string; tone: Tone }> = {
  resident: { label: 'Resident', tone: 'primary' },
  guard: { label: 'Guard', tone: 'info' },
  admin: { label: 'Admin', tone: 'success' },
};

type Sheet = { mode: 'approve' | 'assign'; member: Member } | null;

export default function AdminResidents() {
  const { profile } = useAuth();
  const pending = useResidents({ status: 'pending' });
  const members = useResidents({});

  const approve = useApproveResident();
  const assign = useAssignResidentFlat();
  const setStatus = useSetResidentStatus();
  const remove = useDeleteResident();
  const busy = approve.isPending || assign.isPending || setStatus.isPending || remove.isPending;

  const [sheet, setSheet] = useState<Sheet>(null);

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const onPickFlat = (flat: Flat) => {
    if (!sheet) return;
    const { mode, member } = sheet;
    setSheet(null);
    if (mode === 'approve') {
      approve.mutate({ id: member.id, flatId: flat.id }, { onError });
    } else {
      assign.mutate({ id: member.id, flatId: flat.id }, { onError });
    }
  };

  const confirmReject = (m: Member) =>
    Alert.alert('Reject request', `Reject and delete ${m.name}'s sign-up?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => remove.mutate(m.id, { onError }),
      },
    ]);

  const confirmDelete = (m: Member) =>
    Alert.alert('Delete member', `Permanently delete ${m.name}? This removes their account.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(m.id, { onError }),
      },
    ]);

  const isLoading = pending.isLoading || members.isLoading;
  const isError = pending.isError || members.isError;

  const pendingList = pending.data ?? [];
  // Members = society accounts, excluding the admin themselves and any pending.
  const memberList = (members.data ?? []).filter(
    (m) => m.id !== profile?.id && m.status !== 'pending'
  );

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Residents & flats" />}>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState
          onRetry={() => {
            pending.refetch();
            members.refetch();
          }}
        />
      ) : (
        <View style={styles.container}>
          <SectionTitle>{`Pending requests (${pendingList.length})`}</SectionTitle>
          {pendingList.length > 0 ? (
            pendingList.map((m) => (
              <Card key={m.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text variant="bodyStrong" style={styles.name} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Badge label="Pending" tone="warning" />
                </View>
                <Text variant="small" color={colors.textMuted}>
                  {m.email}
                  {m.phone ? ` · ${m.phone}` : ''}
                </Text>
                <View style={styles.actions}>
                  <Button
                    title="Approve"
                    size="sm"
                    fullWidth={false}
                    icon="checkmark"
                    disabled={busy}
                    onPress={() => setSheet({ mode: 'approve', member: m })}
                  />
                  <Button
                    title="Reject"
                    size="sm"
                    fullWidth={false}
                    variant="dangerOutline"
                    disabled={busy}
                    onPress={() => confirmReject(m)}
                  />
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="checkmark-done-outline" title="No pending requests" />
          )}

          <SectionTitle>{`Members (${memberList.length})`}</SectionTitle>
          {memberList.length > 0 ? (
            memberList.map((m) => {
              const role = ROLE_META[m.role];
              const flat = m.flat_residents?.[0]?.flat ?? null;
              const disabled = m.status === 'disabled';
              return (
                <Card key={m.id} style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text variant="bodyStrong" style={styles.name} numberOfLines={1}>
                      {m.name}
                    </Text>
                    <View style={styles.badges}>
                      <Badge label={role.label} tone={role.tone} />
                      {disabled ? <Badge label="Disabled" tone="danger" /> : null}
                    </View>
                  </View>
                  <Text variant="small" color={colors.textMuted}>
                    {m.role === 'resident' ? flatLabel(flat) : m.email}
                  </Text>
                  <View style={styles.actions}>
                    {m.role === 'resident' ? (
                      <Button
                        title={flat ? 'Change flat' : 'Assign flat'}
                        size="sm"
                        fullWidth={false}
                        variant="outline"
                        icon="home-outline"
                        disabled={busy}
                        onPress={() => setSheet({ mode: 'assign', member: m })}
                      />
                    ) : null}
                    <Button
                      title={disabled ? 'Enable' : 'Disable'}
                      size="sm"
                      fullWidth={false}
                      variant="secondary"
                      disabled={busy}
                      onPress={() =>
                        setStatus.mutate(
                          { id: m.id, status: disabled ? 'active' : 'disabled' },
                          { onError }
                        )
                      }
                    />
                    <Button
                      title="Delete"
                      size="sm"
                      fullWidth={false}
                      variant="dangerOutline"
                      disabled={busy}
                      onPress={() => confirmDelete(m)}
                    />
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState icon="people-outline" title="No members yet" />
          )}
        </View>
      )}

      <FlatPickerSheet
        visible={sheet !== null}
        title={sheet?.mode === 'approve' ? 'Assign a flat to approve' : 'Choose a flat'}
        selectedId={sheet?.member.flat_residents?.[0]?.flat?.id ?? null}
        onClose={() => setSheet(null)}
        onSelect={onPickFlat}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
