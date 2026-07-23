import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { Button, Input, Screen, Text } from '@/components';
import { colors, spacing } from '@/theme/tokens';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter your name, email, and a password of at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
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
            Register as a resident. An admin will link you to your flat.
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
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91…"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            placeholder="At least 6 characters"
          />

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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
