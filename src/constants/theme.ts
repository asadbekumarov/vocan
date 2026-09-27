/**
 * 🎨 VocApp Premium Design System
 * 
 * A comprehensive design token system inspired by Apple HIG, Duolingo, and Headspace.
 * Provides colors, typography, spacing, shadows, and animation presets for a
 * premium, joyful, yet clean and minimal interface.
 * 
 * IMPORTANT: All existing exported symbols (Colors, UI, Fonts) maintain their
 * original keys for backward compatibility. New tokens are added alongside them.
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// 🎨 Brand Palette
// ─────────────────────────────────────────────

export const Palette = {
  // Primary — Indigo
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo300: '#A5B4FC',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  indigo800: '#3730A3',
  indigo900: '#312E81',

  // Success — Emerald
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065F46',
  emerald900: '#064E3B',

  // Warning — Amber
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  // Error — Rose
  rose50: '#FFF1F2',
  rose100: '#FFE4E6',
  rose200: '#FECDD3',
  rose300: '#FDA4AF',
  rose400: '#FB7185',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  // Info — Sky
  sky50: '#F0F9FF',
  sky100: '#E0F2FE',
  sky200: '#BAE6FD',
  sky300: '#7DD3FC',
  sky400: '#38BDF8',
  sky500: '#0EA5E9',

  // Neutrals — Slate
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  // Pure
  white: '#FFFFFF',
  black: '#000000',

  // Mode accent colors (for language pairs)
  modeUzEn: '#10B981',
  modeEnUz: '#3B82F6',
  modeUzRu: '#F59E0B',
  modeRuUz: '#8B5CF6',
  modeEnRu: '#EC4899',
  modeRuEn: '#14B8A6',
} as const;

// ─────────────────────────────────────────────
// 🌗 Theme Colors (Light & Dark)
// ─────────────────────────────────────────────
// Backward-compatible: all existing keys preserved.

const tintColorLight = Palette.indigo500;
const tintColorDark = Palette.indigo400;

export const Colors = {
  light: {
    // Existing keys (backward compat)
    text: Palette.slate900,
    background: '#F8F9FE',          // Slightly warm off-white with a hint of indigo
    card: Palette.white,
    tint: tintColorLight,
    icon: Palette.slate500,
    tabIconDefault: Palette.slate400,
    tabIconSelected: tintColorLight,
    border: '#E8ECF4',              // Soft neutral border
    secondary: '#F0F1F8',           // Subtle indigo-tinted secondary
    pressed: Palette.indigo600,
    muted: Palette.slate400,

    // New semantic tokens
    cardElevated: Palette.white,
    surfaceSubtle: '#F3F4FA',       // For nested surfaces
    textSecondary: Palette.slate600,
    textTertiary: Palette.slate400,
    accent: Palette.indigo500,
    accentSoft: Palette.indigo50,
    success: Palette.emerald500,
    successSoft: Palette.emerald50,
    warning: Palette.amber500,
    warningSoft: Palette.amber50,
    error: Palette.rose500,
    errorSoft: Palette.rose50,
    info: Palette.sky500,
    infoSoft: Palette.sky50,
    overlay: 'rgba(15, 23, 42, 0.4)',
    skeleton: '#E8ECF4',
    divider: '#EEF0F6',
    inputBackground: '#F5F6FC',
    inputBorder: '#DFE3EE',
    inputFocusBorder: Palette.indigo400,
    tabBarBackground: 'rgba(255, 255, 255, 0.85)',
    streak: '#FF9500',
  },
  dark: {
    // Existing keys (backward compat)
    text: '#F1F5F9',
    background: '#0C0F1A',          // Deep navy-black
    card: '#161B2E',                // Elevated dark card
    tint: tintColorDark,
    icon: Palette.slate400,
    tabIconDefault: Palette.slate600,
    tabIconSelected: tintColorDark,
    border: '#1E2540',              // Subtle dark border
    secondary: '#111628',           // Deep secondary surface
    pressed: Palette.indigo500,
    muted: Palette.slate500,

    // New semantic tokens
    cardElevated: '#1A2038',
    surfaceSubtle: '#131830',
    textSecondary: Palette.slate400,
    textTertiary: Palette.slate500,
    accent: Palette.indigo400,
    accentSoft: 'rgba(99, 102, 241, 0.15)',
    success: Palette.emerald400,
    successSoft: 'rgba(16, 185, 129, 0.15)',
    warning: Palette.amber400,
    warningSoft: 'rgba(245, 158, 11, 0.15)',
    error: Palette.rose400,
    errorSoft: 'rgba(244, 63, 94, 0.15)',
    info: Palette.sky400,
    infoSoft: 'rgba(14, 165, 233, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: '#1E2540',
    divider: '#1A2035',
    inputBackground: '#131830',
    inputBorder: '#1E2540',
    inputFocusBorder: Palette.indigo400,
    tabBarBackground: 'rgba(12, 15, 26, 0.88)',
    streak: '#FFB340',
  },
};

// ─────────────────────────────────────────────
// 🔲 UI Constants (Spacing, Border Radius)
// ─────────────────────────────────────────────

export const UI = {
  padding: 20,
  borderRadius: {
    xs: 6,
    small: 10,
    medium: 14,
    large: 20,
    xl: 24,
    xxl: 32,
    pill: 999,
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  maxContentWidth: 600,
  maxWideContentWidth: 900,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
};

// ─────────────────────────────────────────────
// 🔤 Typography
// ─────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    /** iOS system font — clean and modern */
    sans: 'System',
    /** iOS serif */
    serif: 'Georgia',
    /** iOS rounded */
    rounded: 'ui-rounded',
    /** iOS mono */
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Nunito', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', Menlo, monospace",
  },
});

