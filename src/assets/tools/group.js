import levelNodes from '@/assets/tools/nodes';

/**
 * @param {Array<Object>} nodes - A list of level nodes
 * @returns {Object} - A single level node
 */
function groupNodes(nodes) {
	const group = levelNodes.levelNodeGroup();
	group.levelNodeGroup.childNodes = nodes;
	return group;
}

export default {
	groupNodes,
};
