import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useMyProfile } from '@/query/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { Card } from './Card';
import { Text } from './Text';

type Props = { variant?: 'pill' | 'row' };

/**
 * Lets an admin who also has a flat flip between the Admin and Resident
 * experiences. Renders nothing for anyone else.
 *  - `pill`: compact control for a screen header
 *  - `row`:  full-width row for the profile screen
 */
export function ViewModeSwitcher({ variant = 'pill' }: Props) {
  const router = useRouter();
  const { profile, viewMode, setViewMode } = useAuth();
  const me = useMyProfile();

  const hasFlat = (me.data?.flats?.length ?? 0) > 0;
  if (!profile || profile.role !== 'admin') return null;

  // Admin without a flat can't switch — show a static Admin badge in the header
  // (residents/guards get their own pill elsewhere).
  if (!hasFlat) {
    if (variant === 'row') return null;
    return (
      <View style={styles.pill}>
        <Ionicons name="shield-checkmark-outline" size={13} color={colors.ink} />
        <Text variant="label">Admin</Text>
      </View>
    );
  }

  const current: 'admin' | 'resident' = viewMode === 'resident' ? 'resident' : 'admin';
  const target = current === 'resident' ? 'admin' : 'resident';
  const targetLabel = target === 'admin' ? 'Admin' : 'Resident';
  // Icon reflects where the tap takes you: home for the resident experience.
  const targetIcon = target === 'resident' ? 'home-outline' : 'shield-checkmark-outline';

  const switchTo = () => {
    setViewMode(target);
    router.replace(target === 'resident' ? '/(resident)' : '/(admin)');
  };

  if (variant === 'row') {
    return (
      <Card onPress={switchTo} style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name={targetIcon} size={18} color={colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <Text variant="bodyStrong">Switch to {targetLabel} view</Text>
          <Text variant="small" color={colors.textMuted}>
            {target === 'resident' ? 'Go to your resident home' : 'Go to the admin dashboard'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    );
  }

  return (
    <Pressable
      onPress={switchTo}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${targetLabel} view`}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Ionicons name="swap-horizontal" size={14} color={colors.ink} />
      <Ionicons name={targetIcon} size={13} color={colors.ink} />
      <Text variant="label">{targetLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
});
