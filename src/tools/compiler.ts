import { levelNodeGroupFrom } from '@/common/group';
import { LevelNodeWith } from '@/common/levelNodes';
import { node_data } from '@/common/utils';
import { LevelNode, LevelNodeGroup } from '@/generated/proto';

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
			const type = Object.keys(node).find((key) =>
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

export function offset_ids(nodes: LevelNode[], offset: number) {
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
								v[k] = Number(v[k] ?? 0) + offset;
							}
						}
						// update value in an object
						else if (typeof value === 'object' && value !== null) {
							value[k] = Number(value[k] ?? 0) + offset;
						}
					}
				}

				// traverse subobjects
				if (typeof value == 'object' && value !== null) {
					objects.push(value);
				}
			}
		}
	}
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
			offset_ids(nodes, 1);

			// filter out start/finish
			const remove = [];
			// only top level should exist
			for (const [j, node] of nodes.entries()) {
				if (node.levelNodeStart || node.levelNodeFinish) {
					remove.push(j);
				}
				offset_ids([node], -remove.length);
			}

			const group = levelNodeGroupFrom({ childNodes: nodes });
			nodes.length = 0;
			nodes.push(group);
		}

		// offset by previous nodes
		const count = count_nodes(result);
		offset_ids(nodes, count.total);

		// shift positions
		if (options.spacing) {
			for (const node of nodes) {
				const data = node_data(node);
				(data.position ??= {}).x =
					(data.position.x ?? 0) + options.spacing * i;
			}
		}

		result.push(...nodes);
	}

	return result;
}
