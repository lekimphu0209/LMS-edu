import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@educonnect/config/vitest/node';

export default defineConfig(
  mergeConfig(base, {
    test: {
      include: ['test/**/*.spec.ts', 'test/**/*.test.ts'],
    },
  })
);
