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
      exclude: [
        'shared/types.ts',
        'shared/commentStorage.ts',
        'shared/**/*.d.ts',
        'shared/src/telemetry/otelTypes.ts',
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 90,
      },
    },
  },
});

