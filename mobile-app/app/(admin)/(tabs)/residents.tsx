import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import type { Flat, Member, Role } from "@/api/types";
import {
  useApproveResident,
  useAssignResidentFlat,
  useDeleteResident,
  useResidents,
  useSetResidentRole,
  useSetResidentStatus,
} from "@/query/hooks";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FlatPickerSheet,
  Loading,
  Screen,
  SegmentedControl,
  SheetModal,
  Text,
  TopBar,
  type Tone,
} from "@/components";
import { flatLabel } from "@/lib/format";
import { colors, radius, spacing } from "@/theme/tokens";

const ROLE_META: Record<Role, { label: string; tone: Tone }> = {
  resident: { label: "Resident", tone: "primary" },
  guard: { label: "Guard", tone: "info" },
  admin: { label: "Admin", tone: "success" },
};

// A non-resident is approved as one of these; a resident is always approved as a resident.
const NON_RESIDENT_ROLES: { label: string; value: Role }[] = [
  { label: "Guard", value: "guard" },
  { label: "Admin", value: "admin" },
];

type MemberTab = "pending" | "residents" | "non_residents";
const TABS: { label: string; value: MemberTab }[] = [
  { label: "Pending", value: "pending" },
  { label: "Residents", value: "residents" },
  { label: "Non-residents", value: "non_residents" },
];

