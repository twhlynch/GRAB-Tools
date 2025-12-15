import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';
import postcssNesting from 'postcss-nesting';
import { minify } from 'terser';
import fs from 'fs/promises';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [
		vue(),
		mkcert(),
		{
			name: 'minify-bookmarklets',
			apply: 'build',

			async generateBundle(_, _bundle) {
				const dir = path.resolve('public/bookmarklets');
				const entries = await fs.readdir(dir, { withFileTypes: true });

				for (const entry of entries) {
					if (!entry.isFile() || !entry.name.endsWith('.js'))
						continue;

					const filepath = path.join(dir, entry.name);
					const code = await fs.readFile(filepath, 'utf8');

					const result = await minify(code, {
						compress: true,
						mangle: true,
					});

					this.emitFile({
						type: 'asset',
						fileName: `bookmarklets/${entry.name}`,
						source: result.code,
					});
				}
			},
		},
	],
	resolve: {
		alias: {
			'@': fileURLToPath(
				new URL('./src/', import.meta.url), //
			),
		},
	},
	assetsInclude: ['**/*.gltf', '**/*.glb'],
	build: {
		emptyOutDir: true,
		target:
			process.env.TAURI_ENV_PLATFORM == 'windows'
				? 'chrome105'
				: 'safari13',
		minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
		rollupOptions: {
			output: {
				manualChunks(path) {
					if (!path.includes('node_modules')) return;
					const name = path
						.toString()
						.split('node_modules/')[1]
						.split('/')[0]
						.toString();

					if (path.includes('three/src/math')) return 'three-math';
					if (name.includes('three')) return 'three';
					if (name.includes('codemirror')) return 'editor';
					if (name.includes('@replit')) return 'editor';
					if (name.includes('@lezer')) return 'editor';
					if (name.includes('protobufjs')) return 'protobuf';
					if (name.includes('jsfft')) return 'jsfft';
				},
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash][extname]',
			},
		},
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
