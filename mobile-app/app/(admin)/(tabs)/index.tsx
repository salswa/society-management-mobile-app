import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/auth/AuthContext";
import { useComplaints, useInvoices, useNotices, useResidents } from "@/query/hooks";
import { Card, Screen, Text, ViewModeSwitcher } from "@/components";
import { colors, fonts, radius, spacing } from "@/theme/tokens";

const QUICK_SERVICES: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}[] = [
  { label: "Post notice", icon: "megaphone-outline", href: "/(admin)/notices/new" },
  { label: "Members", icon: "people-outline", href: "/(admin)/residents" },
  { label: "Helpdesk", icon: "chatbubbles-outline", href: "/(admin)/helpdesk" },
  { label: "Maintenance", icon: "card-outline", href: "/(admin)/maintenance" },
  { label: "Polls", icon: "bar-chart-outline", href: "/(admin)/polls" },
  {
    label: "Amenities",
    icon: "tennisball-outline",
    href: "/(admin)/amenities",
  },
  { label: "Staff", icon: "construct-outline", href: "/(admin)/staff" },
];

export default function AdminHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const approvals = useResidents({ status: "pending" });
  const complaints = useComplaints({ scope: "all" });
  const invoices = useInvoices({ status: "pending" });

  const approvalsCount = approvals.data?.length ?? 0;
  const openComplaints =
    complaints.data?.filter((c) => c.status !== "resolved" && c.status !== "closed").length ?? 0;
  const pendingDues = invoices.data?.length ?? 0;

  const refreshing =
    approvals.isRefetching || complaints.isRefetching || invoices.isRefetching;
  const onRefresh = () => {
    approvals.refetch();
    complaints.refetch();
    invoices.refetch();
  };

  return (
    <Screen
      scroll
      tabbarSpace
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text variant="small" color={colors.textMuted}>
            Society admin
          </Text>
          <Text variant="h1">{profile?.name?.split(" ")[0] ?? "Admin"}</Text>
        </View>
        <ViewModeSwitcher />
      </View>

      <View style={styles.stats}>
        <Stat
          label="Approvals"
          value={approvalsCount}
          tone={colors.warning}
          icon="person-add-outline"
          onPress={() => router.push("/(admin)/residents")}
        />
        <Stat
          label="Complaints"
          value={openComplaints}
          tone={colors.info}
          icon="chatbubbles-outline"
          onPress={() => router.push("/(admin)/helpdesk")}
        />
        <Stat
          label="Dues"
          value={pendingDues}
          tone={colors.primary}
          icon="card-outline"
          onPress={() => router.push("/(admin)/maintenance")}
        />
      </View>

      <Text
        variant="label"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        QUICK SERVICES
      </Text>
      <View style={styles.grid}>
        {QUICK_SERVICES.map((s) => (
          <QuickAction
            key={s.label}
            label={s.label}
            icon={s.icon}
            onPress={() => router.push(s.href)}
          />
        ))}
      </View>
    </Screen>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
  onPress,
}: {
  label: string;
  value: number;
  tone: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Card style={styles.stat} onPress={onPress}>
      <Ionicons name={icon} size={20} color={tone} />
      <Text variant="h2">{value}</Text>
      <Text variant="small" color={colors.textMuted}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink },
  tilePressed: { opacity: 0.8 },
  block: { marginTop: spacing.lg, gap: spacing.xs },
});
