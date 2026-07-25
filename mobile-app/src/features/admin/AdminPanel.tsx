import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Text } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export type AdminPanelKind = 'manage' | 'community';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: Href;
  soon?: boolean;
};

const MANAGE: Item[] = [
  { label: 'Members', icon: 'people-outline', href: '/(admin)/residents' },
  { label: 'Towers', icon: 'business-outline', href: '/(admin)/towers' },
  { label: 'Flats', icon: 'grid-outline', href: '/(admin)/flats' },
  { label: 'Staff & service providers', icon: 'construct-outline', href: '/(admin)/staff' },
];

const COMMUNITY: Item[] = [
  { label: 'Notices', icon: 'megaphone-outline', href: '/(admin)/notices' },
  { label: 'Helpdesk', icon: 'chatbubbles-outline', href: '/(admin)/helpdesk' },
  { label: 'Maintenance', icon: 'card-outline', href: '/(admin)/maintenance' },
  { label: 'Polls', icon: 'bar-chart-outline', href: '/(admin)/polls' },
  { label: 'Amenities', icon: 'tennisball-outline', href: '/(admin)/amenities' },
];

const TITLES: Record<AdminPanelKind, string> = {
  manage: 'Manage',
  community: 'Community',
};

/** Content of the right-side admin drawer (Manage / Community). */
export function AdminPanel({ kind, onClose }: { kind: AdminPanelKind; onClose: () => void }) {
  const router = useRouter();
  const items = kind === 'manage' ? MANAGE : COMMUNITY;

  const open = (item: Item) => {
    if (item.soon || !item.href) return;
    onClose();
    router.push(item.href);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text variant="h2">{TITLES[kind]}</Text>
        <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => open(item)}
            disabled={item.soon}
            style={({ pressed }) => [styles.row, pressed && !item.soon && styles.pressed]}
          >
            <View style={[styles.icon, item.soon && styles.iconMuted]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={item.soon ? colors.textMuted : colors.primary}
              />
            </View>
            <Text variant="bodyStrong" color={item.soon ? colors.textMuted : colors.ink} style={styles.label}>
              {item.label}
            </Text>
            {item.soon ? (
              <Badge label="Soon" tone="neutral" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: { backgroundColor: colors.surfaceAlt },
  label: { flex: 1 },
});
