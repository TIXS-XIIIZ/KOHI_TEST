/**
 * Single Source of Truth for Kōhī (จิบกาแฟ) Brand & Color System
 * Mirrors lib/core/theme/app_colors.dart in the Flutter codebase.
 */

export const AppColors = {
  // Brand Palette
  espresso: '#56301D',
  darkRoast: '#351A0E',
  caramel: '#A66A43',
  latte: '#D7B896',
  milkCream: '#FFF1DE',
  warmWhite: '#FFFCF7',

  // Dark Mode Surface Derivations
  darkBackground: '#1E110A',
  darkSurface: '#351A0E',
  darkPrimaryAction: '#D7B896',
  darkAccent: '#C98B5E',

  // Semantic Colors (Light / Dark)
  semantic: {
    light: {
      income: '#2E7D5B',
      expense: '#B3402F',
      warning: '#D9A441',
      error: '#B3261E',
    },
    dark: {
      income: '#6FCF97',
      expense: '#FF8A75',
      warning: '#E8BF6A',
      error: '#F2B8B5',
    },
  },

  // Strict Chart Palette (in exact order specified; 9+ grouped into "Other")
  chartPalette: [
    '#A66A43', // 1. Caramel
    '#56301D', // 2. Espresso
    '#D7B896', // 3. Latte
    '#7A9A6B', // 4. Matcha Sage
    '#C4623F', // 5. Terracotta Roast
    '#D9A441', // 6. Honey Amber
    '#5F7A8C', // 7. Slate Steam
    '#8A5A7A', // 8. Plum Berry
  ] as const,
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type LocaleCode = 'th' | 'en';
export type EraType = 'BE' | 'CE'; // Buddhist Era (พ.ศ. +543) vs Christian Era (ค.ศ.)
