import type { Config } from 'tailwindcss'
import { colors, gradients, radii, shadows, spacing } from './src/styles/tokens'

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
        brand: colors.brand,
        status: colors.status,
      },
      spacing: spacing,
      borderRadius: {
        ...radii,
        xl: '1rem', // mantém compatibilidade
      },
      boxShadow: {
        ...shadows,
      },
      backgroundImage: {
        'gradient-brand': gradients.brand,
        'gradient-warm': gradients.warm,
        'gradient-cool': gradients.cool,
        'gradient-studio': gradients.studio,
      },
    },
  },
  plugins: [],
}

export default config
