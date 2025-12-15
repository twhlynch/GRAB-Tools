import { Vector3 } from 'three/src/math/Vector3';
import { Quaternion } from 'three/src/math/Quaternion';

/**
 * @param {File} file - An svg file
 * @param {Number} complexity - Complexity of output
 * @returns {Promise<Array<Object>>} - A list of level nodes
 */
async function svg(file, complexity) {
	const text = await file.text();

	const parser = new DOMParser();
	const doc = parser.parseFromString(text, 'image/svg+xml');

	const paths = Array.from(doc.querySelectorAll('path'));

	let nodes = [];
	paths.forEach((element) => {
		const width = parseFloat(element.getAttribute('stroke-width') || '1.0');
		const color = parse_color(element.getAttribute('stroke') || 'black');
		const d = element.getAttribute('d');

		nodes.push(...path(d, width, color, complexity));
	});

	return nodes;
}

function parse_color(color) {
	const ctx = document
		.createElement('canvas')
		.getContext('2d', { willReadFrequently: true });
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const data = ctx.getImageData(0, 0, 1, 1).data;
	return {
		r: data[0] / 255,
		g: data[1] / 255,
		b: data[2] / 255,
		a: data[3] / 255,
	};
}

/**
 * @param {String} d - An svg path
 * @returns {Array<Object>} - A list of level nodes
 */
function path(d, width, color, complexity) {
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', d);

	const length = path.getTotalLength();
	if (length === 0) return [];

	const points = [];
	for (let i = 0; i <= complexity; i++) {
		const pt = path.getPointAtLength((i / complexity) * length);
		points.push(new Vector3(pt.x, -pt.y, 0));
	}

	const cubes = [];
	for (let i = 1; i < points.length; i++) {
		const p1 = points[i - 1];
		const p2 = points[i];

		const mid = new Vector3().addVectors(p1, p2).multiplyScalar(0.5);
		const dir = new Vector3().subVectors(p2, p1);
		const len = dir.length();
		dir.normalize();

		const quat = new Quaternion();
		quat.setFromUnitVectors(new Vector3(0, 0, 1), dir);

		cubes.push({
			levelNodeStatic: {
				shape: 1000,
				material: 8,
				color1: color,
				isNeon: true,
				position: { x: mid.x, y: mid.y, z: mid.z },
				scale: { x: width, y: width, z: len },
				rotation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
			},
		});
	}

	return cubes;
}

export default {
	svg,
};
