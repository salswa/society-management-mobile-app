import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme/tokens';

/** Icon wrapped in a translucent circle when the tab is active (floating pill nav). */
export function TabBarIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.wrap, focused && styles.active]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.navActiveBg },
});
