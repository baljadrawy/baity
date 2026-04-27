import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/features/**/lib/**', 'src/core/**'],
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        // Coverage gates من CLAUDE.md
        'src/features/**/lib/': { lines: 70, functions: 70 },
        'src/core/': { lines: 80, functions: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
