import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { VisitorType } from '@/api/types';
import { ApiError } from '@/api/client';
import { useCreateVisitor, useMyProfile } from '@/query/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ChoiceChips, Input, Loading, Screen, Text, TopBar } from '@/components';
import { flatLabel, visitorTypeMeta } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const TYPES: VisitorType[] = ['guest', 'delivery', 'cab', 'service'];
const TYPE_OPTIONS = TYPES.map((t) => ({
  label: visitorTypeMeta(t).label,
  value: t,
  icon: visitorTypeMeta(t).icon as keyof typeof Ionicons.glyphMap,
}));

export default function PreApproveGuest() {
  const router = useRouter();
  const me = useMyProfile();
  const createVisitor = useCreateVisitor();

  const flats = me.data?.flats ?? [];
  const defaultFlatId = useMemo(
    () => (flats.find((f) => f.is_primary) ?? flats[0])?.flat?.id,
    [flats]
  );

  const [flatId, setFlatId] = useState<string | undefined>(undefined);
  const [type, setType] = useState<VisitorType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedFlat = flatId ?? defaultFlatId;

  if (me.isLoading) return <Loading />;

  const onSubmit = () => {
    setError(null);
    if (!name.trim()) return setError('Enter the guest name.');
    if (!selectedFlat) return setError('No flat is linked to your account.');

    createVisitor.mutate(
      {
        flat_id: selectedFlat,
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Guest pre-approved', 'The gate can now let them in.');
          router.back();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : 'Could not pre-approve. Try again.'),
      }
    );
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Pre-approve guest" />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              VISITOR TYPE
            </Text>
            <ChoiceChips options={TYPE_OPTIONS} value={type} onChange={setType} />
          </View>

          <Input label="Guest name" value={name} onChangeText={setName} placeholder="e.g. Amit" />
          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91…"
          />
          <Input
            label="Purpose (optional)"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Family visit"
          />

          {flats.length > 1 ? (
            <View style={styles.field}>
              <Text variant="label" color={colors.textMuted}>
                FLAT
              </Text>
              {flats.map((f) => {
                const active = selectedFlat === f.flat?.id;
                return (
                  <Card
                    key={f.flat?.id}
                    onPress={() => setFlatId(f.flat?.id)}
                    style={active ? styles.flatActive : undefined}
                  >
                    <Text variant="bodyStrong">{flatLabel(f.flat)}</Text>
                  </Card>
                );
              })}
            </View>
          ) : null}

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Pre-approve guest"
            loading={createVisitor.isPending}
            onPress={onSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  flatActive: { borderColor: colors.primary },
});
