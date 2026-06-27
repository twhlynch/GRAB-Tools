import { LevelNodeWith } from '@/common/levelNodes';
import { color, vector } from '@/generated/helpers';
import { levelNodeWithStatic } from '@/generated/nodes';
import {
	Color,
	LevelNode,
	LevelNodeShape,
	LevelNodeStatic,
	Vector,
} from '@/generated/proto';

// keys for maps
function pos_key(p: Vector): string {
	return `${p.x ?? 0},${p.y ?? 0},${p.z ?? 0}`;
}
function color_key(c: Color): string {
	return `${c.r ?? 0},${c.g ?? 0},${c.b ?? 0}`;
}

export function greedy_mesh(nodes: LevelNode[]): LevelNode[] {
	const cube_nodes: LevelNodeWith<LevelNodeStatic>[] = [];
	const other_nodes: LevelNode[] = [];

	// separate non cubes
	for (const node of nodes) {
		if (node.levelNodeStatic?.shape === LevelNodeShape.CUBE) {
			cube_nodes.push(node as LevelNodeWith<LevelNodeStatic>);
		} else {
			other_nodes.push(node);
		}
	}

	if (cube_nodes.length === 0) return nodes;

	// map color key to nodes
	const color_groups = new Map<string, LevelNodeWith<LevelNodeStatic>[]>();
	for (const node of cube_nodes) {
		const key = color_key(node.levelNodeStatic.color1 ?? color());

		if (!color_groups.has(key)) color_groups.set(key, []);
		color_groups.get(key)!.push(node);
	}

	// results
	const merged: LevelNodeWith<LevelNodeStatic>[] = [];

	for (const [, group] of color_groups) {
		const positions = new Set<string>();
		const visited = new Set<string>();
		const template = group[0]!; // template for scaled node

		// populate positions
		for (const node of group) {
			const p = node.levelNodeStatic.position ?? vector();
			positions.add(pos_key(p));
		}

		// actual greedy meshing
		for (const node of group) {
			const seed = node.levelNodeStatic.position ?? vector();
			const sk = pos_key(seed);
			if (visited.has(sk)) continue;

			const sx = seed.x ?? 0;
			const sy = seed.y ?? 0;
			const sz = seed.z ?? 0;

			let minX = sx,
				maxX = sx,
				minY = sy,
				maxY = sy,
				minZ = sz,
				maxZ = sz;

			// X
			while (
				positions.has(pos_key({ x: maxX + 1, y: sy, z: sz })) &&
				!visited.has(pos_key({ x: maxX + 1, y: sy, z: sz }))
			) {
				maxX++;
			}
			while (
				positions.has(pos_key({ x: minX - 1, y: sy, z: sz })) &&
				!visited.has(pos_key({ x: minX - 1, y: sy, z: sz }))
			) {
				minX--;
			}

			// Y
			for (let y = sy + 1; ; y++) {
				let ok = true;
				for (let x = minX; x <= maxX; x++) {
					if (
						!positions.has(pos_key({ x, y, z: sz })) ||
						visited.has(pos_key({ x, y, z: sz }))
					) {
						ok = false;
						break;
					}
				}
				if (ok) maxY = y;
				else break;
			}
			for (let y = sy - 1; ; y--) {
				let ok = true;
				for (let x = minX; x <= maxX; x++) {
					if (
						!positions.has(pos_key({ x, y, z: sz })) ||
						visited.has(pos_key({ x, y, z: sz }))
					) {
						ok = false;
						break;
					}
				}
				if (ok) minY = y;
				else break;
			}

			// Z
			for (let z = sz + 1; ; z++) {
				let ok = true;
				for (let y = minY; y <= maxY; y++) {
					for (let x = minX; x <= maxX; x++) {
						if (
							!positions.has(pos_key({ x, y, z })) ||
							visited.has(pos_key({ x, y, z }))
						) {
							ok = false;
							break;
						}
					}
					if (!ok) break;
				}
				if (ok) maxZ = z;
				else break;
			}
			for (let z = sz - 1; ; z--) {
				let ok = true;
				for (let y = minY; y <= maxY; y++) {
					for (let x = minX; x <= maxX; x++) {
						if (
							!positions.has(pos_key({ x, y, z })) ||
							visited.has(pos_key({ x, y, z }))
						) {
							ok = false;
							break;
						}
					}
					if (!ok) break;
				}
				if (ok) minZ = z;
				else break;
			}

			// visit all covered cells
			for (let z = minZ; z <= maxZ; z++) {
				for (let y = minY; y <= maxY; y++) {
					for (let x = minX; x <= maxX; x++) {
						visited.add(pos_key({ x, y, z }));
					}
				}
			}

			// scaled node
			merged.push(
				levelNodeWithStatic({
					...template.levelNodeStatic,
					shape: LevelNodeShape.CUBE,
					position: {
						x: (minX + maxX) / 2,
						y: (minY + maxY) / 2,
						z: (minZ + maxZ) / 2,
					},
					scale: {
						x: maxX - minX + 1,
						y: maxY - minY + 1,
						z: maxZ - minZ + 1,
					},
				}),
			);
		}
	}

	return [...merged, ...other_nodes];
}
