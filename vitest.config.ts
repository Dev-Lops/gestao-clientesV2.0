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
      '@/': path.resolve(__dirname, 'src') + path.sep,
      '@/domain': path.resolve(__dirname, 'src/core/domain'),
      '@/domain/': path.resolve(__dirname, 'src/core/domain') + path.sep,
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/core/': path.resolve(__dirname, 'src/core') + path.sep,
      '@/use-cases': path.resolve(__dirname, 'src/core/use-cases'),
      '@/use-cases/': path.resolve(__dirname, 'src/core/use-cases') + path.sep,
      '@/ports': path.resolve(__dirname, 'src/core/ports'),
      '@/ports/': path.resolve(__dirname, 'src/core/ports') + path.sep,
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@/infrastructure/':
        path.resolve(__dirname, 'src/infrastructure') + path.sep,
    },
  },
})
