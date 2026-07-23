import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Props = {
  children: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

/** Uppercase Syne section label with an optional trailing action link. */
export function SectionTitle({ children, action, onAction, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{children}</Text>
      {action ? (
        <Text variant="small" color={colors.primary} onPress={onAction} style={styles.action}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text,
  },
  action: { fontFamily: fonts.bodySemi },
});
