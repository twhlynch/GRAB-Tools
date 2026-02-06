import { asm_to_json } from '@/assets/AssemblyConversion';
import {
	levelNodeWithGASM,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
} from '@/generated/nodes';
import { create_connection } from '../encoding/gasm/connections';
import { groupNodes } from '../encoding/group';
import { load } from '../encoding/root';
import { deepClone, node_data, shapes, traverse_node } from '../encoding/utils';

async function makeCar(nodes) {
	if (nodes.length !== 2) {
		window.toast('Must have only 2 objects to make a car', 'warning');
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

	let [car_node, wheel_node] = nodes;

	// make wheel grabbable
	traverse_node(wheel_node, (node) => {
		if (node?.levelNodeStatic) {
			node.levelNodeStatic.isGrabbable = true;
		}
	});

	// group wheel with trigger
	const wheel_position = deepClone(node_data(wheel_node).position);
	const trigger_node = levelNodeWithTrigger();
	trigger_node.levelNodeTrigger.scale = { x: 0.5, y: 0.5, z: 0.5 };
	const group_node = groupNodes([wheel_node, trigger_node]);
	group_node.levelNodeGroup.physicsObject = true;
	group_node.levelNodeGroup.position = wheel_position;
	trigger_node.levelNodeTrigger.position = { x: 0, y: 0, z: 0 };
	node_data(car_node).position = { x: 0, y: 0, z: 0 };
	node_data(wheel_node).position = { x: 0, y: 0, z: 0 };

	// ids: [group[wheel, trigger], car, code]
	const start_id = 1;
	const group_id = start_id;
	// wheel
	const trigger_id = start_id + 2;
	const car_id = start_id + 3;
	// code

	// create code block
	const code_node = levelNodeWithGASM();
	code_node.levelNodeGASM.startActive = true;

	create_connection(code_node, undefined, group_id, 'position', 'Str');
	create_connection(code_node, undefined, group_id, 'position', 'Str');
	create_connection(code_node, undefined, group_id, 'rotation', 'Str');
	create_connection(code_node, undefined, car_id, 'position', 'Car');
	create_connection(code_node, undefined, car_id, 'rotation', 'Car');
	create_connection(code_node, undefined, trigger_id, 'active', 'Hol');

	asm_to_json(asm, code_node);

	// connect trigger
	const source = triggerSourceWithBasic();
	source.triggerSourceBasic.type =
		load().COD.Level.TriggerSourceBasic.Type.HAND;
	trigger_node.levelNodeTrigger.triggerSources.push(source);

	trigger_node.levelNodeTrigger.shape = shapes().SPHERE;

	// result: [group[wheel, trigger], car, code]
	nodes.length = 0;
	nodes.push(group_node, car_node, code_node);
	return nodes;
}

export default {
	makeCar,
};
