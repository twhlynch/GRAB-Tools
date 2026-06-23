import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default [
	{
		ignores: ['dist/**', 'node_modules/**'],
	},

	js.configs.recommended,

	...tseslint.configs.recommended,
	...vue.configs['flat/recommended'],

	prettierConfig,

	{
		files: ['**/*.{js,ts,vue}'],

		languageOptions: {
			parser: vueParser,

			parserOptions: {
				parser: tsParser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},

			globals: {
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				process: 'readonly',
			},
		},

		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',

			'@typescript-eslint/no-unused-expressions': 'off',

			'vue/multi-word-component-names': 'off',

			'no-shadow': 'error',
			'@typescript-eslint/no-shadow': 'error',
		},
	},
];

