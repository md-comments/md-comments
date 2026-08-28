import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@md-comments/shared': path.resolve(__dirname, 'shared/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['shared/**/*.ts'],
      reporter: ['text', 'json', 'html'],
    },
  },
});

