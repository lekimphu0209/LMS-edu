import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@educonnect/config/vitest/react';

export default defineConfig(mergeConfig(base, {}));
