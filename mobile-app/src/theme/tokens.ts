/**
 * Design tokens for the Portl app — "variant" look.
 *
 * Syne display headings + Inter body, a royal-blue accent on a dotted off-white
 * canvas, big rounded cards, pill buttons/badges, and a floating dark pill nav.
 */

export const colors = {
  // Brand
  primary: "#4361EE",
  primaryDark: "#2F4BD0",
  primarySoft: "#ECEFFE",

  // Ink / strong neutral (text, nav bar, outlines)
  ink: "#2D3142",

  // Surfaces
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F7",
  border: "rgba(45,49,66,0.10)",
  borderSoft: "rgba(45,49,66,0.06)",

  // Text
  text: "#2D3142",
  textMuted: "rgba(45,49,66,0.62)",
  textInverse: "#FFFFFF",

  // Status
  success: "#1FA971",
  successSoft: "#E4F5EE",
  warning: "#E08A00",
  warningSoft: "#FBF0DC",
  danger: "#E5484D",
  dangerSoft: "#FBE7E7",
  info: "#4361EE",
  infoSoft: "#ECEFFE",

  // Floating bottom nav
  navBar: "#2D3142",
  navInactive: "rgba(255,255,255,0.5)",
  navActiveBg: "rgba(255,255,255,0.16)",

  overlay: "rgba(45,49,66,0.45)",
} as const;

/** Font families (from @expo-google-fonts/syne + inter). Loaded in app/_layout.tsx. */
export const fonts = {
  display: "Syne_700Bold",
  heading: "Syne_600SemiBold",
  headingSemi: "Syne_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 14,
  md: 18,
  lg: 28,
  card: 30,
  pill: 999,
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  h3: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.heading,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.7,
    textTransform: "uppercase" as const,
  },
} as const;

/** Cards are borderless-flat in this system; shadow kept minimal for the floating nav only. */
export const shadow = {
  nav: {
    shadowColor: "#2D3142",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
