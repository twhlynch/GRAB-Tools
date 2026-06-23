// MARK: 2D triangle partitioning

interface Vec2 { x: number; y: number; }

function dist(p: Vec2, q: Vec2) {
	return Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
}

function is_acute(a: Vec2, b: Vec2, c: Vec2) {
	const sides = [dist(a,b), dist(b,c), dist(a,c)]
		.map(x => x * x)
		.sort((x, y) => x - y);

	return sides[0]! + sides[1]! > sides[2]!;
}

function circumcenter(a: Vec2, b: Vec2, c: Vec2) {
	const D = 2 * (
		a.x * (b.y - c.y) +
		b.x * (c.y - a.y) +
		c.x * (a.y - b.y)
	);

	// degenerate
	if (Math.abs(D) < 1e-8) return null;

	const ux = (
		(a.x ** 2 + a.y ** 2) * (b.y - c.y) +
		(b.x ** 2 + b.y ** 2) * (c.y - a.y) +
		(c.x ** 2 + c.y ** 2) * (a.y - b.y)
	) / D;
	const uy = (
		(a.x ** 2 + a.y ** 2) * (c.x - b.x) +
		(b.x ** 2 + b.y ** 2) * (a.x - c.x) +
		(c.x ** 2 + c.y ** 2) * (b.x - a.x)
	) / D;

	return { x: ux, y: uy };
}

function altitude_foot(P: Vec2, Q: Vec2, R: Vec2) {
	const dx = R.x - Q.x,
		  dy = R.y - Q.y;
	const t = (
		(P.x - Q.x) * dx +
		(P.y - Q.y) * dy
	) / (dx * dx + dy * dy);

	return {
		x: Q.x + t * dx,
		y: Q.y + t * dy
	};
}

function midpoint(p: Vec2, q: Vec2) {
	return {
		x: (p.x + q.x) / 2,
		y: (p.y + q.y) / 2
	};
}

function dot(a: Vec2, b: Vec2, c: Vec2) {
	return (b.x - a.x) * (c.x - a.x) + (b.y - a.y) * (c.y - a.y);
}

function obtuse_vertex_index(pts: [Vec2, Vec2, Vec2]) {
	const [a, b, c] = pts;

	if (dot(b, a, c) < 0) return 1;
	else if (dot(c, a, b) < 0) return 2;
	return 0;

	// for (let i = 0; i < 3; i++) {
	// 	const a = pts[i]!,
	// 		  b = pts[(i + 1) % 3]!,
	// 		  c = pts[(i + 2) % 3]!;
	// 	const ab = { x: b.x - a.x, y: b.y - a.y };
	// 	const ac = { x: c.x - a.x, y: c.y - a.y };
	//
	// 	if (ab.x * ac.x + ab.y * ac.y < 0) return i;
	// }
	// return -1;
}

// Input: pts = [A, B, C] as {x, y} objects
// Output: array of sub-triangles, each as [p1, p2, p3]
export function partition_into_isosceles(pts: [Vec2, Vec2, Vec2]) {
	const [A, B, C] = pts;

	if (is_acute(A, B, C)) {
		// Acute: 3 isosceles triangles via circumcenter
		const O = circumcenter(A, B, C);
		if (O === null) return [[A, B, C]];

		return [
			[O, A, B],
			[O, B, C],
			[O, C, A],
		];
	} else {
		// Obtuse: 4 isosceles triangles via altitude foot + hypotenuse midpoints
		const oi = obtuse_vertex_index(pts);
		const Cv = pts[oi];
		const Av = pts[(oi + 1) % 3]!;
		const Bv = pts[(oi + 2) % 3]!;
		const H  = altitude_foot(Cv, Av, Bv);
		const M1 = midpoint(Cv, Av);
		const M2 = midpoint(Cv, Bv);
		return [
			[M1, Cv, H],
			[M1, H,  Av],
			[M2, Cv, H],
			[M2, H,  Bv],
		];
	}
}

// MARK: Level node triangle building

import * as THREE from 'three';

interface Vec3 { x: number; y: number; z: number; }
interface Vec4 { x: number; y: number; z: number; w: number; }

// transform of LevelNodeStatic
export interface TriNode {
	position: Vec3;
	rotation: Vec4;
	scale: Vec3;
}

/*
 * prism model (X, Z) plane
 * after applying rotateY(PI)
 *
 *               (0, 0.5)
 *                  /\
 *                 /  \
 *                /    \
 *               /      \
 *              /        \
 *             /__________\
 *  (-0.433, -0.25)    (0.433, -0.25)
 *
 * base width  = 0.866
 * apex height = 0.75
 */
const PRISM_BASE = 0.866;
const PRISM_HEIGHT = 0.75;

function find_apex(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): {
	apex: THREE.Vector3; base1: THREE.Vector3; base2: THREE.Vector3;
} {
	const d12 = p1.distanceTo(p2);
	const d23 = p2.distanceTo(p3);
	const d31 = p3.distanceTo(p1);

	const eps = Math.max(d12, d23, d31) * 1e-8;

	// if two edges have equal length, the vertex between them is the apex
	if (Math.abs(d12 - d31) < eps) return { apex: p1, base1: p2, base2: p3 };
	if (Math.abs(d12 - d23) < eps) return { apex: p2, base1: p1, base2: p3 };
	if (Math.abs(d23 - d31) < eps) return { apex: p3, base1: p1, base2: p2 };

	// else the apex is the vertex opposite the longest edge
	if (d12 >= d23 && d12 >= d31) return { apex: p3, base1: p1, base2: p2 };
	if (d23 >= d12 && d23 >= d31) return { apex: p1, base1: p2, base2: p3 };
	return { apex: p2, base1: p3, base2: p1 };
}

export function tri_to_node(
	p1: THREE.Vector3,
	p2: THREE.Vector3,
	p3: THREE.Vector3,
): TriNode | null {
	const { apex, base1, base2 } = find_apex(p1, p2, p3);

	const base_mid   = new THREE.Vector3().addVectors(base1, base2).multiplyScalar(0.5);
	const height_vec = new THREE.Vector3().subVectors(apex, base_mid);
	const base_vec   = new THREE.Vector3().subVectors(base2, base1);

	const base_len   = base_vec.length();
	const height_len = height_vec.length();

	// too small
	if (base_len < 1e-8 || height_len < 1e-8) return null;

	const base_dir   = base_vec.clone().normalize();
	const height_dir = height_vec.clone().normalize();
	const normal    = new THREE.Vector3().crossVectors(height_dir, base_dir).normalize();

	// centroid of the triangle
	const position = new THREE.Vector3().addVectors(base_mid, height_vec.clone().multiplyScalar(1 / 3));

	// column major rotation matrix
	const rot_matrix = new THREE.Matrix4();
	// X: normalised base direction (base1 -> base2)
	// Z: normalised height direction (base midpoint -> apex)
	// Y: cross product of the other two (right handed orthonormal)
	rot_matrix.set(
		base_dir.x, normal.x, height_dir.x, 0,
		base_dir.y, normal.y, height_dir.y, 0,
		base_dir.z, normal.z, height_dir.z, 0,
		0, 0, 0, 1,
	);
	const quaternion = new THREE.Quaternion().setFromRotationMatrix(rot_matrix);

	return {
		position: { x: position.x, y: position.y, z: position.z },
		rotation: {
			x: quaternion.x,
			y: quaternion.y,
			z: quaternion.z,
			w: quaternion.w,
		},
		scale: {
			x: base_len / PRISM_BASE,
			y: 0.001, // flatten to 2D
			z: height_len / PRISM_HEIGHT,
		},
	};
}
