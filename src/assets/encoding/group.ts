import { levelNodeWithGroup } from '@/assets/encoding/level_nodes';
import {
	LevelNode,
	LevelNodeFinish,
	LevelNodeGroup,
	LevelNodeLobbyTerminal,
	LevelNodeStart,
} from '@/generated/proto';
import {
	isLevelNode,
	LevelNodeTypesExcepts,
	LevelNodeWith,
} from '@/types/levelNodes';
import { Box3 } from 'three/src/math/Box3.js';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import { node_data } from './utils';

export function groupNodes(
	nodes: Array<LevelNode>,
): LevelNodeWith<LevelNodeGroup> {
	const positions = nodes.map((node) => {
		const data = node_data(node);

		return new Vector3(
			data.position?.x ?? 0,
			data.position?.y ?? 0,
			data.position?.z ?? 0,
		);
	});

	const box = new Box3().setFromPoints(positions);
	const center = new Vector3();
	box.getCenter(center);

	nodes.forEach((node) => {
		const data = node_data(node);

		data.position ??= {};
		data.position.x = (data.position.x ?? 0) - center.x;
		data.position.y = (data.position.y ?? 0) - center.y;
		data.position.z = (data.position.z ?? 0) - center.z;
	});

	const group = levelNodeWithGroup();
	group.levelNodeGroup.position = { x: center.x, y: center.y, z: center.z };
	group.levelNodeGroup.childNodes = nodes;
	return group;
}

export function ungroupNode(
	group: LevelNodeWith<LevelNodeGroup>,
): Array<LevelNode> {
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
		if (isLevelNode<LevelNodeStart>(node, 'levelNodeStart')) return;
		if (isLevelNode<LevelNodeFinish>(node, 'levelNodeFinish')) return;

		const data = node_data(node) as LevelNodeTypesExcepts<
			[LevelNodeStart, LevelNodeFinish, LevelNodeLobbyTerminal]
		>;

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
					: data.scale?.x ?? 0
				: 0,
			'scale' in data
				? typeof data.scale === 'number'
					? data.scale
					: data.scale?.y ?? 0
				: 0,
			'scale' in data
				? typeof data.scale === 'number'
					? data.scale
					: data.scale?.z ?? 0
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

export function recursiveUngroup(nodes: Array<LevelNode>): Array<LevelNode> {
	if (!nodes || nodes.length === 0) return [];

	let index = nodes.findIndex((node) =>
		isLevelNode<LevelNodeGroup>(node, 'levelNodeGroup'),
	);
	while (index !== -1) {
		const [node] = nodes.splice(index, 1);

		if (node && isLevelNode<LevelNodeGroup>(node, 'levelNodeGroup')) {
			nodes.push(...ungroupNode(node));
		}

		index = nodes.findIndex((levelnode) =>
			isLevelNode<LevelNodeGroup>(levelnode, 'levelNodeGroup'),
		);
	}

	return nodes;
}
