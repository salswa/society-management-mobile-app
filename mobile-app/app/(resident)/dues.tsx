import { StyleSheet, View } from 'react-native';
import { useInvoices } from '@/query/hooks';
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, Text, TopBar } from '@/components';
import { flatLabel, formatMoney, formatPeriod } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function ResidentDues() {
  const { data, isLoading, isError, refetch } = useInvoices();

  const invoices = data ?? [];
  const pendingTotal = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Maintenance dues" />}>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <View style={styles.container}>
          <Card style={styles.summary}>
            <Text variant="label" color={colors.textMuted}>
              Total due
            </Text>
            <Text variant="h1">{formatMoney(pendingTotal)}</Text>
            <Text variant="small" color={colors.textMuted}>
              Pay at the society office — the admin marks it paid.
            </Text>
          </Card>

          {invoices.length > 0 ? (
            invoices.map((inv) => (
              <Card key={inv.id} style={styles.card}>
                <View style={styles.info}>
                  <Text variant="bodyStrong">{formatPeriod(inv.period)}</Text>
                  <Text variant="small" color={colors.textMuted}>
                    {flatLabel(inv.flat)}
                    {inv.due_date ? ` · due ${inv.due_date}` : ''}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text variant="bodyStrong">{formatMoney(inv.amount)}</Text>
                  <Badge
                    label={inv.status === 'paid' ? 'Paid' : 'Pending'}
                    tone={inv.status === 'paid' ? 'success' : 'warning'}
                  />
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="card-outline" title="No dues" message="You're all settled up." />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  summary: { gap: spacing.xs, marginBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  info: { gap: 2, flexShrink: 1 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
