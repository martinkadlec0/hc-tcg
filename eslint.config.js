// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
	rules: {
		"no-case-declarations": "off",
		"react/no-unescaped-entities": "off",
		"require-yield": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "params"}]
	},
	settings: {
		react: {
			version: "detect"
		}
	},
    ignores: ["*.js"],
  },
);
