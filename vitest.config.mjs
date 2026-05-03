import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    passWithNoTests: true,
  },
});
