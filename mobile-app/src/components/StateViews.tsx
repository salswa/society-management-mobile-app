import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/tokens';
import { Text } from './Text';
import { Button } from './Button';

/** Centered spinner for initial loads. */
export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <Text variant="small" color={colors.textMuted} style={styles.gap}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** Friendly empty state for lists with no data. */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <Text variant="h3" style={styles.gap}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color={colors.textMuted} center>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

/** Error state with an optional retry action. */
export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.danger} />
      <Text variant="body" color={colors.textMuted} center style={styles.gap}>
        {message}
      </Text>
      {onRetry ? (
        <Button title="Try again" variant="secondary" fullWidth={false} onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  gap: { marginTop: spacing.sm },
});