/**
 * Typography scale — consistent text sizes, weights, and line heights.
 * Inspired by iOS Dynamic Type and Material Design type scale.
 */
export const Typography = {
  // Display — for hero numbers, large headings
  displayLarge: {
    fontSize: 48,
    fontWeight: '900' as const,
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  displayMedium: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -1,
  },
  displaySmall: {
    fontSize: 30,
    fontWeight: '800' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  // Heading
  headingLarge: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  headingMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  headingSmall: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Body
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },

  // Label — for buttons, chips, badges
  labelLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Caption — for small metadata, timestamps
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.4,
  },

  // Overline — for section labels
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
} as const;

// ─────────────────────────────────────────────
// 🌫️ Shadows
// ─────────────────────────────────────────────

export const Shadows = {
  light: {
    none: Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      web: { boxShadow: 'none' } as any,
    }),
    xs: Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(99, 102, 241, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)' } as any,
    }),
    sm: Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)' } as any,
    }),
    md: Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(99, 102, 241, 0.10), 0 2px 4px rgba(0, 0, 0, 0.04)' } as any,
    }),
    lg: Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04)' } as any,
    }),
    xl: Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 36 },
      android: { elevation: 12 },
      web: { boxShadow: '0 12px 48px rgba(99, 102, 241, 0.16), 0 6px 12px rgba(0, 0, 0, 0.04)' } as any,
    }),
    glow: Platform.select({
      ios: { shadowColor: Palette.indigo500, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 6 },
      web: { boxShadow: '0 0 24px rgba(99, 102, 241, 0.25)' } as any,
    }),
  },
  dark: {
    none: Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      web: { boxShadow: 'none' } as any,
    }),
    xs: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)' } as any,
    }),
    sm: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2)' } as any,
    }),
    md: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)' } as any,
    }),
    lg: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.2)' } as any,
    }),
    xl: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 36 },
      android: { elevation: 12 },
      web: { boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.2)' } as any,
    }),
    glow: Platform.select({
      ios: { shadowColor: Palette.indigo400, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 6 },
      web: { boxShadow: '0 0 24px rgba(129, 140, 248, 0.3)' } as any,
    }),
  },
} as const;

// ─────────────────────────────────────────────
// 🌈 Gradients
// ─────────────────────────────────────────────

export const Gradients = {
  /** Primary accent gradient — hero cards, CTAs */
  primary: [Palette.indigo500, Palette.indigo600],
  primaryVibrant: [Palette.indigo400, '#7C3AED'],   // Indigo → Violet
  
  /** Success gradient — correct answers, streaks */
  success: [Palette.emerald400, Palette.emerald600],

  /** Warm gradient — streaks, fire */
  warm: ['#F59E0B', '#EF4444'],

  /** Cool gradient — info, calm states */
  cool: [Palette.sky400, Palette.indigo400],

  /** Dark hero gradient — dark mode hero */
  darkHero: ['#1E1B4B', '#312E81'],

  /** Glass overlay — for frosted glass cards */
  glassLight: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
  glassDark: ['rgba(22, 27, 46, 0.8)', 'rgba(22, 27, 46, 0.4)'],
} as const;

// ─────────────────────────────────────────────
// ✨ Animation Presets
// ─────────────────────────────────────────────

export const Animation = {
  /** Micro interactions — button presses, toggles */
  micro: { duration: 150, type: 'timing' as const },

  /** Standard UI transitions */
  standard: { duration: 300, type: 'timing' as const },

  /** Smooth entrances */
  entrance: { duration: 500, type: 'timing' as const },

  /** Spring animations — bouncy, playful */
  spring: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  springBouncy: {
    type: 'spring' as const,
    damping: 12,
    stiffness: 200,
    mass: 0.6,
  },
  springGentle: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 150,
    mass: 1,
  },

  /** Stagger delay for list items */
  staggerDelay: 50,

  /** Scale feedback values */
  pressScale: 0.97,
  pressScaleSmall: 0.95,
} as const;

// ─────────────────────────────────────────────
// 🧩 Component Tokens
// ─────────────────────────────────────────────

export const ComponentTokens = {
  card: {
    borderRadius: UI.borderRadius.xl,
    padding: UI.spacing.lg,
    borderWidth: 1,
  },
  button: {
    height: 52,
    borderRadius: UI.borderRadius.medium,
    paddingHorizontal: UI.spacing.lg,
  },
  buttonSmall: {
    height: 40,
    borderRadius: UI.borderRadius.small,
    paddingHorizontal: UI.spacing.md,
  },
  input: {
    height: 52,
    borderRadius: UI.borderRadius.medium,
    paddingHorizontal: UI.spacing.md,
    borderWidth: 1.5,
  },
  chip: {
    height: 36,
    borderRadius: UI.borderRadius.pill,
    paddingHorizontal: UI.spacing.md,
  },
  avatar: {
    small: 32,
    medium: 44,
    large: 56,
    borderRadius: UI.borderRadius.pill,
  },
  tabBar: {
    height: Platform.OS === 'web' ? 64 : 60,
    borderRadius: UI.borderRadius.xxl,
    blurIntensity: 25,
  },
  iconContainer: {
    small: 36,
    medium: 48,
    large: 56,
    borderRadius: UI.borderRadius.medium,
  },
} as const;

// ─────────────────────────────────────────────
// 🔧 Helpers
// ─────────────────────────────────────────────

/** Get appropriate shadow set based on theme */
export function getThemeShadows(isDark: boolean) {
  return isDark ? Shadows.dark : Shadows.light;
}

/** Create a semi-transparent version of a color */
export function withOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  // Strip any existing alpha
  const base = color.length === 9 ? color.slice(0, 7) : color;
  return `${base}${hex}`;
}
