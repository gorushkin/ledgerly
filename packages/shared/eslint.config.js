import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import { baseConfig, commonIgnores } from "../../eslint.base.config.js";

export default tseslint.config(
  { ignores: commonIgnores },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores([".config/*"]),
  {
    ...baseConfig,
    languageOptions: {
      ...baseConfig.languageOptions,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      ...baseConfig.rules,
      // Shared package specific rules
      "perfectionist/sort-interfaces": "error",
      "perfectionist/sort-object-types": "error",
    },
  }
);
