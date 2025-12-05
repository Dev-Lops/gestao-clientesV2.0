import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    watch: false,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/domain': path.resolve(__dirname, 'src/core/domain'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/use-cases': path.resolve(__dirname, 'src/core/use-cases'),
      '@/ports': path.resolve(__dirname, 'src/core/ports'),
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
    },
  },
})
