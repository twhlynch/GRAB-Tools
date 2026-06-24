import { Level, LevelNode, LevelNodeGroup } from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';
import { groupNodes } from '../encoding/group';

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

function compile(levels: Level[]) {
	const values = levels
		.filter((level) => level.levelNodes?.length)
		.map((level) => {
			return groupNodes(level.levelNodes ?? []);
		});

	const finalNodes: LevelNode[] = [];
	let offset = 0;
	for (const group of values) {
		// starts and finishes
		const startIds: number[] = [];
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
		group.levelNodeGroup.childNodes = (
			group.levelNodeGroup.childNodes ?? []
		).filter((n) => !n.levelNodeStart && !n.levelNodeFinish);

		// deleted target trigger targets
		traverseNode(group, (node, _) => {
			if (node.levelNodeTrigger?.triggerTargets) {
				const deletedTargets = [];
				for (
					let i = 0;
					i < node.levelNodeTrigger.triggerTargets.length;
					i++
				) {
					const target = node.levelNodeTrigger.triggerTargets[i]!;
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
						deletedTargets[i]!,
						1,
					);
				}
			}
		});

		// update target ids
		let count = 0;
		traverseNode(group, (node, _) => {
			if (node.levelNodeTrigger?.triggerTargets) {
				for (const target of node.levelNodeTrigger.triggerTargets) {
					if (target.triggerTargetAnimation) {
						if (!target.triggerTargetAnimation.objectID) {
							target.triggerTargetAnimation.objectID = 0;
						}
						const originalId =
							target.triggerTargetAnimation.objectID;
						for (const sID of startIds) {
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
