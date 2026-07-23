import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useMyProfile } from '@/query/hooks';
import { Card, Loading, Screen, Text } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';
import type { ViewMode } from '@/auth/AuthContext';

/** Post-login chooser: an admin who also has a flat picks which experience to enter. */
export default function ChooseMode() {
  const router = useRouter();
  const { profile, setViewMode } = useAuth();
  const me = useMyProfile();

  const flats = me.data?.flats ?? [];
  const hasFlat = flats.length > 0;

  const pick = (mode: ViewMode) => {
    setViewMode(mode);
    router.replace(mode === 'resident' ? '/(resident)' : '/(admin)');
  };

  // An admin with no flat has nothing to choose — go straight to the admin experience.
  useEffect(() => {
    if (me.isSuccess && !hasFlat) pick('admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.isSuccess, hasFlat]);

  // Only admins reach this screen; anyone else is routed by their layout.
  if (profile && profile.role !== 'admin') return <Redirect href="/" />;
  if (me.isLoading || !hasFlat) return <Loading />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.intro}>
          <Text variant="small" color={colors.textMuted}>
            Hello {profile?.name?.split(' ')[0] ?? 'there'}
          </Text>
          <Text variant="h1">How do you want to continue?</Text>
          <Text variant="body" color={colors.textMuted}>
            You can switch anytime from the home header or your profile.
          </Text>
        </View>

        <Card onPress={() => pick('admin')} style={styles.option}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.optionBody}>
            <Text variant="h3">Society admin</Text>
            <Text variant="small" color={colors.textMuted}>
              Oversee the visitor log and post notices.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>

        <Card onPress={() => pick('resident')} style={styles.option}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="home-outline" size={24} color={colors.ink} />
          </View>
          <View style={styles.optionBody}>
            <Text variant="h3">Resident</Text>
            <Text variant="small" color={colors.textMuted}>
              Pre-approve guests and manage your flat's visitors.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingTop: spacing.xl },
  intro: { gap: spacing.xs, marginBottom: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionBody: { flex: 1, gap: 2 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
