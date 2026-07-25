import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import type { ComplaintStatus } from '@/api/types';
import { useAddComment, useComplaint, useUpdateComplaint } from '@/query/hooks';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loading,
  Screen,
  SectionTitle,
  SegmentedControl,
  Text,
  TopBar,
} from '@/components';
import { complaintStatusMeta, formatRelativeTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const STATUS_OPTIONS: { label: string; value: ComplaintStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

export function ComplaintDetail({ id }: { id: string }) {
  const { profile, viewMode } = useAuth();
  const { data: complaint, isLoading, isError, refetch } = useComplaint(id);
  const update = useUpdateComplaint(id);
  const addComment = useAddComment(id);
  const [comment, setComment] = useState('');

  if (isLoading) return <Loading />;
  if (isError || !complaint) return <ErrorState onRetry={refetch} />;

  const canManage = profile?.role === 'admin' && viewMode === 'admin';
  const status = complaintStatusMeta(complaint.status);
  const comments = complaint.comments ?? [];

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const send = () => {
    const body = comment.trim();
    if (!body) return;
    addComment.mutate(body, { onSuccess: () => setComment(''), onError });
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Complaint" />}>
      <Card style={styles.hero}>
        <Text variant="h2" center>
          {complaint.title}
        </Text>
        <Badge label={status.label} tone={status.tone} style={styles.heroBadge} />
        <Text variant="small" color={colors.textMuted}>
          {complaint.category} · {complaint.priority} priority
        </Text>
      </Card>

      {complaint.description ? (
        <Card style={styles.block}>
          <Text variant="body">{complaint.description}</Text>
        </Card>
      ) : null}

      {canManage ? (
        <Card style={styles.block}>
          <Text variant="label" color={colors.textMuted}>
            Update status
          </Text>
          <SegmentedControl
            options={STATUS_OPTIONS}
            value={complaint.status}
            onChange={(value) => update.mutate({ status: value }, { onError })}
          />
        </Card>
      ) : null}

      <Card style={styles.block}>
        {complaint.raised_by_profile ? (
          <Row label="Raised by" value={complaint.raised_by_profile.name} />
        ) : null}
        {complaint.assignee ? <Row label="Assigned to" value={complaint.assignee.name} /> : null}
        <Row label="Raised" value={formatRelativeTime(complaint.created_at)} last />
      </Card>

      <SectionTitle>{`Comments (${comments.length})`}</SectionTitle>
      {comments.length > 0 ? (
        <View style={styles.comments}>
          {comments
            .slice()
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((c) => (
              <Card key={c.id} style={styles.comment}>
                <View style={styles.commentTop}>
                  <Text variant="bodyStrong">{c.author?.name ?? 'Someone'}</Text>
                  <Text variant="small" color={colors.textMuted}>
                    {formatRelativeTime(c.created_at)}
                  </Text>
                </View>
                <Text variant="body">{c.body}</Text>
              </Card>
            ))}
        </View>
      ) : (
        <Text variant="small" color={colors.textMuted} style={styles.noComments}>
          No comments yet.
        </Text>
      )}

      <View style={styles.addRow}>
        <View style={styles.addInput}>
          <Input value={comment} onChangeText={setComment} placeholder="Add a comment…" />
        </View>
        <Button
          title="Send"
          size="sm"
          fullWidth={false}
          loading={addComment.isPending}
          onPress={send}
        />
      </View>
    </Screen>
  );
}

function Row({
  label,
  value,
  last,
  hidden,
}: {
  label: string;
  value: string;
  last?: boolean;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text variant="small" color={colors.textMuted}>
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm },
  heroBadge: { alignSelf: 'center' },
  block: { marginTop: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  comments: { gap: spacing.sm },
  comment: { gap: 4, borderRadius: radius.md },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noComments: { marginTop: spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  addInput: { flex: 1 },
});
