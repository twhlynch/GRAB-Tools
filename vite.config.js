import { fileURLToPath, URL } from 'node:url';

import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';
import postcssNesting from 'postcss-nesting';

export default defineConfig({
	plugins: [vue(), mkcert()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src/', import.meta.url)),
			'#components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'#layouts': fileURLToPath(new URL('./src/components/layouts', import.meta.url)),
			'#pages': fileURLToPath(new URL('./src/components/pages', import.meta.url)),
			'#requests': fileURLToPath(new URL('./src/components/requests', import.meta.url)),
			'#stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
			'#assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
			'#icons': fileURLToPath(new URL('./src/components/icons', import.meta.url)),
		},
	},
	build: {
		emptyOutDir: true,
	},
	server: {
		https: true,
	},
	css: {
		postcss: {
			plugins: [postcssNesting],
		},
	},
});
