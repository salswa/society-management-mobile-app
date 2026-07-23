import { StyleSheet, View } from 'react-native';
import { useNotice } from '@/query/hooks';
import { Badge, ErrorState, Loading, Screen, Text, TopBar } from '@/components';
import { formatDateTime } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export function NoticeDetail({ id }: { id: string }) {
  const { data: notice, isLoading, isError, refetch } = useNotice(id);

  if (isLoading) return <Loading />;
  if (isError || !notice) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Notice" />}>
      <View style={styles.badgeRow}>
        <Badge label={notice.category} tone="primary" />
      </View>
      <Text variant="h1" style={styles.title}>
        {notice.title}
      </Text>
      <Text variant="small" color={colors.textMuted}>
        {formatDateTime(notice.published_at)}
        {notice.posted_by_profile ? ` · ${notice.posted_by_profile.name}` : ''}
      </Text>
      <Text variant="body" style={styles.body}>
        {notice.body}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', marginBottom: spacing.md },
  title: { marginBottom: spacing.xs },
  body: { marginTop: spacing.lg, lineHeight: 24 },
});
