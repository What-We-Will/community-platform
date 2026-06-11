import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Map `@/*` to the repo root, matching the tsconfig `paths` alias. Vite does not read
  // tsconfig.json `paths` by default, so this explicit alias is required for `@/...`
  // imports to resolve in tests.
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    // Keep describe/it/expect/vi global so the migration doesn't add an import to every file.
    globals: true,
    // Default environment; per-file override via a `@vitest-environment node` docblock.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Only *.test.ts(x) — *.spec.ts stays reserved for Playwright (e2e/).
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', 'e2e/**'],
    // Reporting only — no thresholds enforced yet. The TESTING_STANDARDS ≥80% lib/ target
    // is aspirational; current baseline is well below it. Run via `npm run test:coverage`.
    coverage: {
      provider: 'v8',
      // Scope to the documented metric (lib/). `include` forces untested files into the
      // denominator so the percentage is honest, not inflated by only-imported files.
      include: ['lib/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/__tests__/**', '**/*.d.ts'],
      reporter: ['text-summary', 'text', 'html'],
    },
  },
});
