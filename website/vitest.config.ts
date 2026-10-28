import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.{js,ts}'],
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src/', import.meta.url)),
			'@grab-tools/lib': fileURLToPath(
				new URL('../lib/src/', import.meta.url),
			),
		},
	},
});
