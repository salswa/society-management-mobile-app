import { RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useVisitors } from '@/query/hooks';
import { Button, Card, Screen, SectionTitle, Text, VisitorCard } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export default function GuardHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data, isRefetching, refetch } = useVisitors({ limit: 100 });

  const pending = data?.filter((v) => v.status === 'pending') ?? [];
  const inside = data?.filter((v) => v.status === 'checked_in') ?? [];
  const approved = data?.filter((v) => v.status === 'approved') ?? [];

  return (
    <Screen
      scroll
      tabbarSpace
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="small" color={colors.textMuted}>
              Gate console
            </Text>
            <Text variant="h1">{profile?.name?.split(' ')[0] ?? 'Guard'}</Text>
          </View>
          <View style={styles.rolePill}>
            <Ionicons name="shield-outline" size={12} color={colors.ink} />
            <Text variant="label">Security Guard</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="Pending" value={pending.length} tone={colors.warning} icon="hourglass-outline" />
          <Stat label="Inside" value={inside.length} tone={colors.info} icon="enter-outline" />
          <Stat label="To arrive" value={approved.length} tone={colors.success} icon="checkmark-outline" />
        </View>

        <Button title="Register a visitor" onPress={() => router.push('/(guard)/register')} />

        <SectionTitle action="See all" onAction={() => router.push('/(guard)/approvals')}>
          Waiting for approval
        </SectionTitle>

        {pending.length > 0 ? (
          <View style={styles.list}>
            {pending.slice(0, 5).map((v) => (
              <VisitorCard
                key={v.id}
                visitor={v}
                onPress={() => router.push(`/(guard)/visitor/${v.id}`)}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={26} color={colors.success} />
            <Text variant="bodyStrong">All clear</Text>
            <Text variant="small" color={colors.textMuted}>
              No visitors are waiting for approval.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card style={styles.stat}>
      <Ionicons name={icon} size={20} color={tone} />
      <Text variant="h2">{value}</Text>
      <Text variant="small" color={colors.textMuted}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  list: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
});
