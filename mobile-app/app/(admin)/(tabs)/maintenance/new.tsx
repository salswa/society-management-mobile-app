import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Flat } from '@/api/types';
import { ApiError } from '@/api/client';
import { useCreateInvoice } from '@/query/hooks';
import { Button, Card, FlatPickerSheet, Input, Screen, Text, TopBar } from '@/components';
import { flatLabel } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function NewInvoice() {
  const router = useRouter();
  const createInvoice = useCreateInvoice();

  const [flat, setFlat] = useState<Flat | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState('');
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    setError(null);
    if (!flat) return setError('Choose a flat.');
    if (!/^\d{4}-\d{2}$/.test(period)) return setError('Period must be YYYY-MM.');
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return setError('Due date must be YYYY-MM-DD.');

    createInvoice.mutate(
      { flat_id: flat.id, period, amount: amt, due_date: due.trim() || undefined },
      {
        onSuccess: () => router.back(),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : 'Could not create invoice. Try again.'),
      }
    );
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="New invoice" />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              FLAT
            </Text>
            <Card onPress={() => setSheet(true)}>
              <Text variant="bodyStrong" color={flat ? colors.ink : colors.textMuted}>
                {flat ? flatLabel(flat) : 'Choose a flat'}
              </Text>
            </Card>
          </View>

          <Input
            label="Period (YYYY-MM)"
            value={period}
            onChangeText={setPeriod}
            placeholder="2026-07"
            autoCapitalize="none"
          />
          <Input
            label="Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="2500"
          />
          <Input
            label="Due date (optional, YYYY-MM-DD)"
            value={due}
            onChangeText={setDue}
            placeholder="2026-07-10"
            autoCapitalize="none"
          />

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button title="Create invoice" loading={createInvoice.isPending} onPress={onSubmit} />
        </View>
      </KeyboardAvoidingView>

      <FlatPickerSheet
        visible={sheet}
        title="Choose a flat"
        disableOccupied={false}
        selectedId={flat?.id ?? null}
        onClose={() => setSheet(false)}
        onSelect={(f) => {
          setFlat(f);
          setSheet(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
  field: { gap: spacing.sm },
});
