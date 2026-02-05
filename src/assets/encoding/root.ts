import definition from '@/assets/proto/proto.proto?raw';
import { Root } from '@/types/levelNodes';
import protobuf from 'protobufjs';

let protobuf_definition: string = definition;
const vanilla_root: Root = protobuf.parse(protobuf_definition).root as Root;
protobuf_definition = add_modded_types(protobuf_definition);
set_protobuf(protobuf_definition);

export function load(): Root {
	return (window._root ??= protobuf.parse(protobuf_definition).root as Root);
}

export function set_protobuf(new_definition: string) {
	protobuf_definition = new_definition;
	window._root = protobuf.parse(protobuf_definition).root as Root;
}

export function get_protobuf(): string {
	return protobuf_definition;
}

export function add_modded_types(def: string): string {
	const root = load();

	let modded_shapes = '';
	let modded_materials = '';

	const current_materials = Object.values(root.COD.Level.LevelNodeMaterial);
	const current_shapes = Object.values(root.COD.Level.LevelNodeShape);

	for (let i = -2000; i < 2000; i++) {
		if (!current_materials.includes(i)) {
			modded_materials += `_M${i}=${i};`.replace('-', 'N');
		}
		if (!current_shapes.includes(i)) {
			modded_shapes += `_S${i}=${i};`.replace('-', 'N');
		}
	}

	def = def.replace(
		'// modded materials',
		`// modded materials\n  ${modded_materials}`,
	);
	def = def.replace(
		'// modded shapes',
		`// modded shapes\n  ${modded_shapes}`,
	);

	return def;
}

export function unmodded_root() {
	return vanilla_root;
}
