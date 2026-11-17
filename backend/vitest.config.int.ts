import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.int-spec.ts'],
    exclude: ['**/node_modules/**', '**/src/generated/**', '**/dist/**'],
    fileParallelism: false,
    globalSetup: ['./test/int-global-setup.ts'],
    setupFiles: ['./test/int-setup.ts'],
  },
});
