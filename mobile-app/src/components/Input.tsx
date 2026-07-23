import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  /** Renders an eye toggle to show/hide the value (for password fields). */
  secureToggle?: boolean;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, secureToggle, secureTextEntry, style, ...rest },
  ref
) {
  const [hidden, setHidden] = useState(true);
  const isSecure = secureToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" color={colors.textMuted} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            secureToggle ? styles.inputWithIcon : null,
            error ? styles.inputError : null,
            style,
          ]}
          {...rest}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((h) => !h)} style={styles.eye} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" color={colors.danger} style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputRow: { justifyContent: 'center' },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  inputWithIcon: { paddingRight: 48 },
  inputError: { borderColor: colors.danger },
  eye: { position: 'absolute', right: spacing.md, height: 50, justifyContent: 'center' },
  errorText: { marginLeft: spacing.xs },
});
