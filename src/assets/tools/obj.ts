import { animation, animationFrame, color } from '@/generated/helpers';
import {
	levelNodeWithParticleEmitter,
	levelNodeWithStatic,
} from '@/generated/nodes';
import {
	Color,
	LevelNode,
	LevelNodeMaterial,
	LevelNodeParticleEmitter,
	LevelNodeShape,
	LevelNodeStatic,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
	partition_into_isosceles,
	tri_to_node,
	TriNode,
} from './triangle_partition';

type Mode = 'spheres' | 'particles' | 'triangles';

export async function obj(
	obj_file: File,
	mode: Mode,
	mtl_file?: File,
): Promise<LevelNode[]> {
	if (mode === 'triangles') {
		return await build_model(obj_file, mtl_file);
	}

	if (mode === 'particles') {
		return await build_particle_model(obj_file, mtl_file);
	}

	if (mode === 'spheres') {
		return await build_point_cloud(obj_file);
	}

	return [];
}

async function build_model(obj_file: File, mtl_file?: File) {
	const mtl_colors = mtl_file ? parse_mtl(await mtl_file.text()) : null;
	const nodes = scale_to_unit(await parse_obj_nodes(obj_file, mtl_colors));
	return nodes.map((node) =>
		levelNodeWithStatic({
			...node,
			shape: LevelNodeShape.PRISM,
			material: LevelNodeMaterial.DEFAULT_COLORED,
		}),
	);
}

async function build_particle_model(file: File, mtl_file?: File) {
	const text = await file.text();
	const mtl_colors = mtl_file ? parse_mtl(await mtl_file.text()) : null;
	const model = obj_vertices(text);

	const nodes: LevelNodeWith<LevelNodeParticleEmitter>[] = [];

	for (const mesh of model) {
		const particle_color = mtl_colors
			? mtl_colors[mesh.material ?? ''] ?? { r: 1, g: 1, b: 1 }
			: { r: Math.random(), g: Math.random(), b: Math.random() };
		const c = color(particle_color);
		const size = { x: 0.1, y: 0.1 };
		const zero_vec = { x: 0, y: 0, z: 0 };
		const node = levelNodeWithParticleEmitter({
			scale: { x: 0.01, y: 0.01, z: 0.01 },
			particlesPerSecond: 999,
			lifeSpan: { x: 5, y: 5 },
			startColor: c,
			endColor: c,
			startSize: size,
			endSize: size,
			velocity: zero_vec,
			velocityMin: zero_vec,
			velocityMax: zero_vec,
			accelerationMin: zero_vec,
			accelerationMax: zero_vec,
		});
		node.animations = [
			animation({
				frames: mesh.vertices.map((p, i) => {
					return animationFrame({
						time: i * (1 / mesh.vertices.length),
						position: { x: p[0], y: p[1], z: p[2] },
					});
				}),
			}),
		];
		nodes.push(node);
	}
	return nodes;
}

async function build_point_cloud(file: File) {
	const text = await file.text();
	const model = obj_vertices(text);

	const nodes: LevelNodeWith<LevelNodeStatic>[] = [];

	for (const vert of model.flatMap((m) => m.vertices)) {
		const node = levelNodeWithStatic({
			material: LevelNodeMaterial.DEFAULT_COLORED,
			shape: LevelNodeShape.SPHERE,
			position: { x: vert[0], y: vert[1], z: vert[2] },
			color1: color({ r: 1, g: 1, b: 1 }),
			scale: { x: 1, y: 1, z: 1 },
		});
		nodes.push(node);
	}

	return nodes;
}

function obj_vertices(text: string) {
	const lines = text.split('\n');

	const model: { vertices: number[][]; material?: string }[] = [];
	let mesh: number[][] = [];
	let currentMaterial: string | undefined;

	for (const line of lines) {
		if (line.startsWith('usemtl ')) {
			currentMaterial = line.slice(7).trim();
		}
		if (line.startsWith('v ')) {
			mesh.push(line.slice(2).trim().split(/\s+/).map(Number));
		} else if (line.startsWith('usemtl ') || line.startsWith('o ')) {
			if (mesh.length) {
				model.push({ vertices: mesh, material: currentMaterial });
				mesh = [];
			}
		}
	}

	if (mesh.length) model.push({ vertices: mesh, material: currentMaterial });

	return model;
}

function parse_mtl(text: string) {
	const colors: Record<string, Color> = {};
	let currentMat: string | null = null;

	for (const line of text.split('\n')) {
		const parts = line.trim().split(/\s+/);

		if (parts[0] === 'newmtl') {
			currentMat = parts[1]!;
		} else if (parts[0] === 'Kd' && currentMat) {
			colors[currentMat] = {
				r: Number(parts[1] ?? 0),
				g: Number(parts[2] ?? 0),
				b: Number(parts[3] ?? 0),
			};
		}
	}

	return colors;
}

function get_material_color(
	material: THREE.Material | THREE.Material[],
	mtl_colors: Record<string, Color> | null,
) {
	const mat = Array.isArray(material) ? material[0] : material;

	if (mat?.name && mtl_colors?.[mat.name]) {
		return mtl_colors[mat.name]!;
	}

	const c = (mat as THREE.MeshStandardMaterial | undefined)?.color;
	if (c) return { r: c.r, g: c.g, b: c.b };

	return { r: 1, g: 1, b: 1 };
}

function scale_to_unit(nodes: TriNode[]) {
	if (!nodes.length) return nodes;

	let minX = Infinity,
		maxX = -Infinity;
	let minY = Infinity,
		maxY = -Infinity;
	let minZ = Infinity,
		maxZ = -Infinity;

	for (const n of nodes) {
		const p = n.position;
		minX = Math.min(minX, p.x);
		maxX = Math.max(maxX, p.x);
		minY = Math.min(minY, p.y);
		maxY = Math.max(maxY, p.y);
		minZ = Math.min(minZ, p.z);
		maxZ = Math.max(maxZ, p.z);
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

async function parse_obj_nodes(
	obj_file: File,
	mtl_colors: Record<string, Color> | null,
) {
	const text = await obj_file.text();
	const loader = new OBJLoader();
	const object = loader.parse(text);
	const nodes: (TriNode & { color1: Color })[] = [];

	const is_mesh = (o: THREE.Object3D): o is THREE.Mesh =>
		(o as THREE.Mesh).isMesh === true;

	object.traverse((child) => {
		if (!is_mesh(child)) return;

		const geometry = child.geometry;
		const posAttr = geometry
			.toNonIndexed()
			.getAttribute('position') as THREE.BufferAttribute;
		const groups = geometry.groups.length
			? geometry.groups
			: [{ start: 0, count: posAttr.count, materialIndex: 0 }];

		for (const group of groups) {
			const material = Array.isArray(child.material)
				? child.material[group.materialIndex ?? 0]!
				: child.material!;
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

				const to_2D = (p: THREE.Vector3) => {
					const r = new THREE.Vector3().subVectors(p, A);
					return {
						x: r.dot(axisX),
						y: r.dot(axisY),
					};
				};
				const to_3D = (p: THREE.Vector2Like) => {
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

				for (const tri of tris2D) {
					const node = tri_to_node(
						to_3D(tri[0]!),
						to_3D(tri[1]!),
						to_3D(tri[2]!),
					);
					if (node) nodes.push({ ...node, color1 });
				}
			}
		}
	});

	return nodes;
}
