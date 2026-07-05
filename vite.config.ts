import vue from '@vitejs/plugin-vue';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import postcssNesting from 'postcss-nesting';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { bookmarklets } from './vite/vite-plugin-bookmarklets';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [
		vue(),
		mkcert(),
		bookmarklets({
			inputDir: 'src/assets/bookmarklets',
			outputDir: 'bookmarklets',
		}),
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
		chunkSizeWarningLimit: 800,
		target:
			process.env.TAURI_ENV_PLATFORM == 'windows'
				? 'chrome105'
				: 'safari15',
		minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
		rollupOptions: {
			output: {
				manualChunks(filepath) {
					if (!filepath.includes('node_modules')) return;
					const name = filepath
						.toString()
						.split('node_modules/')[1]!
						.split('/')[0]!
						.toString();

					if (filepath.includes('three/src/math'))
						return 'three-math';
					if (name.includes('three')) return 'three';
					if (name.includes('codemirror')) return 'editor';
					if (name.includes('@replit')) return 'editor';
					if (name.includes('@lezer')) return 'editor';
					if (name.includes('protobufjs')) return 'protobuf';
					if (name.includes('jsfft')) return 'jsfft';
					if (name.includes('sentry')) return 'sentry';
					if (name.includes('jsfxr')) return 'jsfxr';
					if (name.includes('tonejs')) return 'tonejs';
					if (name.includes('vue')) return 'vue';
				},
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash][extname]',
			},
		},
	},
	server: {
		https: {},
		port: 5173,
		strictPort: true,
		host: host ?? false,
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
