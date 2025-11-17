/**
 * Design Tokens Centralizados
 * Fonte única de verdade para cores, espaçamentos, sombras, etc.
 * Usado para gerar CSS custom properties e configuração do Tailwind
 */

export const colors = {
  // Brand palette (mantém compatibilidade com código existente)
  brand: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    DEFAULT: '#6157FF',
    foreground: '#FFFFFF',
    subtle: '#E7E5FF',
  },
  // Semantic status colors
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    info: '#0EA5E9',
  },
} as const

export const spacing = {
  xs: '0.5rem', // 8px
  sm: '0.75rem', // 12px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
} as const

export const radii = {
  xs: '0.25rem', // 4px
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  focus: '0 0 0 3px rgba(97, 87, 255, 0.2)',
  soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
} as const

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    md: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    lg: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    xl: ['1.5rem', { lineHeight: '2rem' }], // 24px
    '2xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '3xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '4xl': ['3rem', { lineHeight: '1' }], // 48px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
} as const

/**
 * Gradientes predefinidos
 */
export const gradients = {
  brand: 'linear-gradient(135deg, #6157FF, #8E54E9)',
  warm: 'linear-gradient(135deg, #F97316, #EF4444)',
  cool: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
  studio: 'linear-gradient(90deg, #2563eb, #7c3aed)',
} as const

/**
 * Tokens específicos do Branding Studio
 * (mantém compatibilidade com código existente)
 */
export const studioTokens = {
  cardBg: '#ffffff',
  cardBorder: '#e6e9ee',
  cardRadius: '0.75rem',
  cardShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  accentGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
} as const
