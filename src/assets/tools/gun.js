import { asm_to_json } from '@/assets/AssemblyConversion';
import encoding from '@/assets/tools/encoding';
import group from '@/assets/tools/group';

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
	encoding.traverse_node(gun_node, (node) => {
		if (node?.levelNodeStatic) {
			node.levelNodeStatic.isGrabbable = true;
		}
	});

	// make bullet passable
	encoding.traverse_node(bullet_node, (node) => {
		if (node?.levelNodeStatic) {
			node.levelNodeStatic.isPassable = true;
		}
	});

	// group gun with trigger
	const gun_position = encoding.deepClone(
		encoding.node_data(gun_node).position,
	);
	const trigger_node = encoding.levelNodeTrigger();
	trigger_node.levelNodeTrigger.scale = { x: 2, y: 2, z: 2 };
	const group_node = group.groupNodes([gun_node, trigger_node]);
	group_node.levelNodeGroup.physicsObject = true;
	group_node.levelNodeGroup.position = gun_position;
	trigger_node.levelNodeTrigger.position = { x: 0, y: 0, z: 0 };
	encoding.node_data(gun_node).position = { x: 0, y: 0, z: 0 };
	encoding.node_data(bullet_node).position = { x: 0, y: 0, z: 0 };

	// ids: [group[gun, trigger], bullet, code]
	const start_id = 1;
	const group_id = start_id;
	// gun, trigger
	const bullet_id = start_id + 3;
	const code_id = start_id + 4;

	// create code block
	const code_node = encoding.levelNodeGASM();

	encoding.add_code_connection(code_node, 'position', 'Gun', group_id);
	encoding.add_code_connection(code_node, 'rotation', 'Gun', group_id);
	encoding.add_code_connection(code_node, 'position', 'Laz', bullet_id);
	encoding.add_code_connection(code_node, 'rotation', 'Laz', bullet_id);

	asm_to_json(asm, code_node);

	// connect trigger
	const target = encoding.triggerTargetGASM();
	target.triggerTargetGASM.objectID = code_id;
	target.triggerTargetGASM.mode =
		encoding.load().COD.Level.TriggerTargetGASM.Mode.RESTART;
	trigger_node.levelNodeTrigger.triggerTargets.push(target);

	const source = encoding.triggerSourceBasic();
	source.triggerSourceBasic.type =
		encoding.load().COD.Level.TriggerSourceBasic.Type.GRAPPLE;
	trigger_node.levelNodeTrigger.triggerSources.push(source);

	trigger_node.levelNodeTrigger.shape = encoding.shapes().SPHERE;

	// result: [group[gun, trigger], bullet, code]
	nodes.length = 0;
	nodes.push(group_node, bullet_node, code_node);
	return nodes;
}

export default {
	makeGun,
};
