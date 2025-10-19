import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';
import postcssNesting from 'postcss-nesting';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [vue(), mkcert()],
	resolve: {
		alias: {
			'@': fileURLToPath(
				new URL('./src/', import.meta.url), //
			),
			'#components': fileURLToPath(
				new URL('./src/components', import.meta.url),
			),
			'#layouts': fileURLToPath(
				new URL('./src/layouts', import.meta.url),
			),
			'#pages': fileURLToPath(
				new URL('./src/pages', import.meta.url), //
			),
			'#requests': fileURLToPath(
				new URL('./src/requests', import.meta.url),
			),
			'#stores': fileURLToPath(
				new URL('./src/stores', import.meta.url), //
			),
			'#assets': fileURLToPath(
				new URL('./src/assets', import.meta.url), //
			),
			'#icons': fileURLToPath(
				new URL('./src/icons', import.meta.url), //
			),
			'#tools': fileURLToPath(
				new URL('./src/tools', import.meta.url), //
			),
		},
	},
	build: {
		emptyOutDir: true,
		target:
			process.env.TAURI_ENV_PLATFORM == 'windows'
				? 'chrome105'
				: 'safari13',
		minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
	},
	server: {
		https: true,
		port: 5173,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421,
			  }
			: undefined,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
	envPrefix: ['VITE_', 'TAURI_ENV_*'],
	css: {
		postcss: {
			plugins: [postcssNesting],
		},
	},
	clearScreen: false,
});
