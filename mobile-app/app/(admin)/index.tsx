import { RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useNotices, useVisitors } from '@/query/hooks';
import { Button, Card, Screen, Text, ViewModeSwitcher } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export default function AdminHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const visitors = useVisitors({ limit: 100 });
  const notices = useNotices();

  const data = visitors.data ?? [];
  const pending = data.filter((v) => v.status === 'pending').length;
  const inside = data.filter((v) => v.status === 'checked_in').length;
  const today = data.filter(
    (v) => new Date(v.created_at).toDateString() === new Date().toDateString()
  ).length;

  const refreshing = visitors.isRefetching || notices.isRefetching;
  const onRefresh = () => {
    visitors.refetch();
    notices.refetch();
  };

  return (
    <Screen scroll tabbarSpace refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text variant="small" color={colors.textMuted}>
            Society admin
          </Text>
          <Text variant="h1">{profile?.name?.split(' ')[0] ?? 'Admin'}</Text>
        </View>
        <ViewModeSwitcher />
      </View>

      <View style={styles.stats}>
        <Stat label="Pending" value={pending} tone={colors.warning} icon="hourglass-outline" />
        <Stat label="Inside now" value={inside} tone={colors.info} icon="business-outline" />
        <Stat label="Today" value={today} tone={colors.primary} icon="today-outline" />
      </View>

      <Card style={styles.block}>
        <Text variant="label" color={colors.textMuted}>
          NOTICE BOARD
        </Text>
        <Text variant="body" color={colors.textMuted}>
          {notices.data?.length ?? 0} active notice{(notices.data?.length ?? 0) === 1 ? '' : 's'}
        </Text>
        <Button
          title="Post a notice"
          variant="secondary"
          onPress={() => router.push('/(admin)/notices/new')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Card style={styles.block}>
        <Text variant="label" color={colors.textMuted}>
          MOVEMENT
        </Text>
        <Text variant="body" color={colors.textMuted}>
          Review the full society visitor log.
        </Text>
        <Button
          title="Open visitor log"
          variant="secondary"
          onPress={() => router.push('/(admin)/visitors')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, borderRadius: radius.lg },
  block: { marginTop: spacing.lg, gap: spacing.xs },
});
