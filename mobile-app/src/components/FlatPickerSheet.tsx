import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFlats } from '@/query/hooks';
import type { Flat } from '@/api/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { Badge } from './Badge';
import { Loading, ErrorState } from './StateViews';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title?: string;
  selectedId?: string | null;
  /** Profile being assigned; a flat this profile already occupies stays selectable. */
  assigneeId?: string;
  /** Grey out flats that already have a resident (default true). Set false to allow any flat. */
  disableOccupied?: boolean;
  onClose: () => void;
  onSelect: (flat: Flat) => void;
};

/** Bottom sheet listing the society's flats (grouped by tower) for assignment. */
export function FlatPickerSheet({
  visible,
  title = 'Choose a flat',
  selectedId,
  assigneeId,
  disableOccupied = true,
  onClose,
  onSelect,
}: Props) {
  const { data, isLoading, isError, refetch } = useFlats();

  const groups = useMemo(() => {
    const byTower = new Map<string, Flat[]>();
    for (const f of data ?? []) {
      const tower = f.tower?.name ?? 'Other';
      const list = byTower.get(tower) ?? [];
      list.push(f);
      byTower.set(tower, list);
    }
    return [...byTower.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text variant="h3">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.state}>
            <Loading />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <ErrorState onRetry={refetch} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {groups.map(([tower, flats]) => (
              <View key={tower} style={styles.group}>
                <Text variant="label" color={colors.textMuted}>
                  {tower}
                </Text>
                {flats.map((flat) => {
                  const active = flat.id === selectedId;
                  const occupant = flat.flat_residents?.[0]?.profile ?? null;
                  const takenByOther =
                    disableOccupied && !!occupant && occupant.id !== assigneeId;
                  return (
                    <Pressable
                      key={flat.id}
                      onPress={() => onSelect(flat)}
                      disabled={takenByOther}
                      style={({ pressed }) => [
                        styles.row,
                        active && styles.rowActive,
                        takenByOther && styles.rowDisabled,
                        pressed && !takenByOther && styles.pressed,
                      ]}
                    >
                      <View style={styles.rowInfo}>
                        <Text variant="bodyStrong" color={takenByOther ? colors.textMuted : colors.ink}>
                          {flat.number}
                        </Text>
                        {takenByOther ? (
                          <Text variant="small" color={colors.textMuted}>
                            {occupant?.name}
                          </Text>
                        ) : null}
                      </View>
                      {takenByOther ? (
                        <Badge label="Occupied" tone="neutral" />
                      ) : active ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
            {groups.length === 0 ? (
              <Text variant="body" color={colors.textMuted} center>
                No flats yet. Add towers and flats first.
              </Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(45,49,66,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
    maxHeight: '75%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: { paddingVertical: spacing.xxl },
  list: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  group: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowInfo: { flexShrink: 1, gap: 2 },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  rowDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  pressed: { opacity: 0.85 },
});
