import { create_connection } from '@/common/connections';
import { groupNodes } from '@/common/group';
import { deepClone, node_data, traverse_node } from '@/common/utils';
import { asm_to_json } from '@/editor/AssemblyConversion';
import {
	levelNodeWithGASM,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithGASM,
} from '@/generated/nodes';
import {
	LevelNode,
	LevelNodeShape,
	TriggerSourceBasicType,
	TriggerTargetGASMMode,
} from '@/generated/proto';

async function makeGun(nodes: LevelNode[]) {
	if (nodes.length !== 2) {
		window.toast('Must have only 2 objects to make a gun', 'warning');
		return;
	}

	let asm;
	try {
		const res = await fetch('/gasm/gun.asm');
		asm = await res.text();
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Failed to load asm: ' + e.message;
			window.toast(e, 'error');
		}
		return;
	}

	const [gun_node, bullet_node] = nodes as [LevelNode, LevelNode];

	// make gun grabbable
	traverse_node(gun_node, (node) => {
		if (node.levelNodeStatic) {
			node.levelNodeStatic.isGrabbable = true;
		}
	});

	// make bullet passable
	traverse_node(bullet_node, (node) => {
		if (node.levelNodeStatic) {
			node.levelNodeStatic.isPassable = true;
		}
	});

	// ids: [group[gun, trigger], bullet, code]
	const start_id = 1;
	const group_id = start_id;
	// gun, trigger
	const bullet_id = start_id + 3;
	const code_id = start_id + 4;

	// group gun with trigger
	const gun_position = deepClone(node_data(gun_node).position);
	const trigger_node = levelNodeWithTrigger({
		shape: LevelNodeShape.SPHERE,
		scale: { x: 2, y: 2, z: 2 },
		position: { x: 0, y: 0, z: 0 },
		triggerSources: [
			triggerSourceWithBasic({
				type: TriggerSourceBasicType.GRAPPLE,
			}),
		],
		triggerTargets: [
			triggerTargetWithGASM({
				mode: TriggerTargetGASMMode.RESTART,
				objectID: code_id,
			}),
		],
	});

	const group_node = groupNodes([gun_node, trigger_node]);
	group_node.levelNodeGroup.physicsObject = true;
	group_node.levelNodeGroup.position = gun_position;

	node_data(gun_node).position = { x: 0, y: 0, z: 0 };
	node_data(bullet_node).position = { x: 0, y: 0, z: 0 };

	// create code block
	const code_node = levelNodeWithGASM();

	create_connection(code_node, undefined, group_id, 'position', 'Gun');
	create_connection(code_node, undefined, group_id, 'rotation', 'Gun');
	create_connection(code_node, undefined, bullet_id, 'position', 'Laz');
	create_connection(code_node, undefined, bullet_id, 'rotation', 'Laz');

	asm_to_json(asm, code_node);

	// result: [group[gun, trigger], bullet, code]
	nodes.length = 0;
	nodes.push(group_node, bullet_node, code_node);
	return nodes;
}

export default {
	makeGun,
};
