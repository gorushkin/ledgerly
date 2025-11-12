import js from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-plugin-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import importOrder from "eslint-plugin-import";

/**
 * Base ESLint configuration shared across all packages in the monorepo.
 * Individual packages can extend and override these settings as needed.
 */
export const baseConfig = {
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  files: ["**/*.{ts,tsx}"],
  plugins: {
    "unused-imports": unusedImports,
    prettier,
    perfectionist,
    "typescript-eslint": tseslint.plugin,
    import: importOrder,
  },
  languageOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    // Console rules
    "no-console": ["error", { allow: ["error", "info"] }],

    // TypeScript rules
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],

    // Import rules
    "unused-imports/no-unused-imports": "error",
    "import/order": [
      "warn",
      {
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
      },
    ],

    // Code style rules
    "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
    "max-len": "off",

    // Perfectionist rules
    "perfectionist/sort-objects": "warn",

    // Prettier rules
    "prettier/prettier": [
      "error",
      {
        bracketSpacing: true,
      },
    ],
  },
};

/**
 * Common ignore patterns for all packages
 */
export const commonIgnores = ["dist", "node_modules", ".config/*"];

export default baseConfig;
