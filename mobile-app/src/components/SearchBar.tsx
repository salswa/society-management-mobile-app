import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type Props = TextInputProps;

/** Pill search field with a leading search icon. */
export function SearchBar(props: Props) {
  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, padding: 0 },
});
