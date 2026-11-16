import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import { noUnknownSpread } from './eslint/no-unknown-spreads';

const sourceFiles = ['**/*.ts', '**/*.vue'];

export default [
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/src-tauri/**'],
	},

	js.configs.recommended,

	...tseslint.configs.recommended,
	...tseslint.configs.stylistic,

	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: sourceFiles,
	})),
	...tseslint.configs.stylisticTypeChecked.map((config) => ({
		...config,
		files: sourceFiles,
	})),

	...vue.configs['flat/recommended'],

	prettierConfig,

	{
		files: sourceFiles,

		plugins: {
			local: {
				rules: {
					'no-unknown-spread': noUnknownSpread,
				},
			},
		},

		languageOptions: {
			parser: vueParser,

			parserOptions: {
				parser: tsParser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},

			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},

		rules: {
			'local/no-unknown-spread': 'error',

			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'all',
					caughtErrors: 'all',
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
				},
			],

			'@typescript-eslint/no-empty-function': 'error',

			'no-shadow': 'error',
			'@typescript-eslint/no-shadow': 'error',

			'no-constant-binary-expression': 'error',
			'@typescript-eslint/prefer-for-of': 'error',

			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',

			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
			'vue/prop-name-casing': 'off',
		},
	},
	{
		files: ['**/*.vue'],
		rules: {
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-enum-comparison': 'off',
		},
	},
];
