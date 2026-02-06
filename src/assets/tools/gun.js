import { asm_to_json } from '@/assets/AssemblyConversion';
import {
	levelNodeWithGASM,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithGASM,
} from '@/generated/nodes';
import { create_connection } from '../encoding/gasm/connections';
import { groupNodes } from '../encoding/group';
import { load } from '../encoding/root';
import { deepClone, node_data, shapes, traverse_node } from '../encoding/utils';

async function makeGun(nodes) {
	if (nodes.length !== 2) {
		window.toast('Must have only 2 objects to make a gun', 'warning');
		return;
	}

	let asm;
	try {
		const res = await fetch('/gasm/gun.asm');
		asm = await res.text();
	} catch (e) {
		e.message = 'Failed to load asm: ' + e.message;
		window.toast(e, 'error');
		return null;
	}

	let [gun_node, bullet_node] = nodes;

	// make gun grabbable
	traverse_node(gun_node, (node) => {
		if (node?.levelNodeStatic) {
			node.levelNodeStatic.isGrabbable = true;
		}
	});

	// make bullet passable
	traverse_node(bullet_node, (node) => {
		if (node?.levelNodeStatic) {
			node.levelNodeStatic.isPassable = true;
		}
	});

	// group gun with trigger
	const gun_position = deepClone(node_data(gun_node).position);
	const trigger_node = levelNodeWithTrigger();
	trigger_node.levelNodeTrigger.scale = { x: 2, y: 2, z: 2 };
	const group_node = groupNodes([gun_node, trigger_node]);
	group_node.levelNodeGroup.physicsObject = true;
	group_node.levelNodeGroup.position = gun_position;
	trigger_node.levelNodeTrigger.position = { x: 0, y: 0, z: 0 };
	node_data(gun_node).position = { x: 0, y: 0, z: 0 };
	node_data(bullet_node).position = { x: 0, y: 0, z: 0 };

	// ids: [group[gun, trigger], bullet, code]
	const start_id = 1;
	const group_id = start_id;
	// gun, trigger
	const bullet_id = start_id + 3;
	const code_id = start_id + 4;

	// create code block
	const code_node = levelNodeWithGASM();

	create_connection(code_node, undefined, 'position', group_id, 'Gun');
	create_connection(code_node, undefined, 'rotation', group_id, 'Gun');
	create_connection(code_node, undefined, 'position', bullet_id, 'Laz');
	create_connection(code_node, undefined, 'rotation', bullet_id, 'Laz');

	asm_to_json(asm, code_node);

	// connect trigger
	const target = triggerTargetWithGASM();
	target.triggerTargetGASM.objectID = code_id;
	target.triggerTargetGASM.mode =
		load().COD.Level.TriggerTargetGASM.Mode.RESTART;
	trigger_node.levelNodeTrigger.triggerTargets.push(target);

	const source = triggerSourceWithBasic();
	source.triggerSourceBasic.type =
		load().COD.Level.TriggerSourceBasic.Type.GRAPPLE;
	trigger_node.levelNodeTrigger.triggerSources.push(source);

	trigger_node.levelNodeTrigger.shape = shapes().SPHERE;

	// result: [group[gun, trigger], bullet, code]
	nodes.length = 0;
	nodes.push(group_node, bullet_node, code_node);
	return nodes;
}

export default {
	makeGun,
};
