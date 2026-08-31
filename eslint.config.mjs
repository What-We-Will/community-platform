import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import vitest from "@vitest/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    // Auto-generated output (not source):
    "coverage/**",
  ]),
  {
    // data-ph-capture-attribute-* values bypass autocapture masking by design,
    // so they must be static string literals (ADR-0013). AST-based so JSX
    // whitespace, multiline bindings, and props objects can't evade it; the
    // grep in scripts/ci/check-ph-capture-attrs.sh is a redundant layer.
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name=/^data-ph-capture-attribute-/] > JSXExpressionContainer",
          message:
            "data-ph-capture-attribute-* values must be static string literals, not JSX expressions (docs/adr/0013-posthog-product-analytics.md).",
        },
        {
          selector: "Property[key.value=/^data-ph-capture-attribute-/]",
          message:
            "data-ph-capture-attribute-* must be written as a static literal JSX attribute, not an object property (docs/adr/0013-posthog-product-analytics.md).",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-large-snapshots": "warn",
    },
  },
]);

export default eslintConfig;