export default function AdminResidents() {
  const { profile } = useAuth();
  const pending = useResidents({ status: "pending" });
  const members = useResidents({});

  const approve = useApproveResident();
  const assign = useAssignResidentFlat();
  const setStatus = useSetResidentStatus();
  const setRole = useSetResidentRole();
  const remove = useDeleteResident();
  const busy =
    approve.isPending ||
    assign.isPending ||
    setStatus.isPending ||
    setRole.isPending ||
    remove.isPending;

  // Pending review popup.
  const [target, setTarget] = useState<Member | null>(null);
  const [approveRole, setApproveRole] = useState<Role>("guard"); // for non-residents
  // Flat change/assign sheet (Members).
  const [assignFor, setAssignFor] = useState<Member | null>(null);
  const [tab, setTab] = useState<MemberTab>("pending");
  // Member detail popup.
  const [detailTarget, setDetailTarget] = useState<Member | null>(null);

  const onError = (e: unknown) =>
    Alert.alert(
      "Action failed",
      e instanceof ApiError ? e.message : "Please try again.",
    );
  const closeDetail = () => setDetailTarget(null);

  const openApprove = (m: Member) => {
    setApproveRole("guard");
    setTarget(m);
  };

  const confirmApprove = () => {
    if (!target) return;
    // Residents keep the flat they chose at registration; the admin sets a non-resident's role.
    const role: Role =
      target.user_type === "resident" ? "resident" : approveRole;
    approve.mutate(
      { id: target.id, input: { role } },
      { onSuccess: () => setTarget(null), onError },
    );
  };

  const onAssignFlat = (flat: Flat) => {
    if (!assignFor) return;
    const id = assignFor.id;
    setAssignFor(null);
    assign.mutate({ id, flatId: flat.id }, { onError });
  };

  const confirmMakeAdmin = (m: Member) =>
    Alert.alert("Make admin", `Give ${m.name} admin access?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Make admin",
        onPress: () =>
          setRole.mutate(
            { id: m.id, role: "admin" },
            { onError, onSuccess: closeDetail },
          ),
      },
    ]);

  const confirmReject = (m: Member) =>
    Alert.alert("Reject request", `Reject and delete ${m.name}'s sign-up?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          remove.mutate(m.id, { onError, onSuccess: () => setTarget(null) }),
      },
    ]);

  const confirmDelete = (m: Member) =>
    Alert.alert(
      "Delete member",
      `Permanently delete ${m.name}? This removes their account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(m.id, { onError, onSuccess: closeDetail }),
        },
      ],
    );

  const isLoading = pending.isLoading || members.isLoading;
  const isError = pending.isError || members.isError;

  const pendingList = pending.data ?? [];
  // Includes the admin themselves (shown with a "Me" badge; self-destructive actions off).
  const memberList = (members.data ?? []).filter((m) => m.status !== "pending");

  const residentList = memberList.filter((m) => m.user_type === "resident");
  const nonResidentList = memberList.filter(
    (m) => m.user_type === "non_resident",
  );

  const renderPending = (m: Member) => {
    const reserved = m.flat_residents?.[0]?.flat ?? null;
    const typeLine =
      m.user_type === "resident"
        ? reserved
          ? `Resident · wants ${flatLabel(reserved)}`
          : "Resident · no flat yet"
        : "Non-resident";
    return (
      <Card key={m.id} style={styles.memberCard} onPress={() => openApprove(m)}>
        <View style={styles.memberInfo}>
          <View style={styles.rowTop}>
            <Text variant="bodyStrong" style={styles.name} numberOfLines={1}>
              {m.name}
            </Text>
            <Badge label="Pending" tone="warning" />
          </View>
          <Text variant="small" color={colors.textMuted} numberOfLines={1}>
            {typeLine}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    );
  };

  const renderMember = (m: Member) => {
    const role = ROLE_META[m.role];
    const flat = m.flat_residents?.[0]?.flat ?? null;
    const disabled = m.status === "disabled";
    const isResident = m.user_type === "resident";
    const isMe = m.id === profile?.id;
    return (
      <Card
        key={m.id}
        style={styles.memberCard}
        onPress={() => setDetailTarget(m)}
      >
        <View style={styles.memberInfo}>
          <View style={styles.rowTop}>
            <Text variant="bodyStrong" style={styles.name} numberOfLines={1}>
              {m.name}
            </Text>
            <View style={styles.badges}>
              {isMe ? <Badge label="Me" tone="primary" /> : null}
              <Badge label={role.label} tone={role.tone} />
              {disabled ? <Badge label="Disabled" tone="danger" /> : null}
            </View>
          </View>
          <Text variant="small" color={colors.textMuted} numberOfLines={1}>
            {isResident ? flatLabel(flat) : m.email}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    );
  };

  return (
    <Screen
      scroll
      tabbarSpace
      header={<TopBar title="Members" />}
      refreshControl={
        <RefreshControl
          refreshing={pending.isRefetching || members.isRefetching}
          onRefresh={() => {
            pending.refetch();
            members.refetch();
          }}
        />
      }
    >
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState
          onRetry={() => {
            pending.refetch();
            members.refetch();
          }}
        />
      ) : (
        <View style={styles.container}>
          <SegmentedControl options={TABS} value={tab} onChange={setTab} />

          {tab === "pending" ? (
            pendingList.length > 0 ? (
              pendingList.map(renderPending)
            ) : (
              <EmptyState
                icon="checkmark-done-outline"
                title="No pending requests"
              />
            )
          ) : tab === "residents" ? (
            residentList.length > 0 ? (
              residentList.map(renderMember)
            ) : (
              <EmptyState icon="people-outline" title="No residents yet" />
            )
          ) : nonResidentList.length > 0 ? (
            nonResidentList.map(renderMember)
          ) : (
            <EmptyState icon="briefcase-outline" title="No non-residents yet" />
          )}
        </View>
      )}

      {/* Pending request: read-only registration details, then approve or reject. */}
      <SheetModal
        visible={target !== null}
        title={target?.name ?? "Pending request"}
        onClose={() => setTarget(null)}
      >
        {target ? (
          <>
            <View style={styles.detailRows}>
              <DetailRow
                label="Type"
                value={
                  target.user_type === "resident" ? "Resident" : "Non-resident"
                }
              />
              <DetailRow label="Email" value={target.email} />
              {target.phone ? (
                <DetailRow label="Phone" value={target.phone} />
              ) : null}
              {target.user_type === "resident" ? (
                <DetailRow
                  label="Flat"
                  value={
                    target.flat_residents?.[0]?.flat
                      ? flatLabel(target.flat_residents[0].flat)
                      : "—"
                  }
                />
              ) : null}
            </View>

            {target.user_type === "non_resident" ? (
              <View style={styles.field}>
                <Text variant="label" color={colors.textMuted}>
                  APPROVE AS
                </Text>
                <View style={styles.chips}>
                  {NON_RESIDENT_ROLES.map((r) => {
                    const active = approveRole === r.value;
                    return (
                      <Pressable
                        key={r.value}
                        onPress={() => setApproveRole(r.value)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text
                          variant="small"
                          color={active ? colors.textInverse : colors.ink}
                        >
                          {r.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.detailActions}>
              <Button
                title="Approve"
                icon="checkmark"
                loading={approve.isPending}
                disabled={busy}
                onPress={confirmApprove}
              />
              <Button
                title="Reject"
                variant="dangerOutline"
                disabled={busy}
                onPress={() => confirmReject(target)}
              />
            </View>
          </>
        ) : null}
      </SheetModal>

      {/* Members: change/assign a flat. */}
      <FlatPickerSheet
        visible={assignFor !== null}
        title="Choose a flat"
        selectedId={assignFor?.flat_residents?.[0]?.flat?.id ?? null}
        assigneeId={assignFor?.id}
        onClose={() => setAssignFor(null)}
        onSelect={onAssignFlat}
      />

      {/* Member detail + actions. */}
      <SheetModal
        visible={detailTarget !== null}
        title={detailTarget?.name ?? "Member"}
        onClose={closeDetail}
      >
        {detailTarget ? (
          <MemberDetail
            m={detailTarget}
            isMe={detailTarget.id === profile?.id}
            busy={busy}
            onChangeFlat={() => {
              const m = detailTarget;
              closeDetail();
              setAssignFor(m);
            }}
            onMakeAdmin={() => confirmMakeAdmin(detailTarget)}
            onToggleStatus={() =>
              setStatus.mutate(
                {
                  id: detailTarget.id,
                  status:
                    detailTarget.status === "disabled" ? "active" : "disabled",
                },
                { onError, onSuccess: closeDetail },
              )
            }
            onDelete={() => confirmDelete(detailTarget)}
          />
        ) : null}
      </SheetModal>
    </Screen>
  );
}

function MemberDetail({
  m,
  isMe,
  busy,
  onChangeFlat,
  onMakeAdmin,
  onToggleStatus,
  onDelete,
}: {
  m: Member;
  isMe: boolean;
  busy: boolean;
  onChangeFlat: () => void;
  onMakeAdmin: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const isResident = m.user_type === "resident";
  const flat = m.flat_residents?.[0]?.flat ?? null;
  const disabled = m.status === "disabled";
  return (
    <>
      <View style={styles.detailRows}>
        <DetailRow label="Role" value={ROLE_META[m.role].label} />
        {/* <DetailRow
          label="Type"
          value={isResident ? "Resident" : "Non-resident"}
        /> */}
        <DetailRow label="Email" value={m.email} />
        {m.phone ? <DetailRow label="Phone" value={m.phone} /> : null}
        {isResident ? <DetailRow label="Flat" value={flatLabel(flat)} /> : null}
        <DetailRow label="Status" value={disabled ? "Disabled" : "Active"} />
      </View>
      <View style={styles.detailActions}>
        {/* {isResident ? (
          <Button
            title={flat ? 'Change flat' : 'Assign flat'}
            variant="outline"
            icon="home-outline"
            disabled={busy}
            onPress={onChangeFlat}
          />
        ) : null} */}
        {m.role === "resident" && !isMe ? (
          <Button
            title="Make admin"
            variant="secondary"
            icon="shield-checkmark-outline"
            disabled={busy}
            onPress={onMakeAdmin}
          />
        ) : null}
        <Button
          title={disabled ? "Enable" : "Disable"}
          variant="secondary"
          disabled={isMe || busy}
          onPress={onToggleStatus}
        />
        <Button
          title="Delete"
          variant="dangerOutline"
          disabled={isMe || busy}
          onPress={onDelete}
        />
        {isMe ? (
          <Text variant="small" color={colors.textMuted} center>
            You can't disable or delete your own account.
          </Text>
        ) : null}
      </View>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="small" color={colors.textMuted}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { gap: spacing.xs },
  memberCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  memberInfo: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: { flex: 1 },
  badges: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailRows: { gap: 0 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  detailValue: { flexShrink: 1, textAlign: "right" },
  detailActions: { gap: spacing.sm, marginTop: spacing.xs },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  field: { gap: spacing.sm },
  flatGroups: { gap: spacing.md },
  flatGroup: { gap: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
});
