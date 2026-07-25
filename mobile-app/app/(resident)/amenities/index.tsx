import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { useAmenities, useCancelBooking, useMyBookings } from '@/query/hooks';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  SegmentedControl,
  Text,
} from '@/components';
import { formatRelativeTime, formatTime } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const TABS: { label: string; value: 'book' | 'mine' }[] = [
  { label: 'Book', value: 'book' },
  { label: 'My bookings', value: 'mine' },
];

export default function ResidentAmenities() {
  const router = useRouter();
  const [tab, setTab] = useState<'book' | 'mine'>('book');
  const amenities = useAmenities();
  const bookings = useMyBookings();
  const cancel = useCancelBooking();

  const onError = (e: unknown) =>
    Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');

  const confirmCancel = (id: string) =>
    Alert.alert('Cancel booking', 'Release this slot?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => cancel.mutate(id, { onError }) },
    ]);

  const active = (amenities.data ?? []).filter((a) => a.is_active);
  const myBookings = bookings.data ?? [];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1">Amenities</Text>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={amenities.isRefetching || bookings.isRefetching}
            onRefresh={() => (tab === 'book' ? amenities.refetch() : bookings.refetch())}
          />
        }
      >
        {tab === 'book' ? (
          amenities.isLoading ? (
            <Loading />
          ) : amenities.isError ? (
            <ErrorState onRetry={amenities.refetch} />
          ) : active.length > 0 ? (
            active.map((a) => (
              <Card key={a.id} style={styles.card} onPress={() => router.push(`/(resident)/amenities/${a.id}`)}>
                <View style={styles.rowTop}>
                  <Text variant="bodyStrong">{a.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
                <Text variant="small" color={colors.textMuted}>
                  {a.open_time.slice(0, 5)}–{a.close_time.slice(0, 5)} · {a.slot_minutes}-min slots · cap {a.capacity}
                </Text>
              </Card>
            ))
          ) : (
            <EmptyState icon="tennisball-outline" title="No amenities" message="None available to book yet." />
          )
        ) : bookings.isLoading ? (
          <Loading />
        ) : bookings.isError ? (
          <ErrorState onRetry={bookings.refetch} />
        ) : myBookings.length > 0 ? (
          myBookings.map((b) => {
            const upcoming = b.status === 'booked' && new Date(b.start_time) > new Date();
            return (
              <Card key={b.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text variant="bodyStrong">{b.amenity?.name ?? 'Amenity'}</Text>
                  <Badge
                    label={b.status === 'cancelled' ? 'Cancelled' : 'Booked'}
                    tone={b.status === 'cancelled' ? 'neutral' : 'success'}
                  />
                </View>
                <Text variant="small" color={colors.textMuted}>
                  {formatRelativeTime(b.start_time)} → {formatTime(b.end_time)}
                </Text>
                {upcoming ? (
                  <Button
                    title="Cancel"
                    size="sm"
                    fullWidth={false}
                    variant="dangerOutline"
                    disabled={cancel.isPending}
                    onPress={() => confirmCancel(b.id)}
                    style={{ marginTop: spacing.xs }}
                  />
                ) : null}
              </Card>
            );
          })
        ) : (
          <EmptyState icon="calendar-outline" title="No bookings" message="Book an amenity to see it here." />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  back: { width: 30, height: 30, justifyContent: 'center', marginLeft: -4 },
  list: { padding: spacing.lg, paddingBottom: 24, gap: spacing.sm, flexGrow: 1 },
  card: { gap: spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
