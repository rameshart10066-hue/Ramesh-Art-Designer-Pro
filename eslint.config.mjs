// Root ESLint configuration (flat config format).
// Applies to every workspace package unless a package defines its own override.
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/*.tsbuildinfo"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforced project-wide per SOLID/enterprise conventions:
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
);
