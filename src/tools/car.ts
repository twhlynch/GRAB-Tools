import { create_connection } from '@/common/connections';
import { groupNodes } from '@/common/group';
import { deepClone, node_data, traverse_node } from '@/common/utils';
import { asm_to_json } from '@/editor/AssemblyConversion';
import {
	levelNodeWithGASM,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
} from '@/generated/nodes';
import {
	LevelNode,
	LevelNodeShape,
	TriggerSourceBasicType,
} from '@/generated/proto';

async function makeCar(nodes: LevelNode[]) {
	if (nodes.length !== 2) {
		window.toast('Must have only 2 objects to make a car', 'warning');
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

	const [car_node, wheel_node] = nodes as [LevelNode, LevelNode];

	// make wheel grabbable
	traverse_node(wheel_node, (node) => {
		if (node.levelNodeStatic) {
			node.levelNodeStatic.isGrabbable = true;
		}
	});

	// group wheel with trigger
	const wheel_position = deepClone(node_data(wheel_node).position);
	const trigger_node = levelNodeWithTrigger({
		shape: LevelNodeShape.SPHERE,
		scale: { x: 0.5, y: 0.5, z: 0.5 },
		position: { x: 0, y: 0, z: 0 },
		triggerSources: [
			triggerSourceWithBasic({
				type: TriggerSourceBasicType.HAND,
			}),
		],
	});

	const group_node = groupNodes([wheel_node, trigger_node]);
	group_node.levelNodeGroup.physicsObject = true;
	group_node.levelNodeGroup.position = wheel_position;

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
	const code_node = levelNodeWithGASM({ startActive: true });

	create_connection(code_node, undefined, group_id, 'position', 'Str');
	create_connection(code_node, undefined, group_id, 'position', 'Str');
	create_connection(code_node, undefined, group_id, 'rotation', 'Str');
	create_connection(code_node, undefined, car_id, 'position', 'Car');
	create_connection(code_node, undefined, car_id, 'rotation', 'Car');
	create_connection(code_node, undefined, trigger_id, 'triggerActive', 'Hol');

	asm_to_json(asm, code_node);

	// result: [group[wheel, trigger], car, code]
	nodes.length = 0;
	nodes.push(group_node, car_node, code_node);
	return nodes;
}

export default {
	makeCar,
};
