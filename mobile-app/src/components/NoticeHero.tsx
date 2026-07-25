import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme/tokens";
import { formatDateTime } from "@/lib/format";
import { Text } from "./Text";

type Props = {
  title: string;
  body?: string;
  publishedAt: string;
  onPress?: () => void;
};

/** Accent-purple hero card used to highlight a notice. */
export function NoticeHero({ title, body, publishedAt, onPress }: Props) {
  return (
    <Pressable
      // onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <Text
          variant="label"
          color={colors.textInverse}
          style={styles.badgeText}
        >
          Latest Notice
        </Text>
      </View>
      <Text
        variant="h3"
        color={colors.textInverse}
        style={styles.title}
        numberOfLines={2}
      >
        {title}
      </Text>
      {body ? (
        <Text
          variant="body"
          color="rgba(255,255,255,0.9)"
          style={styles.body}
          numberOfLines={1}
        >
          {body}
        </Text>
      ) : null}
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
    overflow: "hidden",
  },
  pressed: { opacity: 0.92 },
  title: { fontSize: 20, lineHeight: 24 },
  body: { fontSize: 13, marginTop: spacing.sm },
  date: { marginTop: spacing.sm },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  badgeText: { fontSize: 10 },
});
