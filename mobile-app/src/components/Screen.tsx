import type { ReactElement, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme/tokens";
import { DotGrid } from "./DotGrid";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Fixed nav bar on the canvas, above the scroll area (e.g. <TopBar/>). */
  header?: ReactNode;
  /** Extra bottom space for breathing room above the tab bar (tab screens). */
  tabbarSpace?: boolean;
};

const TABBAR_SPACE = 24;

/** Screen container: full-bleed dotted canvas + safe-area-inset content. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ["top"],
  style,
  refreshControl,
  header,
  tabbarSpace = false,
}: Props) {
  const inner = [
    padded && styles.padded,
    tabbarSpace && styles.tabbarSpace,
    style,
  ];

  return (
    <View style={styles.root}>
      {/* Dot grid fills the whole scene, behind the safe-area content. */}
      <DotGrid />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header ? <View style={styles.headerWrap}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, inner]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, inner]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: "transparent" },
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabbarSpace: { paddingBottom: TABBAR_SPACE },
  scrollContent: { flexGrow: 1 },
});
