import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Button, Screen, Text } from '@/components';
import { colors, spacing } from '@/theme/tokens';

/** Shown to signed-in users who aren't active / linked to a society yet. */
export default function Pending() {
  const { status, profile, logout, refetchProfile } = useAuth();

  if (status === 'unauthenticated' || !profile) return <Redirect href="/(auth)/login" />;
  // Once the admin activates + links a flat, bounce back to the role router.
  if (profile.status === 'active' && profile.society_id) return <Redirect href="/" />;

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="hourglass-outline" size={40} color={colors.warning} />
        </View>
        <Text variant="h2" center>
          Awaiting approval
        </Text>
        <Text variant="body" color={colors.textMuted} center>
          Hi {profile?.name?.split(' ')[0] ?? 'there'}, your account is created. Your society
          admin needs to activate it and link you to your flat before you can continue.
        </Text>

        <View style={styles.actions}>
          <Button title="Check again" onPress={() => refetchProfile()} />
          <Button title="Sign out" variant="outline" onPress={() => logout()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xl },
});
