import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const app = fileURLToPath(new URL('./app', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': app, '~': app },
  },
  test: {
    include: ['tests/unit/**/*.test.js'],
  },
});
