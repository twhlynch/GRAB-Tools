import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'src-tauri/**'],
	},

	js.configs.recommended,

	...tseslint.configs.recommended,
	...tseslint.configs.stylistic,

	// TODO: add later
	// ...tseslint.configs.recommendedTypeChecked.map((config) => ({
	// 	...config,
	// 	files: ['**/*.ts'],
	// })),
	// ...tseslint.configs.stylisticTypeChecked.map((config) => ({
	// 	...config,
	// 	files: ['**/*.ts'],
	// })),

	...vue.configs['flat/recommended'],

	prettierConfig,

	{
		files: ['**/*.{js,ts,vue,mjs}'],

		languageOptions: {
			parser: vueParser,

			parserOptions: {
				parser: tsParser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
				projectService: true,
			},

			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},

		rules: {
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

			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
			'vue/prop-name-casing': 'off',
		},
	},

	{
		files: ['**/*.ts'],

		rules: {
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
		},
	},
];
