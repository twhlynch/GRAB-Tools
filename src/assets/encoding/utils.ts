import { Level, LevelNode } from '@/generated/proto';
import { LevelNodeTypes } from '@/types/levelNodes';
import { Object3D } from 'three';
import { unmodded_root } from './root';

export function isObject3D(object: LevelNode | Object3D): object is Object3D {
	return object && 'userData' in object;
}

export function materials(): Record<string, number> {
	return unmodded_root().COD.Level.LevelNodeMaterial as Record<
		string,
		number
	>;
}

export function shapes(): Record<string, number> {
	return unmodded_root().COD.Level.LevelNodeShape as Record<string, number>;
}

export function node_data(object: LevelNode | Object3D): LevelNodeTypes {
	const node: LevelNode = isObject3D(object) ? object.userData.node : object;
	const entries = Object.entries(node);

	const data: LevelNodeTypes = entries.find((e) =>
		e[0].includes('levelNode'),
	)?.[1];
	return data;
}

export function deepClone<T>(node: T): T {
	return JSON.parse(JSON.stringify(node));
}

export function traverse_node(node: LevelNode, func: (n: LevelNode) => void) {
	if (node.levelNodeGroup?.childNodes?.length) {
		node.levelNodeGroup.childNodes.forEach((child) =>
			traverse_node(child, func),
		);
	}
	func(node);
}

export function random_material() {
	const options = Object.values(materials());
	options.filter((option) => option !== materials().TRIGGER);
	const length = options.length;
	return options[Math.floor(Math.random() * length)];
}
export function random_shape() {
	const length =
		Object.entries(shapes()).length -
		(shapes().__END_OF_SPECIAL_PARTS__ ?? 0) -
		1;
	return 1000 + Math.floor(Math.random() * length);
}

export function add_nodes(level: Level, nodes: LevelNode[]) {
	(level.levelNodes ??= []).push(...(nodes ?? []));
}

export function json_parse(text: string) {
	try {
		return JSON.parse(text);
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Invalid JSON: ' + e.message;
			window.toast(e, 'error');
		}
		return null;
	}
}
