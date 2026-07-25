import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { useMyProfile, useNotices, useVisitors } from "@/query/hooks";
import {
  Card,
  NoticeHero,
  Screen,
  SectionTitle,
  Text,
  ViewModeSwitcher,
  VisitorActionRow,
  VisitorCard,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme/tokens";

export default function ResidentHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const me = useMyProfile();
  const visitors = useVisitors({ limit: 20, mine: true });
  const notices = useNotices();

  const latestNotice = notices.data?.[0];
  const pending = visitors.data?.filter((v) => v.status === "pending") ?? [];
  const recent =
    visitors.data?.filter((v) => v.status !== "pending").slice(0, 4) ?? [];

  const refreshing =
    visitors.isRefetching || notices.isRefetching || me.isRefetching;
  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ["visitors"] });
    qc.invalidateQueries({ queryKey: ["notices"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <Screen
      scroll
      tabbarSpace
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="small" color={colors.textMuted}>
              Welcome back
            </Text>
            <Text variant="h1">
              {profile?.name?.split(" ")[0] ?? "Resident"}
            </Text>
          </View>
          {profile?.role === "admin" ? (
            <ViewModeSwitcher />
          ) : (
            <View style={styles.flatPill}>
              <Ionicons name="person-outline" size={12} color={colors.ink} />
              <Text variant="label">Resident</Text>
            </View>
          )}
        </View>

        {latestNotice ? (
          <NoticeHero
            title={latestNotice.title}
            publishedAt={latestNotice.published_at}
            badge={latestNotice.is_pinned ? "Pinned" : "Notice"}
            onPress={() =>
              router.push(`/(resident)/notices/${latestNotice.id}`)
            }
          />
        ) : null}

        {pending.length > 0 ? (
          <>
            <SectionTitle>{`Awaiting your approval (${pending.length})`}</SectionTitle>
            <View style={styles.list}>
              {pending.map((v) => (
                <VisitorActionRow
                  key={v.id}
                  visitor={v}
                  showFlat={false}
                  onPress={() => router.push(`/(resident)/visitors/${v.id}`)}
                />
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle>Quick services</SectionTitle>
        <View style={styles.grid}>
          <QuickAction
            label="Pre-Approve"
            onPress={() => router.push("/(resident)/pre-approve")}
          />
          <QuickAction
            label="Amenity"
            onPress={() => router.push("/(resident)/amenities")}
          />
          <QuickAction
            label="Helpdesk"
            onPress={() => router.push("/(resident)/helpdesk")}
          />
          <QuickAction
            label="Pay dues"
            onPress={() => router.push("/(resident)/dues")}
          />
          <QuickAction
            label="Polls"
            primary
            onPress={() => router.push("/(resident)/polls")}
          />
        </View>

        <SectionTitle
          action="See all"
          onAction={() => router.push("/(resident)/visitors")}
        >
          Recent visitors
        </SectionTitle>
        {recent.length > 0 ? (
          <View style={styles.list}>
            {recent.map((v) => (
              <VisitorCard
                key={v.id}
                visitor={v}
                showFlat={false}
                onPress={() => router.push(`/(resident)/visitors/${v.id}`)}
              />
            ))}
          </View>
        ) : (
          <Card>
            <Text variant="body" color={colors.textMuted} center>
              No recent visitors.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

function QuickAction({
  label,
  primary = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        primary ? styles.pillPrimary : styles.pillOutline,
        pressed && styles.pillPressed,
      ]}
    >
      <Text
        style={[
          styles.pillLabel,
          { color: primary ? colors.textInverse : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  list: { gap: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: {
    flexBasis: "48%",
    flexGrow: 1,
    height: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pillOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  pillPrimary: { backgroundColor: colors.primary },
  pillPressed: { opacity: 0.8 },
  pillLabel: { fontFamily: fonts.heading, fontSize: 14 },
});
