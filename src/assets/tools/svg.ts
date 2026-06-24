import { levelNodeWithStatic } from '@/generated/nodes';
import {
	Color,
	LevelNodeMaterial,
	LevelNodeShape,
	LevelNodeStatic,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';
import * as THREE from 'three';

async function svg(file: File, complexity: number) {
	const text = await file.text();

	const parser = new DOMParser();
	const doc = parser.parseFromString(text, 'image/svg+xml');

	const paths = Array.from(doc.querySelectorAll('path'));

	const nodes: LevelNodeWith<LevelNodeStatic>[] = [];

	for (const element of paths) {
		const width = parseFloat(element.getAttribute('stroke-width') || '1.0');
		const color = parse_color(element.getAttribute('stroke') || 'black');
		const d = element.getAttribute('d');
		if (!d) return null;

		nodes.push(...build_path(d, width, color, complexity));
	}

	return nodes;
}

function parse_color(color: string) {
	const ctx = document
		.createElement('canvas')
		.getContext('2d', { willReadFrequently: true });
	if (!ctx) return { r: 0, g: 0, b: 0, a: 1 };
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const data = ctx.getImageData(0, 0, 1, 1).data;
	return {
		r: data[0]! / 255,
		g: data[1]! / 255,
		b: data[2]! / 255,
		a: data[3]! / 255,
	};
}

function build_path(
	d: string,
	width: number,
	color: Color,
	complexity: number,
) {
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', d);

	const length = path.getTotalLength();
	if (length === 0) return [];

	const points = [];
	for (let i = 0; i <= complexity; i++) {
		const pt = path.getPointAtLength((i / complexity) * length);
		points.push(new THREE.Vector3(pt.x, -pt.y, 0));
	}

	const cubes = [];
	for (let i = 1; i < points.length; i++) {
		const p1 = points[i - 1]!;
		const p2 = points[i]!;

		const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
		const dir = new THREE.Vector3().subVectors(p2, p1);
		const len = dir.length();
		dir.normalize();

		const quat = new THREE.Quaternion();
		quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

		cubes.push(
			levelNodeWithStatic({
				shape: LevelNodeShape.CUBE,
				material: LevelNodeMaterial.DEFAULT_COLORED,
				color1: color,
				isNeon: true,
				position: { x: mid.x, y: mid.y, z: mid.z },
				scale: { x: width, y: width, z: len },
				rotation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
			}),
		);
	}

	return cubes;
}

export default {
	svg,
};
