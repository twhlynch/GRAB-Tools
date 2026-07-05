import { transform } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

export interface BookmarkletOptions {
	inputDir: string;
	outputDir: string;
}

export function bookmarklets({
	inputDir,
	outputDir,
}: BookmarkletOptions): Plugin {
	return {
		name: 'bookmarklets',

		async generateBundle() {
			const dir = path.resolve(inputDir);
			const entries = await fs.readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				if (!entry.isFile()) continue;

				const isTs = entry.name.endsWith('.ts');
				const isJs = entry.name.endsWith('.js');
				if (!isTs && !isJs) continue;

				const filepath = path.join(dir, entry.name);
				const code = await fs.readFile(filepath, 'utf8');

				const result = await transform(code, {
					loader: isTs ? 'ts' : 'js',
					minify: true,
				});

				const fileName = `${outputDir}/${entry.name.replace(/\.ts$/, '.js')}`;

				this.emitFile({
					type: 'asset',
					fileName,
					source: result.code,
				});
			}
		},

		configureServer(server: ViteDevServer) {
			const dir = path.resolve(inputDir);

			server.middlewares.use(async (req, res, next) => {
				const match = req.url?.match(
					new RegExp(`^/${outputDir}/(.+)\\.js$`),
				);
				if (!match) return next();

				const name = match[1]!;
				const tsPath = path.join(dir, `${name}.ts`);
				const jsPath = path.join(dir, `${name}.js`);

				try {
					let code: string;
					try {
						code = await fs.readFile(tsPath, 'utf8');
						const result = await transform(code, {
							loader: 'ts',
						});
						code = result.code;
					} catch {
						code = await fs.readFile(jsPath, 'utf8');
					}

					res.setHeader(
						'Content-Type',
						'application/javascript; charset=utf-8',
					);
					res.end(code);
				} catch {
					next();
				}
			});
		},
	};
}
