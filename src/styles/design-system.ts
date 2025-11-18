/**
 * 🎨 DESIGN SYSTEM - MyGest
 * Sistema de design completo baseado na página de info do cliente
 * Mobile-first, sofisticado e consistente em toda aplicação
 */

/**
 * 📐 ESPAÇAMENTO
 * Sistema de espaçamento baseado em múltiplos de 4px
 */
export const spacing = {
  // Base spacing
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
} as const;

/**
 * 🎨 PALETA DE CORES
 * Cores principais e semânticas com variações dark mode
 */
export const colors = {
  // Brand Colors - Gradientes principais
  brand: {
    primary: '#6157FF',
    secondary: '#8E54E9',
    gradient: 'linear-gradient(135deg, #6157FF 0%, #8E54E9 100%)',
  },
  
  // Semantic Colors - Estados e ações
  semantic: {
    success: {
      light: '#10B981',
      DEFAULT: '#059669',
      dark: '#047857',
      bg: '#ECFDF5',
      bgDark: '#064E3B20',
      border: '#A7F3D0',
      borderDark: '#065F46',
    },
    warning: {
      light: '#F59E0B',
      DEFAULT: '#D97706',
      dark: '#B45309',
      bg: '#FEF3C7',
      bgDark: '#78350F20',
      border: '#FCD34D',
      borderDark: '#92400E',
    },
    danger: {
      light: '#EF4444',
      DEFAULT: '#DC2626',
      dark: '#B91C1C',
      bg: '#FEE2E2',
      bgDark: '#7F1D1D20',
      border: '#FCA5A5',
      borderDark: '#991B1B',
    },
    info: {
      light: '#3B82F6',
      DEFAULT: '#2563EB',
      dark: '#1D4ED8',
      bg: '#DBEAFE',
      bgDark: '#1E3A8A20',
      border: '#93C5FD',
      borderDark: '#1E40AF',
    },
  },

  // Neutral Palette
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Gradient Palettes
  gradients: {
    brand: 'linear-gradient(135deg, #6157FF 0%, #8E54E9 100%)',
    warm: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    cool: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
    emerald: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    purple: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    amber: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
  },

  // Background Gradients
  backgrounds: {
    light: 'linear-gradient(to bottom right, #F8FAFC 0%, #EFF6FF 30%, #FAF5FF 100%)',
    dark: 'linear-gradient(to bottom right, #020617 0%, #0F172A 50%, #020617 100%)',
  },
} as const;

/**
 * 📏 BORDAS E RAIOS
 */
export const radius = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
} as const;

/**
 * 🌗 SOMBRAS
 * Sistema de elevação com suporte a dark mode
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 3px rgba(97, 87, 255, 0.2)',
  glow: '0 0 20px rgba(97, 87, 255, 0.3)',
  // Dark mode shadows
  dark: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  },
} as const;

/**
 * 📝 TIPOGRAFIA
 */
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

/**
 * ⏱️ TRANSIÇÕES E ANIMAÇÕES
 */
export const animations = {
  duration: {
    fastest: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      from: { transform: 'translateY(-10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    blob: {
      '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
      '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
      '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
    },
  },
} as const;

/**
 * 🎯 COMPONENTES PADRÃO
 * Estilos reutilizáveis para componentes comuns
 */
export const components = {
  // Cards
  card: {
    base: 'rounded-xl border-2 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-200',
    elevated: 'shadow-lg hover:shadow-xl',
    interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
  },
  
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    sizes: {
      sm: 'h-9 px-4 text-sm',
      md: 'h-10 px-6 text-base',
      lg: 'h-12 px-8 text-lg',
      xl: 'h-14 px-10 text-xl',
    },
    variants: {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white',
      success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl hover:scale-105',
      outline: 'border-2 border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    },
  },
  
  // Inputs
  input: {
    base: 'w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
  },
  
  // Badges
  badge: {
    base: 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    variants: {
      default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      outline: 'border-2 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
    },
  },
  
  // KPI Cards (baseado na página de info)
  kpiCard: {
    emerald: 'group border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 hover:shadow-xl transition-all hover:scale-105',
    blue: 'group border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 hover:shadow-xl transition-all hover:scale-105',
    purple: 'group border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/30 hover:shadow-xl transition-all hover:scale-105',
    amber: 'group border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30 hover:shadow-xl transition-all hover:scale-105',
  },
} as const;

/**
 * 📱 BREAKPOINTS
 * Breakpoints mobile-first
 */
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const;

/**
 * 🎪 LAYOUTS
 * Containers e layouts padrão
 */
export const layouts = {
  container: {
    sm: 'max-w-screen-sm mx-auto px-4 sm:px-6',
    md: 'max-w-screen-md mx-auto px-4 sm:px-6',
    lg: 'max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8',
    xl: 'max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8',
    '2xl': 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8',
  },
  
  section: {
    spacing: 'py-6 space-y-6',
  },
  
  grid: {
    kpi: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    twoColumn: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  },
} as const;

/**
 * 🎭 CLASSES UTILITÁRIAS
 * Classes CSS reutilizáveis
 */
export const utilities = {
  // Gradient texts
  gradientText: {
    primary: 'bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent',
    brand: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
    emerald: 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent',
  },
  
  // Backgrounds
  pageBackground: 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
  
  // Icon containers
  iconContainer: {
    emerald: 'p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-hover:scale-110 transition-transform',
    blue: 'p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:scale-110 transition-transform',
    purple: 'p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:scale-110 transition-transform',
    amber: 'p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl group-hover:scale-110 transition-transform',
    slate: 'p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl group-hover:scale-110 transition-transform',
  },
  
  // Status indicators
  statusDot: {
    success: 'h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse',
    warning: 'h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse',
    danger: 'h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse',
    info: 'h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse',
  },
} as const;

/**
 * 🎨 TEMA EXPORT
 * Export completo do design system
 */
export const designSystem = {
  spacing,
  colors,
  radius,
  shadows,
  typography,
  animations,
  components,
  breakpoints,
  layouts,
  utilities,
} as const;

export default designSystem;
