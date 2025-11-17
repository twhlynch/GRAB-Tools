import encoding from '@/assets/tools/encoding';
import * as THREE from 'three';

/**
 * @param {Array<Object>} nodes - A list of level nodes
 * @returns {Object} - A single level node
 */
function groupNodes(nodes) {
	const positions = nodes.map((node) => {
		const entries = Object.entries(node);
		const data = entries.find((e) => e[0].includes('levelNode'))[1];

		return new THREE.Vector3(
			data.position.x,
			data.position.y,
			data.position.z,
		);
	});

	const box = new THREE.Box3().setFromPoints(positions);
	const center = new THREE.Vector3();
	box.getCenter(center);

	nodes.forEach((node) => {
		const entries = Object.entries(node);
		const data = entries.find((e) => e[0].includes('levelNode'))[1];

		data.position.x = (data.position.x ?? 0) - center.x;
		data.position.y = (data.position.y ?? 0) - center.y;
		data.position.z = (data.position.z ?? 0) - center.z;
	});

	const group = encoding.levelNodeGroup();
	group.levelNodeGroup.position = { x: center.x, y: center.y, z: center.z };
	group.levelNodeGroup.childNodes = nodes;
	return group;
}

export default {
	groupNodes,
};
