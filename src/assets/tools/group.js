import encoding from '@/assets/tools/encoding';
import { Box3 } from 'three/src/math/Box3';
import { Vector3 } from 'three/src/math/Vector3';
import { Quaternion } from 'three/src/math/Quaternion';

/**
 * @param {Array<Object>} nodes - A list of level nodes
 * @returns {Object} - A single level node
 */
function groupNodes(nodes) {
	const positions = nodes.map((node) => {
		const data = encoding.node_data(node);

		return new Vector3(data.position.x, data.position.y, data.position.z);
	});

	const box = new Box3().setFromPoints(positions);
	const center = new Vector3();
	box.getCenter(center);

	nodes.forEach((node) => {
		const data = encoding.node_data(node);

		data.position.x = (data.position.x ?? 0) - center.x;
		data.position.y = (data.position.y ?? 0) - center.y;
		data.position.z = (data.position.z ?? 0) - center.z;
	});

	const group = encoding.levelNodeGroup();
	group.levelNodeGroup.position = { x: center.x, y: center.y, z: center.z };
	group.levelNodeGroup.childNodes = nodes;
	return group;
}

/**
 * @param {Object} group - A single group node
 * @returns {Array<Object>} - A list of level nodes
 */
function ungroupNode(group) {
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

	const child_nodes = group.levelNodeGroup.childNodes;

	child_nodes.forEach((node) => {
		const data = encoding.node_data(node);

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
			data.scale?.x ?? 0,
			data.scale?.y ?? 0,
			data.scale?.z ?? 0,
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
		if (data.scale && typeof data.scale === 'object') {
			data.scale.x = scale.x;
			data.scale.y = scale.y;
			data.scale.z = scale.z;
		}
		if (data.scale && typeof data.scale === 'number') {
			data.scale = scale.x;
		}
		if (data.radius) {
			data.radius = scale.x / 2;
		}
	});

	return child_nodes;
}

function recursiveUngroup(nodes) {
	if (!nodes?.length) return nodes;

	let index = nodes.findIndex((node) => node.levelNodeGroup);
	while (index !== -1) {
		const [node] = nodes.splice(index, 1);
		nodes.push(...ungroupNode(node));

		index = nodes.findIndex((node) => node.levelNodeGroup);
	}

	return nodes;
}

export default {
	groupNodes,
	ungroupNode,
	recursiveUngroup,
};
