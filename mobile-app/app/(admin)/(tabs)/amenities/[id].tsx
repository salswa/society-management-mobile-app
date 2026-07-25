import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAmenity, useAmenityBookings } from '@/query/hooks';
import { Card, EmptyState, ErrorState, Loading, Screen, Text, TopBar } from '@/components';
import { flatLabel, formatRelativeTime, formatTime } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function AmenityBookings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const amenity = useAmenity(id);
  const bookings = useAmenityBookings(id);

  return (
    <Screen scroll tabbarSpace header={<TopBar title={amenity.data?.name ?? 'Bookings'} />}>
      {bookings.isLoading ? (
        <Loading />
      ) : bookings.isError ? (
        <ErrorState onRetry={bookings.refetch} />
      ) : (
        <View style={styles.container}>
          <Text variant="small" color={colors.textMuted}>
            Upcoming bookings
          </Text>
          {(bookings.data ?? []).length > 0 ? (
            (bookings.data ?? []).map((b) => (
              <Card key={b.id} style={styles.card}>
                <Text variant="bodyStrong">
                  {formatRelativeTime(b.start_time)} → {formatTime(b.end_time)}
                </Text>
                <Text variant="small" color={colors.textMuted}>
                  {b.profile?.name ?? 'Resident'}
                  {b.flat ? ` · ${flatLabel(b.flat)}` : ''}
                </Text>
              </Card>
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No upcoming bookings"
              message="Reservations will appear here."
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: 2 },
});
