import obj from '@/assets/tools/obj.js';
import { color } from '@/generated/helpers';
import { describe, expect, it } from 'vitest';

function file(string: string) {
	const data =
		string
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.join('\n') + '\n';

	return new File([data], '');
}

describe('parse_obj_nodes', () => {
	it('produces nodes from an OBJ without material groups', async () => {
		const nodes = await obj.obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'triangles',
			null,
		);
		expect(nodes.length).toBeGreaterThan(0);
	});

	it('produces nodes from an OBJ with material groups', async () => {
		const nodes = await obj.obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				v 1 1 0
				usemtl a
				f 1 2 3
				usemtl b
				f 2 3 4
			`),
			'triangles',
			null,
		);
		expect(nodes.length).toBeGreaterThan(0);
	});

	it('produces colored nodes from an OBJ with an MTL file', async () => {
		const nodes = await obj.obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				usemtl a
				f 1 2 3
			`),
			'triangles',
			file(`
				newmtl a
				Kd 1 0 0
			`),
		);
		expect(nodes[0]!.levelNodeStatic.color1).toMatchObject(
			color({ r: 1, g: 0, b: 0 }),
		);
	});
});
