import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { publicApi } from '@/api/public';
import type { UserType } from '@/api/types';
import { Button, Input, Screen, Text } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('resident');
  const [towerId, setTowerId] = useState<string | null>(null);
  const [flatId, setFlatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const societiesQ = useQuery({
    queryKey: ['public', 'societies'],
    queryFn: () => publicApi.societies().then((r) => r.societies),
  });
  const societyId = societiesQ.data?.[0]?.id;

  const towersQ = useQuery({
    queryKey: ['public', 'towers', societyId],
    queryFn: () => publicApi.towers(societyId!).then((r) => r.towers),
    enabled: !!societyId && userType === 'resident',
  });

  const flatsQ = useQuery({
    queryKey: ['public', 'flats', towerId],
    queryFn: () => publicApi.flats(towerId!).then((r) => r.flats),
    enabled: !!towerId,
  });

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter your name, email, and a password of at least 6 characters.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    if (!societyId) {
      setError('Could not load your society. Please try again.');
      return;
    }
    if (userType === 'resident' && !flatId) {
      setError('Select your tower and flat.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        society_id: societyId,
        user_type: userType,
        flat_id: userType === 'resident' ? (flatId ?? undefined) : undefined,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to register. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text variant="h1">Create your account</Text>
          <Text variant="body" color={colors.textMuted}>
            An admin reviews and activates your account.
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Riya Sharma" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="10-digit number"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            placeholder="At least 6 characters"
          />

          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              I AM A
            </Text>
            <View style={styles.chips}>
              {([
                { label: 'Resident', value: 'resident' as UserType },
                { label: 'Non-resident', value: 'non_resident' as UserType },
              ]).map((o) => {
                const active = userType === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setUserType(o.value)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {userType === 'non_resident' ? (
              <Text variant="small" color={colors.textMuted}>
                The admin will assign your role (guard or admin) on approval.
              </Text>
            ) : null}
          </View>

          {userType === 'resident' ? (
            <>
              <View style={styles.field}>
                <Text variant="label" color={colors.textMuted}>
                  TOWER
                </Text>
                <View style={styles.chips}>
                  {(towersQ.data ?? []).map((t) => {
                    const active = towerId === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => {
                          setTowerId(t.id);
                          setFlatId(null);
                        }}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                          {t.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {towerId ? (
                <View style={styles.field}>
                  <Text variant="label" color={colors.textMuted}>
                    FLAT
                  </Text>
                  {(flatsQ.data ?? []).length > 0 ? (
                    <View style={styles.chips}>
                      {(flatsQ.data ?? []).map((f) => {
                        const active = flatId === f.id;
                        return (
                          <Pressable
                            key={f.id}
                            onPress={() => setFlatId((cur) => (cur === f.id ? null : f.id))}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                              {f.number}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text variant="small" color={colors.textMuted}>
                      No free flats in this tower — the admin can assign one later.
                    </Text>
                  )}
                </View>
              ) : null}
            </>
          ) : null}

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button title="Create account" loading={submitting} onPress={onSubmit} />

          <View style={styles.footer}>
            <Text variant="body" color={colors.textMuted}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" replace>
              <Text variant="bodyStrong" color={colors.primary}>
                Sign in
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginTop: spacing.xxl, marginBottom: spacing.xl },
  form: { gap: spacing.lg },
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
