import { levelNodeWithStatic } from '@/generated/nodes';
import { LevelNodeMaterial, LevelNodeShape } from '@/generated/proto';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { partition_into_isosceles, tri_to_node } from './triangle_partition';

/**
 * @param {File} file - An obj file
 * @param {"spheres" | "particles" | "triangles"} mode - what is placed
 * @param {File} mtlFile- An optional mtl file for material colors
 * @returns {Promise<Array<Object>>} - A list of level nodes
 */
async function obj(file, mode, mtlFile) {
	if (mode === 'triangles') {
		const mtl_colors = mtlFile ? parse_mtl(await mtlFile.text()) : null;
		const nodes = scale_to_unit(await parse_obj_nodes(file, mtl_colors));
		return nodes.map((node) =>
			levelNodeWithStatic({
				...node,
				shape: LevelNodeShape.PRISM,
				material: LevelNodeMaterial.DEFAULT_COLORED,
			}),
		);
	}

	const text = await file.text();
	const model = obj_vertices(text);

	const nodes = [];

	if (mode === 'particles') {
		for (let i = 0; i < model.length; i++) {
			const rgb = [Math.random(), Math.random(), Math.random()];
			let node = {
				levelNodeParticleEmitter: {
					position: {},
					scale: {
						x: 0.01,
						y: 0.01,
						z: 0.01,
					},
					rotation: {
						w: 1,
					},
					particlesPerSecond: 999,
					lifeSpan: {
						x: 5,
						y: 5,
					},
					startColor: {
						r: rgb[0],
						g: rgb[1],
						b: rgb[2],
						a: 1,
					},
					endColor: {
						r: rgb[0],
						g: rgb[1],
						b: rgb[2],
						a: 1,
					},
					startSize: {
						x: 0.1,
						y: 0.1,
					},
					endSize: {
						x: 0.1,
						y: 0.1,
					},
					velocity: {},
					velocityMin: {},
					velocityMax: {},
					accelerationMin: {},
					accelerationMax: {},
				},
				animations: [
					{
						name: 'idle',
						frames: model[i].map((p, j) => {
							return {
								time: j * (1 / model[i].length),
								position: {
									x: p[0],
									y: p[1],
									z: p[2],
								},
								rotation: {
									w: 1,
								},
							};
						}),
						speed: 1,
					},
				],
			};
			nodes.push(node);
		}
	} else {
		const flat = model.flat();
		for (let i = 0; i < flat.length; i++) {
			nodes.push({
				levelNodeStatic: {
					material: 8,
					position: {
						x: flat[i][0],
						y: flat[i][1],
						z: flat[i][2],
					},
					color1: {
						r: 1,
						g: 1,
						b: 1,
						a: 1,
					},
					rotation: {
						w: 1,
					},
					scale: {
						x: 1,
						y: 1,
						z: 1,
					},
					shape: 1001,
				},
			});
		}
	}

	return nodes;
}

function obj_vertices(text) {
	const lines = text.split('\n');

	const model = [];
	let mesh = [];

	lines.forEach((line) => {
		if (line.startsWith('v ')) {
			const position = line.replace('v ', '').split(' ').map(parseFloat);
			mesh.push(position);
		} else if (line.startsWith('usemtl ') || line.startsWith('o ')) {
			if (mesh.length) {
				model.push(mesh);
				mesh = [];
			}
		}
	});
	if (mesh.length) model.push(mesh);

	return model;
}

function parse_mtl(text) {
	const colors = {};
	let currentMat = null;

	for (const line of text.split('\n')) {
		const parts = line.trim().split(/\s+/);
		if (parts[0] === 'newmtl') {
			currentMat = parts[1];
		} else if (parts[0] === 'Kd' && currentMat) {
			colors[currentMat] = {
				r: parseFloat(parts[1]),
				g: parseFloat(parts[2]),
				b: parseFloat(parts[3]),
			};
		}
	}

	return colors;
}

function get_material_color(material, mtl_colors) {
	const mat = Array.isArray(material) ? material[0] : material;
	if (mat?.name && mtl_colors?.[mat.name]) return mtl_colors[mat.name];
	const c = mat?.color;
	if (c) return { r: c.r, g: c.g, b: c.b };
	return { r: 1, g: 1, b: 1 };
}

function scale_to_unit(nodes) {
	if (!nodes.length) return nodes;

	let minX = Infinity,
		maxX = -Infinity;
	let minY = Infinity,
		maxY = -Infinity;
	let minZ = Infinity,
		maxZ = -Infinity;

	for (const n of nodes) {
		const p = n.position;
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
		if (p.z < minZ) minZ = p.z;
		if (p.z > maxZ) maxZ = p.z;
	}

	const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
	if (maxDim < 1e-8) return nodes;

	const s = 1 / maxDim;
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	const cz = (minZ + maxZ) / 2;

	return nodes.map((n) => ({
		...n,
		position: {
			x: (n.position.x - cx) * s,
			y: (n.position.y - cy) * s,
			z: (n.position.z - cz) * s,
		},
		scale: {
			x: n.scale.x * s,
			y: n.scale.y * s,
			z: n.scale.z * s,
		},
	}));
}

async function parse_obj_nodes(obj_file, mtl_colors) {
	const text = await obj_file.text();
	const loader = new OBJLoader();
	const object = loader.parse(text);
	const nodes = [];

	object.traverse((child) => {
		if (!child.isMesh) return;

		const posAttr = child.geometry.toNonIndexed().attributes.position;
		const groups = child.geometry.groups || [
			{ start: 0, count: posAttr.count, materialIndex: 0 },
		];

		for (const group of groups) {
			const material = Array.isArray(child.material)
				? child.material[group.materialIndex]
				: child.material;
			const color1 = get_material_color(material, mtl_colors);

			for (let i = group.start; i < group.start + group.count; i += 3) {
				const A = new THREE.Vector3().fromBufferAttribute(posAttr, i);
				const B = new THREE.Vector3().fromBufferAttribute(
					posAttr,
					i + 1,
				);
				const C = new THREE.Vector3().fromBufferAttribute(
					posAttr,
					i + 2,
				);

				const axisX = new THREE.Vector3().subVectors(B, A).normalize();
				const norm = new THREE.Vector3()
					.crossVectors(axisX, new THREE.Vector3().subVectors(C, A))
					.normalize();
				const axisY = new THREE.Vector3().crossVectors(norm, axisX);

				const to_2D = (p) => {
					const r = new THREE.Vector3().subVectors(p, A);
					return {
						x: r.dot(axisX),
						y: r.dot(axisY),
					};
				};
				const to_3D = (p) => {
					return new THREE.Vector3()
						.addScaledVector(axisX, p.x)
						.addScaledVector(axisY, p.y)
						.add(A);
				};

				const tris2D = partition_into_isosceles([
					to_2D(A),
					to_2D(B),
					to_2D(C),
				]);

				tris2D.forEach((tri) => {
					const node = tri_to_node(
						to_3D(tri[0]),
						to_3D(tri[1]),
						to_3D(tri[2]),
					);
					if (node) nodes.push({ ...node, color1 });
				});
			}
		}
	});

	return nodes;
}

export default {
	obj,
};
