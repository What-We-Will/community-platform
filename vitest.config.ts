import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Resolve the `@/*` alias from tsconfig.json natively — the same source of truth
  // Jest used via moduleNameMapper. (Replaces the vite-tsconfig-paths plugin.)
  resolve: { tsconfigPaths: true },
  test: {
    // Keep describe/it/expect/vi global so the migration doesn't add an import to every file.
    globals: true,
    // Default environment; per-file override via a `@vitest-environment node` docblock.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Mirror jest.config.mjs: only *.test.ts(x) — *.spec.ts stays reserved for Playwright (e2e/).
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', 'e2e/**'],
  },
});
