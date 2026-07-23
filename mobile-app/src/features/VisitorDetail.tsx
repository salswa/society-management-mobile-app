import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useVisitor, useVisitorAction } from '@/query/hooks';
import { Badge, Button, Card, ErrorState, Loading, Screen, Text, TopBar } from '@/components';
import { flatLabel, formatRelativeTime, visitorStatusMeta, visitorTypeMeta } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

/** Shared visitor detail + role-appropriate actions (resident/guard/admin). */
export function VisitorDetail({ id }: { id: string }) {
  const { profile, viewMode } = useAuth();
  const { data: visitor, isLoading, isError, refetch } = useVisitor(id);
  const action = useVisitorAction();

  if (isLoading) return <Loading />;
  if (isError || !visitor) return <ErrorState onRetry={refetch} />;

  const role = profile?.role;
  const status = visitorStatusMeta(visitor.status);
  const type = visitorTypeMeta(visitor.type);

  // An admin acts as a resident only while in resident view; in admin view the
  // detail is read-only — no approving or marking entry/exit for other residents.
  const actingAsResident = role === 'resident' || (role === 'admin' && viewMode === 'resident');
  const actingAsGuard = role === 'guard';

  const canDecide = actingAsResident && visitor.status === 'pending';
  const canCheckIn = actingAsGuard && visitor.status === 'approved';
  const canCheckOut = actingAsGuard && visitor.status === 'checked_in';

  const run = (act: 'approve' | 'reject' | 'checkIn' | 'checkOut') => {
    action.mutate(
      { id, action: act },
      {
        onError: (e) =>
          Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.'),
      }
    );
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Flat', value: flatLabel(visitor.flat) },
    ...(visitor.phone ? [{ label: 'Phone', value: visitor.phone }] : []),
    ...(visitor.purpose ? [{ label: 'Purpose', value: visitor.purpose }] : []),
    ...(visitor.vehicle_no ? [{ label: 'Vehicle', value: visitor.vehicle_no }] : []),
    ...(visitor.code ? [{ label: 'Pass code', value: visitor.code }] : []),
    { label: 'Requested', value: formatRelativeTime(visitor.created_at) },
    ...(visitor.entry_at ? [{ label: 'Entered', value: formatRelativeTime(visitor.entry_at) }] : []),
    ...(visitor.exit_at ? [{ label: 'Left', value: formatRelativeTime(visitor.exit_at) }] : []),
    ...(visitor.created_by_profile
      ? [{ label: 'Registered by', value: visitor.created_by_profile.name }]
      : []),
  ];

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Visitor" />}>
      <Card style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name={type.icon as never} size={28} color={colors.ink} />
        </View>
        <Text variant="h2" center>
          {visitor.name}
        </Text>
        <Text variant="body" color={colors.textMuted}>
          {type.label}
        </Text>
        <Badge label={status.label} tone={status.tone} style={styles.heroBadge} />
      </Card>

      <Card style={styles.details}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
            <Text variant="small" color={colors.textMuted}>
              {r.label}
            </Text>
            <Text variant="bodyStrong" style={styles.rowValue}>
              {r.value}
            </Text>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        {canDecide ? (
          <>
            <Button
              title="Approve"
              icon="checkmark"
              loading={action.isPending}
              onPress={() => run('approve')}
            />
            <Button
              title="Reject"
              variant="dangerOutline"
              loading={action.isPending}
              onPress={() => run('reject')}
            />
          </>
        ) : null}
        {canCheckIn ? (
          <Button
            title="Mark entry"
            icon="log-in-outline"
            loading={action.isPending}
            onPress={() => run('checkIn')}
          />
        ) : null}
        {canCheckOut ? (
          <Button
            title="Mark exit"
            variant="secondary"
            icon="log-out-outline"
            loading={action.isPending}
            onPress={() => run('checkOut')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm },
  heroBadge: { alignSelf: 'center' },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  details: { marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  actions: { marginTop: spacing.xl, gap: spacing.md },
});
