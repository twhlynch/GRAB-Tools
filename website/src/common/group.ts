import {
	isLevelNode,
	levelNodeData,
	LevelNodeTypesExcept,
	LevelNodeWith,
} from '@grab-tools/lib/generated/nodes';
import {
	LevelNode,
	LevelNodeFinish,
	LevelNodeGroup,
	LevelNodeLobbyTerminal,
	LevelNodeStart,
} from '@grab-tools/lib/generated/proto';
import { Quaternion, Vector3 } from 'three';
import { append } from './utils';

export function ungroupNode(group: LevelNodeWith<LevelNodeGroup>): LevelNode[] {
	const group_position = new Vector3(
		group.levelNodeGroup.position?.x ?? 0,
		group.levelNodeGroup.position?.y ?? 0,
		group.levelNodeGroup.position?.z ?? 0,
	);
	const group_quaternion = new Quaternion(
		group.levelNodeGroup.rotation?.x ?? 0,
		group.levelNodeGroup.rotation?.y ?? 0,
		group.levelNodeGroup.rotation?.z ?? 0,
		group.levelNodeGroup.rotation?.w ?? 0,
	);
	const group_scale = new Vector3(
		group.levelNodeGroup.scale?.x ?? 0,
		group.levelNodeGroup.scale?.y ?? 0,
		group.levelNodeGroup.scale?.z ?? 0,
	);

	const child_nodes = group.levelNodeGroup.childNodes ?? [];

	child_nodes.forEach((node) => {
		if (!isLevelNode(node)) return;
		if (isLevelNode(node, 'levelNodeStart')) return;
		if (isLevelNode(node, 'levelNodeFinish')) return;

		const data =
			levelNodeData<
				LevelNodeTypesExcept<
					[LevelNodeStart, LevelNodeFinish, LevelNodeLobbyTerminal]
				>
			>(node);

		const position = new Vector3(
			data.position?.x ?? 0,
			data.position?.y ?? 0,
			data.position?.z ?? 0,
		);
		const quaternion = new Quaternion(
			data.rotation?.x ?? 0,
			data.rotation?.y ?? 0,
			data.rotation?.z ?? 0,
			data.rotation?.w ?? 0,
		);
		const scale = new Vector3(
			'scale' in data
				? typeof data.scale === 'number'
					? data.scale
					: (data.scale?.x ?? 0)
				: 0,
			'scale' in data
				? typeof data.scale === 'number'
					? data.scale
					: (data.scale?.y ?? 0)
				: 0,
			'scale' in data
				? typeof data.scale === 'number'
					? data.scale
					: (data.scale?.z ?? 0)
				: 0,
		);

		scale.multiply(group_scale);
		quaternion.premultiply(group_quaternion);
		position
			.multiply(group_scale)
			.applyQuaternion(group_quaternion)
			.add(group_position);

		if (data.position) {
			data.position.x = position.x;
			data.position.y = position.y;
			data.position.z = position.z;
		}
		if (data.rotation) {
			data.rotation.x = quaternion.x;
			data.rotation.y = quaternion.y;
			data.rotation.z = quaternion.z;
			data.rotation.w = quaternion.w;
		}
		if ('scale' in data && data.scale && typeof data.scale === 'object') {
			data.scale.x = scale.x;
			data.scale.y = scale.y;
			data.scale.z = scale.z;
		}
		if ('scale' in data && data.scale && typeof data.scale === 'number') {
			data.scale = scale.x;
		}
		if ('radius' in data && data.radius) {
			data.radius = scale.x / 2;
		}
	});

	return child_nodes;
}

export function recursiveUngroup(nodes?: LevelNode[]): LevelNode[] {
	if (!nodes || nodes.length === 0) return [];

	let index = nodes.findIndex((node) => isLevelNode(node, 'levelNodeGroup'));
	while (index !== -1) {
		const [node] = nodes.splice(index, 1);

		if (node && isLevelNode(node, 'levelNodeGroup')) {
			append(nodes, ungroupNode(node));
		}

		index = nodes.findIndex((levelnode) =>
			isLevelNode(levelnode, 'levelNodeGroup'),
		);
	}

	return nodes;
}
