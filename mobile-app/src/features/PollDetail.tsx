import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useClosePoll, usePoll, usePollResults, useVotePoll } from '@/query/hooks';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Loading,
  Screen,
  SectionTitle,
  Text,
  TopBar,
} from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export function PollDetail({ id }: { id: string }) {
  const { profile, viewMode } = useAuth();
  const { data, isLoading, isError, refetch } = usePoll(id);
  const results = usePollResults(id);
  const vote = useVotePoll(id);
  const close = useClosePoll(id);

  const [selected, setSelected] = useState<string[]>([]);
  const myVotes = data?.my_votes;
  useEffect(() => {
    if (myVotes) setSelected(myVotes);
  }, [myVotes]);

  if (isLoading || !data) return isError ? <ErrorState onRetry={refetch} /> : <Loading />;

  const poll = data.poll;
  const hasVoted = (data.my_votes ?? []).length > 0;
  const ended =
    poll.status === 'closed' || (!!poll.closes_at && new Date(poll.closes_at) <= new Date());
  const canManage = profile?.role === 'admin' && viewMode === 'admin';
  const options = (poll.options ?? []).slice().sort((a, b) => a.position - b.position);

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const toggle = (optionId: string) => {
    if (poll.is_multi) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const submit = () => {
    if (selected.length === 0) return;
    vote.mutate(selected, { onError });
  };

  const confirmClose = () =>
    Alert.alert('Close poll', 'No more votes will be accepted. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close poll', style: 'destructive', onPress: () => close.mutate(undefined, { onError }) },
    ]);

  const total = results.data?.total ?? 0;
  const countFor = (optionId: string) =>
    results.data?.options.find((o) => o.id === optionId)?.votes ?? 0;

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Poll" />}>
      <Card style={styles.hero}>
        <Badge label={ended ? 'Closed' : 'Open'} tone={ended ? 'neutral' : 'info'} style={styles.heroBadge} />
        <Text variant="h2" center>
          {poll.question}
        </Text>
        {poll.description ? (
          <Text variant="body" color={colors.textMuted} center>
            {poll.description}
          </Text>
        ) : null}
        {poll.is_multi ? (
          <Text variant="small" color={colors.textMuted}>
            Choose one or more
          </Text>
        ) : null}
      </Card>

      {!ended ? (
        <View style={styles.section}>
          <SectionTitle>Cast your vote</SectionTitle>
          {options.map((o) => {
            const sel = selected.includes(o.id);
            const icon = poll.is_multi
              ? sel
                ? 'checkbox'
                : 'square-outline'
              : sel
                ? 'radio-button-on'
                : 'radio-button-off';
            return (
              <Pressable
                key={o.id}
                onPress={() => toggle(o.id)}
                style={({ pressed }) => [styles.option, sel && styles.optionSel, pressed && styles.pressed]}
              >
                <Ionicons name={icon} size={22} color={sel ? colors.primary : colors.textMuted} />
                <Text variant="bodyStrong" style={styles.optionText}>
                  {o.text}
                </Text>
              </Pressable>
            );
          })}
          <Button
            title={hasVoted ? 'Update vote' : 'Submit vote'}
            loading={vote.isPending}
            disabled={selected.length === 0}
            onPress={submit}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : null}

      {hasVoted || ended ? (
        <View style={styles.section}>
          <SectionTitle>{`Results · ${total} vote${total === 1 ? '' : 's'}`}</SectionTitle>
          {options.map((o) => {
            const votes = countFor(o.id);
            const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
            const mine = (data.my_votes ?? []).includes(o.id);
            return (
              <View key={o.id} style={styles.resultRow}>
                <View style={styles.resultTop}>
                  <Text variant="bodyStrong" color={mine ? colors.primary : colors.ink}>
                    {o.text}
                    {mine ? '  ✓' : ''}
                  </Text>
                  <Text variant="small" color={colors.textMuted}>
                    {votes} · {pct}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` }, mine && styles.fillMine]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {canManage && !ended ? (
        <Button
          title="Close poll"
          variant="dangerOutline"
          loading={close.isPending}
          onPress={confirmClose}
          style={{ marginTop: spacing.xl }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm },
  heroBadge: { alignSelf: 'center' },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { flex: 1 },
  pressed: { opacity: 0.85 },
  resultRow: { gap: 6, paddingVertical: spacing.xs },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  fillMine: { backgroundColor: colors.primary },
});
