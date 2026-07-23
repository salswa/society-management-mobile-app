import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatDateTime } from '@/lib/format';
import { Text } from './Text';

type Props = {
  title: string;
  publishedAt: string;
  badge?: string;
  onPress?: () => void;
};

/** Accent-purple hero card used to highlight a notice. */
export function NoticeHero({ title, publishedAt, badge = 'Notice', onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
      </View>
      <View style={styles.badge}>
        <Text variant="label" color={colors.textInverse} style={styles.badgeText}>
          {badge}
        </Text>
      </View>
      <Text variant="h3" color={colors.textInverse} style={styles.title} numberOfLines={3}>
        {title}
      </Text>
      <Text variant="small" color="rgba(255,255,255,0.85)" style={styles.date}>
        {formatDateTime(publishedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  arrow: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  badgeText: { fontSize: 10 },
  title: { fontSize: 20, lineHeight: 24 },
  date: { marginTop: spacing.sm },
});
