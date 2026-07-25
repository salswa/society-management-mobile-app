import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ApiError } from '@/api/client';
import { useAmenity, useAmenityAvailability, useCreateBooking, useMyProfile } from '@/query/hooks';
import { Badge, Card, ErrorState, Loading, Screen, Text, TopBar } from '@/components';
import { bookedCount, dayChipLabel, generateSlots, upcomingDays } from '@/lib/slots';
import { colors, radius, spacing } from '@/theme/tokens';

const DAYS = 7;

function dayBounds(dateStr: string) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return {
    from: new Date(y, mo - 1, d, 0, 0, 0).toISOString(),
    to: new Date(y, mo - 1, d + 1, 0, 0, 0).toISOString(),
  };
}

const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function BookAmenity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const amenity = useAmenity(id);
  const me = useMyProfile();
  const createBooking = useCreateBooking();

  const days = useMemo(() => upcomingDays(DAYS), []);
  const [day, setDay] = useState(days[0]);
  const { from, to } = dayBounds(day);
  const availability = useAmenityAvailability(id, from, to);

  if (amenity.isLoading || !amenity.data) {
    return amenity.isError ? <ErrorState onRetry={amenity.refetch} /> : <Loading />;
  }

  const a = amenity.data;
  const flatId = (me.data?.flats.find((f) => f.is_primary) ?? me.data?.flats[0])?.flat?.id;
  const slots = generateSlots(day, a);
  const bookings = availability.data ?? [];
  const now = new Date();

  const book = (start: Date, end: Date) => {
    Alert.alert('Confirm booking', `${a.name} · ${fmt(start)}–${fmt(end)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Book',
        onPress: () =>
          createBooking.mutate(
            { amenity_id: id, start_time: start.toISOString(), end_time: end.toISOString(), flat_id: flatId },
            {
              onError: (e) =>
                Alert.alert('Booking failed', e instanceof ApiError ? e.message : 'Please try again.'),
            }
          ),
      },
    ]);
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title={a.name} />}>
      <Text variant="small" color={colors.textMuted}>
        {a.open_time.slice(0, 5)}–{a.close_time.slice(0, 5)} · {a.slot_minutes}-min slots · capacity {a.capacity}
      </Text>
      {a.description ? (
        <Text variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
          {a.description}
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {days.map((d) => {
          const activeDay = d === day;
          return (
            <Pressable
              key={d}
              onPress={() => setDay(d)}
              style={[styles.dayChip, activeDay && styles.dayChipActive]}
            >
              <Text variant="label" color={activeDay ? colors.textInverse : colors.ink}>
                {dayChipLabel(d)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {availability.isLoading ? (
        <Loading />
      ) : (
        <View style={styles.slots}>
          {slots.map((s) => {
            const count = bookedCount(s, bookings);
            const full = count >= a.capacity;
            const past = s.start < now;
            const disabled = full || past || createBooking.isPending;
            return (
              <Pressable
                key={s.start.toISOString()}
                disabled={disabled}
                onPress={() => book(s.start, s.end)}
                style={({ pressed }) => [
                  styles.slot,
                  disabled && styles.slotDisabled,
                  pressed && !disabled && styles.pressed,
                ]}
              >
                <Text variant="bodyStrong" color={disabled ? colors.textMuted : colors.ink}>
                  {fmt(s.start)} – {fmt(s.end)}
                </Text>
                {past ? (
                  <Text variant="small" color={colors.textMuted}>
                    Past
                  </Text>
                ) : full ? (
                  <Badge label="Full" tone="neutral" />
                ) : (
                  <Badge label="Available" tone="success" />
                )}
              </Pressable>
            );
          })}
          {slots.length === 0 ? (
            <Text variant="body" color={colors.textMuted} center>
              No slots configured for this amenity.
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { gap: spacing.sm, paddingVertical: spacing.lg },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  dayChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  slots: { gap: spacing.sm },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  pressed: { opacity: 0.85 },
});
