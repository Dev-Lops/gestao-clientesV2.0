import type { Config } from 'tailwindcss'
import { designSystem } from './src/styles/design-system'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './src/**/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: designSystem.colors.brand.primary,
          primary: designSystem.colors.brand.primary,
          secondary: designSystem.colors.brand.secondary,
        },
        ...designSystem.colors.slate,
      },
      spacing: designSystem.spacing,
      borderRadius: designSystem.radius,
      boxShadow: designSystem.shadows,
      fontFamily: designSystem.typography.fontFamily,
      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      backgroundImage: {
        'gradient-brand': designSystem.colors.gradients.brand,
        'gradient-warm': designSystem.colors.gradients.warm,
        'gradient-cool': designSystem.colors.gradients.cool,
        'gradient-emerald': designSystem.colors.gradients.emerald,
        'gradient-purple': designSystem.colors.gradients.purple,
        'gradient-blue': designSystem.colors.gradients.blue,
        'gradient-amber': designSystem.colors.gradients.amber,
      },
      keyframes: designSystem.animations.keyframes,
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'blob': 'blob 7s infinite',
      },
      transitionDuration: designSystem.animations.duration,
      transitionTimingFunction: designSystem.animations.easing,
    },
  },
  plugins: [
    // Plugin customizado para utilitários do design system
    function({ addUtilities }: any) {
      addUtilities({
        '.text-gradient-primary': {
          'background': 'linear-gradient(to right, rgb(15 23 42), rgb(30 64 175), rgb(109 40 217))',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          'color': 'transparent',
          '.dark &': {
            'background': 'linear-gradient(to right, rgb(255 255 255), rgb(191 219 254), rgb(221 214 254))',
          }
        },
        '.text-gradient-brand': {
          'background': 'linear-gradient(to right, rgb(37 99 235), rgb(124 58 237))',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          'color': 'transparent',
        },
        '.text-gradient-emerald': {
          'background': 'linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          'color': 'transparent',
        },
        '.page-background': {
          'min-height': '100vh',
          'background': 'linear-gradient(to bottom right, rgb(248 250 252), rgba(239 246 255 / 0.3), rgba(250 245 255 / 0.2))',
          '.dark &': {
            'background': 'linear-gradient(to bottom right, rgb(2 6 23), rgb(15 23 42), rgb(2 6 23))',
          }
        },
      });
    },
  ],
}

export default config
