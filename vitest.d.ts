// Makes Vitest globals (describe/it/expect/vi) available to TypeScript without adding a
// `compilerOptions.types` array to tsconfig.json (which would drop ambient @types/* lookups).
/// <reference types="vitest/globals" />
