import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { useMyProfile } from '@/query/hooks';
import { Badge, Button, Card, Screen, Text, ViewModeSwitcher, type Tone } from '@/components';
import { flatLabel } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const ROLE_LABEL: Record<string, { label: string; tone: Tone }> = {
  resident: { label: 'Resident', tone: 'primary' },
  guard: { label: 'Security Guard', tone: 'info' },
  admin: { label: 'Society Admin', tone: 'success' },
};

export function ProfileScreen() {
  const { profile, logout } = useAuth();
  const me = useMyProfile();
  if (!profile) return null;

  const role = ROLE_LABEL[profile.role] ?? { label: profile.role, tone: 'neutral' as Tone };
  const flats = me.data?.flats ?? [];
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Screen scroll tabbarSpace>
      <View style={styles.container}>
        <Text variant="h1">Profile</Text>

        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="h1" color={colors.textInverse}>
              {profile.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="h3">{profile.name}</Text>
          <Text variant="body" color={colors.textMuted}>
            {profile.email}
          </Text>
          <Badge label={role.label} tone={role.tone} style={styles.roleBadge} />
        </Card>

        <ViewModeSwitcher variant="row" />

        {profile.role === 'resident' || flats.length > 0 ? (
          <Card style={styles.section}>
            <Text variant="label" color={colors.textMuted}>
              My flats
            </Text>
            {flats.length > 0 ? (
              flats.map((f) => (
                <View key={f.flat?.id} style={styles.flatRow}>
                  <Text variant="bodyStrong">{flatLabel(f.flat)}</Text>
                  {f.is_primary ? <Badge label="Primary" tone="primary" /> : null}
                </View>
              ))
            ) : (
              <Text variant="body" color={colors.textMuted}>
                No flat assigned yet.
              </Text>
            )}
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text variant="label" color={colors.textMuted}>
            Account
          </Text>
          {profile.phone ? (
            <View style={styles.infoRow}>
              <Text variant="small" color={colors.textMuted}>
                Phone
              </Text>
              <Text variant="bodyStrong">{profile.phone}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text variant="small" color={colors.textMuted}>
              Member since
            </Text>
            <Text variant="bodyStrong">{memberSince}</Text>
          </View>
        </Card>

        <Button title="Sign out" variant="dangerOutline" onPress={() => logout()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  identity: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleBadge: { alignSelf: 'center', marginTop: spacing.xs },
  section: { gap: spacing.md },
  flatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
