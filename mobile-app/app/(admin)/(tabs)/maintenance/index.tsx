import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { InvoiceStatus } from '@/api/types';
import { ApiError } from '@/api/client';
import { useInvoices, useMarkInvoicePaid } from '@/query/hooks';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  SegmentedControl,
  Text,
  TopBar,
} from '@/components';
import { flatLabel, formatMoney, formatPeriod } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const FILTERS: { label: string; value: InvoiceStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
];

export default function AdminMaintenance() {
  const router = useRouter();
  const [status, setStatus] = useState<InvoiceStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useInvoices({ status });
  const markPaid = useMarkInvoicePaid();

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const confirmPaid = (id: string, label: string) =>
    Alert.alert('Mark as paid', `Record payment for ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark paid', onPress: () => markPaid.mutate(id, { onError }) },
    ]);

  const invoices = data ?? [];

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Maintenance" />}>
      <View style={styles.container}>
        <Button
          title="New invoice"
          icon="add"
          onPress={() => router.push('/(admin)/maintenance/new')}
        />
        <SegmentedControl options={FILTERS} value={status} onChange={setStatus} />

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : invoices.length > 0 ? (
          invoices.map((inv) => (
            <Card key={inv.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.info}>
                  <Text variant="bodyStrong">
                    {flatLabel(inv.flat)} · {formatPeriod(inv.period)}
                  </Text>
                  <Text variant="small" color={colors.textMuted}>
                    {formatMoney(inv.amount)}
                    {inv.due_date ? ` · due ${inv.due_date}` : ''}
                  </Text>
                </View>
                <Badge
                  label={inv.status === 'paid' ? 'Paid' : 'Pending'}
                  tone={inv.status === 'paid' ? 'success' : 'warning'}
                />
              </View>
              {inv.status === 'pending' ? (
                <Button
                  title="Mark paid"
                  size="sm"
                  fullWidth={false}
                  variant="outline"
                  icon="checkmark"
                  disabled={markPaid.isPending}
                  onPress={() => confirmPaid(inv.id, `${flatLabel(inv.flat)} ${formatPeriod(inv.period)}`)}
                />
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState icon="card-outline" title="No invoices" message="Create the first dues invoice." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  info: { gap: 2, flexShrink: 1 },
});
