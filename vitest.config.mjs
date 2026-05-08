import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  css: { postcss: { plugins: [] } },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
    jsx: 'automatic',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
      jsx: 'automatic',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    setupFiles: ['./vitest.setup.js'],
    passWithNoTests: true,
    // 5s default trips intermittently when the suite runs all 100+ files in
    // parallel — a few component tests do real keystroke simulation or wait
    // on debounced storage writes. Bumped to 15s to absorb the load.
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
