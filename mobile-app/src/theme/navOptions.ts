import { colors, fonts } from './tokens';

/** Stack screenOptions styled like the mockup's top nav (Syne title, canvas bg, no shadow). */
export const stackScreenOptions = {
  headerShown: false,
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  headerTitleAlign: 'left' as const,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: colors.background },
};

/** Shared screenOptions for the bottom tab bar (attached, labeled) across roles. */
export const floatingTabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
};
