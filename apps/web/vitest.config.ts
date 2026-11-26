import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@educonnect/config/vitest/react';

export default defineConfig(mergeConfig(base, {
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
  },
}));
