import group from '#assets/tools/group.js';

function traverseNode(node, func, parent = null) {
	func(node, parent);
	if (node.levelNodeGroup?.childNodes) {
		node.levelNodeGroup.childNodes.forEach((child) => {
			traverseNode(child, func, node);
		});
	}
}

function compile(levels) {
	const values = levels.map((level) => {
		return group.groupNodes(level.levelNodes);
	});

	let finalNodes = [];
	let offset = 0;
	for (let group of values) {
		// starts and finishes
		let startIds = [];
		let id = 0;
		traverseNode(group, (node, parent) => {
			if (
				(node.levelNodeStart || node.levelNodeFinish) &&
				parent == group
			) {
				// only top level
				startIds.push(id - 1); // -1 for the group
			}
			id++;
		});
		group.levelNodeGroup.childNodes =
			group.levelNodeGroup.childNodes.filter(
				(n) => !n.levelNodeStart && !n.levelNodeFinish,
			);

		// deleted target trigger targets
		traverseNode(group, (node, _) => {
			if (node.levelNodeTrigger?.triggerTargets) {
				let deletedTargets = [];
				for (
					let i = 0;
					i < node.levelNodeTrigger.triggerTargets.length;
					i++
				) {
					let target = node.levelNodeTrigger.triggerTargets[i];
					if (target.triggerTargetAnimation) {
						const originalId =
							target.triggerTargetAnimation.objectID || 0;
						if (originalId >= id - 1) {
							deletedTargets.push(i);
						}
					}
				}
				for (let i = deletedTargets.length - 1; i >= 0; i--) {
					node.levelNodeTrigger.triggerTargets.splice(
						deletedTargets[i],
						1,
					);
				}
			}
		});

		// update target ids
		let count = 0;
		traverseNode(group, (node, _) => {
			if (node.levelNodeTrigger?.triggerTargets) {
				for (let target of node.levelNodeTrigger.triggerTargets) {
					if (target.triggerTargetAnimation) {
						if (!target.triggerTargetAnimation.objectID) {
							target.triggerTargetAnimation.objectID = 0;
						}
						const originalId =
							target.triggerTargetAnimation.objectID;
						for (let sID of startIds) {
							if (originalId >= sID) {
								target.triggerTargetAnimation.objectID--;
							}
						}
						target.triggerTargetAnimation.objectID += offset + 1; // +1 for group
					}
				}
			}
			count++;
		});
		offset += count;
		finalNodes.push(group);
	}

	return finalNodes;
}

export default {
	compile,
};
