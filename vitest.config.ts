import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Mirror jest.config.mjs moduleNameMapper (`^@/(.*)$` → `<rootDir>/$1`): map `@/*`
  // to the repo root. Vite does not read tsconfig.json paths by default, so this alias
  // is required for `@/...` imports to resolve in tests.
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
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
