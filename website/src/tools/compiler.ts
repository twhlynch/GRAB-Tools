import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import { levelNodeData, LevelNodeWith } from '@grab-tools/lib/generated/nodes';
import { LevelNode, LevelNodeGroup } from '@grab-tools/lib/generated/proto';

function traverseNode(
	node: LevelNode,
	func: (
		node: LevelNode,
		parent: LevelNodeWith<LevelNodeGroup> | null,
	) => void,
	parent: LevelNodeWith<LevelNodeGroup> | null = null,
) {
	func(node, parent);
	if (node.levelNodeGroup?.childNodes) {
		node.levelNodeGroup.childNodes.forEach((child) => {
			traverseNode(child, func, node as LevelNodeWith<LevelNodeGroup>);
		});
	}
}

export function count_nodes(nodes: LevelNode[]) {
	const counts: Record<string, number> & { total: number } = {
		total: 0,
	};
	for (const node of nodes) {
		traverseNode(node, (_node, _parent) => {
			counts.total++;
			const type = Object.keys(_node).find((key) =>
				key.startsWith('levelNode'),
			);
			if (type) {
				counts[type] = (counts[type] ?? 0) + 1;
			}
		});
	}
	return counts;
}

const update_id_params: Record<string, string[]> = {
	triggerTargetAnimation: ['objectID'],
	triggerTargetSound: ['objectID'],
	triggerTargetGASM: ['objectID'],
	triggerTargetLight: ['objectID'],
	connections: ['objectID'],
};

export function remap_ids(nodes: LevelNode[], remap: (id: number) => number) {
	const objects: object[] = [...nodes];

	while (objects.length > 0) {
		const current = [...objects];
		objects.length = 0;

		for (const object of current) {
			for (const [key, value] of Object.entries(object)) {
				// offset all ids
				if (key in update_id_params) {
					const keys = update_id_params[key] ?? [];
					for (const k of keys) {
						// update value in all of an array
						if (Array.isArray(value)) {
							for (const v of value) {
								// must convert v[k] from Long to Number so it doesnt become a string
								const record = v as Record<string, unknown>;
								const old_id = Number(record[k] ?? 0);
								record[k] = remap(old_id);
							}
						}
						// update value in an object
						else if (typeof value === 'object' && value !== null) {
							const record = value as Record<string, unknown>;
							const old_id = Number(record[k] ?? 0);
							record[k] = remap(old_id);
						}
					}
				}

				// traverse subobjects
				if (typeof value == 'object' && value !== null) {
					objects.push(value as Record<string, unknown>);
				}
			}
		}
	}
}

export function offset_ids(nodes: LevelNode[], offset: number) {
	remap_ids(nodes, (id) => id + offset);
}

export interface CompileOptions {
	group?: boolean;
	spacing?: number;
}

export function compile(level_nodes: LevelNode[][], options: CompileOptions) {
	const result: LevelNode[] = [];

	for (const [i, nodes] of level_nodes.entries()) {
		// group and offset by 1
		if (options.group) {
			// filter out start/finish and map old node IDs to new node IDs
			const id_map = new Map<number, number>();
			let old_id = 1;
			let new_id = 2; // start at 2 since the parent group will occupy ID 1

			for (const node of nodes) {
				if (node.levelNodeStart || node.levelNodeFinish) {
					traverseNode(node, () => {
						old_id++;
					});
				} else {
					traverseNode(node, () => {
						id_map.set(old_id, new_id);
						old_id++;
						new_id++;
					});
				}
			}

			remap_ids(nodes, (id) => id_map.get(id) ?? id);

			const filtered = nodes.filter(
				(node) => !node.levelNodeStart && !node.levelNodeFinish,
			);
			const group = levelNodeGroupFrom({
				childNodes: filtered,
			});
			nodes.length = 0;
			nodes.push(group);
		}

		// offset by previous nodes
		const count = count_nodes(result);
		offset_ids(nodes, count.total);

		// shift positions
		if (options.spacing) {
			for (const node of nodes) {
				const data = levelNodeData(node);
				(data.position ??= {}).x =
					(data.position.x ?? 0) + options.spacing * i;
			}
		}

		result.push(...nodes);
	}

	return result;
}
