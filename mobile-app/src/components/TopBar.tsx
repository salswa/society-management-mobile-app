import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Text } from './Text';

/** In-content nav bar (back chevron + Syne title) that sits on the dotted canvas. */
export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.ink} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  back: { marginLeft: -6 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, flex: 1 },
});
