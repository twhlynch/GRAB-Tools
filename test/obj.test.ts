import { obj } from '@/assets/tools/obj';
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

describe('triangles', () => {
	it('creates nodes from an OBJ without material groups', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'triangles',
		);
		expect(nodes.length).toBeGreaterThan(0);
	});

	it('creates nodes from an OBJ with material groups', async () => {
		const nodes = await obj(
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
		);
		expect(nodes.length).toBeGreaterThan(0);
	});

	it('partition a single triangle into 3 or 4 isosceles prisms', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'triangles',
		);
		expect(nodes.length).toBeGreaterThanOrEqual(3);
		expect(nodes.length).toBeLessThanOrEqual(4);
	});

	it('produces colored nodes from an OBJ with an MTL file', async () => {
		const nodes = await obj(
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
		expect(nodes[0]!.levelNodeStatic?.color1).toMatchObject(
			color({ r: 1, g: 0, b: 0 }),
		);
	});
});

describe('particles', () => {
	it('creates one node per mesh from an OBJ', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'particles',
		);
		expect(nodes.length).toBe(1);
	});

	it('creates one node per material group', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				usemtl a
				f 1 2
				v 2 0 0
				usemtl b
				f 2 3
			`),
			'particles',
		);
		expect(nodes.length).toBe(2);
	});

	it('creates an animation frame per unique vertex', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'particles',
		);
		expect(nodes[0]!.animations?.[0]?.frames?.length).toBe(3);
	});

	it('uses MTL color for a named material', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				usemtl a
				f 1 2 3
			`),
			'particles',
			file(`
				newmtl a
				Kd 1 0 0
			`),
		);
		expect(nodes[0]!.levelNodeParticleEmitter?.startColor).toMatchObject(
			color({ r: 1, g: 0, b: 0 }),
		);
		expect(nodes[0]!.levelNodeParticleEmitter?.endColor).toMatchObject(
			color({ r: 1, g: 0, b: 0 }),
		);
	});

	it('defaults to white when MTL is present but material has no color', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				usemtl a
				f 1 2
			`),
			'particles',
			file(`
				newmtl a
			`),
		);
		expect(nodes[0]!.levelNodeParticleEmitter?.startColor).toMatchObject(
			color({ r: 1, g: 1, b: 1 }),
		);
	});

	it('defaults to white when MTL is present but material name is not found', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				usemtl a
				f 1 2
			`),
			'particles',
			file(`
				newmtl b
				Kd 0 1 0
			`),
		);
		expect(nodes[0]!.levelNodeParticleEmitter?.startColor).toMatchObject(
			color({ r: 1, g: 1, b: 1 }),
		);
	});
});

describe('spheres', () => {
	it('creates one node per vertex', async () => {
		const nodes = await obj(
			file(`
				v 0 0 0
				v 1 0 0
				v 0 1 0
				f 1 2 3
			`),
			'spheres',
		);
		expect(nodes.length).toBe(3);
	});

	it('positions match the OBJ vertex coordinates', async () => {
		const nodes = await obj(
			file(`
				v 1 2 3
				f 1 1 1
			`),
			'spheres',
		);
		expect(nodes[0]!.levelNodeStatic?.position).toMatchObject({
			x: 1,
			y: 2,
			z: 3,
		});
	});
});
