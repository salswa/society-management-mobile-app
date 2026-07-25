import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { Button, Input, Screen, Text } from "@/components";
import { colors, radius, spacing } from "@/theme/tokens";

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    email: "admin@portl.app",
    password: "admin123",
    icon: "🛡️🏠",
  },
  {
    label: "Admin Kabir",
    email: "kabir@example.com",
    password: "kabir123",
    icon: "🛡️",
  },
  {
    label: "Guard",
    email: "guard@example.com",
    password: "guard123",
    icon: "👮",
  },
  { label: "Riya", email: "riya@example.com", password: "riya123", icon: "🏠" },
  { label: "Amit", email: "amit@example.com", password: "amit123", icon: "🏠" },
  {
    label: "Neha",
    email: "pending@example.com",
    password: "pending123",
    icon: "⏳",
  },
];

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async (em: string, pw: string) => {
    setError(null);
    if (!em.trim() || !pw) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(em.trim(), pw);
      router.replace("/");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Unable to sign in. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (em: string, pw: string) => {
    setError(null);
    setEmail(em);
    setPassword(pw);
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text variant="h1" color={colors.textInverse}>
              P
            </Text>
          </View>
          <Text variant="h1">Welcome to Portl</Text>
          <Text variant="body" color={colors.textMuted}>
            Your society, in one app.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            placeholder="••••••"
          />

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Sign in"
            loading={submitting}
            onPress={() => doLogin(email, password)}
          />

          <View style={styles.footer}>
            <Text variant="body" color={colors.textMuted}>
              New resident?{" "}
            </Text>
            <Link href="/(auth)/register" replace>
              <Text variant="bodyStrong" color={colors.primary}>
                Create an account
              </Text>
            </Link>
          </View>
        </View>

        <View style={styles.demoSection}>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text variant="label" color={colors.textMuted}>
              QUICK DEMO LOGIN
            </Text>
            <View style={styles.line} />
          </View>
          <View style={styles.demoRow}>
            {DEMO_ACCOUNTS.map((a) => (
              <Pressable
                key={a.label}
                disabled={submitting}
                onPress={() => useDemo(a.email, a.password)}
                style={({ pressed }) => [
                  styles.demoChip,
                  pressed && styles.demoChipPressed,
                ]}
              >
                <Text variant="h3">{a.icon}</Text>
                <Text variant="label" color={colors.text}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* <Text variant="small" color={colors.textMuted} center>
            Requires the backend seed (npm run seed).
          </Text> */}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  form: { gap: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  demoSection: { marginTop: spacing.xxl, gap: spacing.lg },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  demoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  demoChip: {
    flexBasis: "30%",
    flexGrow: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  demoChipPressed: { opacity: 0.7, borderColor: colors.primary },
});
