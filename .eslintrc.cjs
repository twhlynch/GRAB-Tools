module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-essential',
		'plugin:@typescript-eslint/recommended',
		'@vue/eslint-config-prettier/skip-formatting',
	],
	env: {
		node: true,
		browser: true,
		es2020: true,
	},
	parser: 'vue-eslint-parser',
	parserOptions: {
		parser: '@typescript-eslint/parser',
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		'no-unused-vars': 'off',
		'vue/multi-word-component-names': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'no-shadow': 'error',
		'@typescript-eslint/no-shadow': 'error',
	},
};
