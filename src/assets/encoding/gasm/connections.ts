import { add_register, RegisterType } from '@/assets/encoding/gasm/registers';
import {
	gasmConnection,
	programmablePropertyData,
	programmablePropertyDataComponent,
	registerData,
} from '@/assets/encoding/level_nodes';
import {
	ConnectionType,
	LevelNode,
	LevelNodeGASM,
	LevelNodeGASMConnection,
	ProgramData,
	ProgrammablePropertyData,
	ProgrammablePropertyDataComponent,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';

// props on ProgrammablePropertyData that are {}
type PropertyType = {
	[K in keyof ProgrammablePropertyData]-?: NonNullable<
		ProgrammablePropertyData[K]
	> extends object
		? keyof NonNullable<ProgrammablePropertyData[K]> extends never
			? K
			: never
		: never;
}[keyof ProgrammablePropertyData];

type RegisterMetaType = {
	index: keyof ProgrammablePropertyDataComponent;
	type: RegisterType;
};
type RegisterMeta = {
	name: string;
	type: RegisterMetaType;
};

/**
 * @brief Create a connection for specific objects.
 *
 * Returns whether the connection object is new.
 */
export function create_connection(
	code_node: LevelNodeWith<LevelNodeGASM>,
	target_node: LevelNode | undefined,
	object_id: number,
	type: PropertyType,
	name: string | undefined = undefined,
): boolean {
	name = name ?? get_unique_connection_name(code_node, target_node);

	const connection = build_connection(object_id, type, name);
	const properties = (connection.properties ??= []);
	const program = (code_node.levelNodeGASM.program ??= {});

	const registers = get_registers_for_property(name, type);

	const property = programmablePropertyData();
	property.objectID = connection.objectID; // redundant
	property[type] = {};
	properties.push(property);

	for (const register of registers) {
		add_connection_register(program, property, register);
	}

	return add_gasm_connection(code_node, connection);
}

/**
 * @brief Get metadata for registers for a property type.
 */
function get_registers_for_property(
	name: string,
	type: PropertyType,
): RegisterMeta[] {
	const input: RegisterMetaType = {
		index: 'inputRegisterIndex',
		type: 'inputRegisters',
	};
	const output: RegisterMetaType = {
		index: 'outputRegisterIndex',
		type: 'outputRegisters',
	};
	const inout: RegisterMetaType = {
		index: 'inoutRegisterIndex',
		type: 'inoutRegisters',
	};
	// prettier-ignore
	switch (type) {
		case 'position': return [
			{ name: `${name}.Pos.X`, type: inout},
			{ name: `${name}.Pos.Y`, type: inout},
			{ name: `${name}.Pos.Z`, type: inout},
		];
		case 'rotation': return [
			{ name: `${name}.Rot.X`, type: inout},
			{ name: `${name}.Rot.Y`, type: inout},
			{ name: `${name}.Rot.Z`, type: inout},
		];
		case 'scale': return [
			{ name: `${name}.Sca.X`, type: input},
			{ name: `${name}.Sca.Y`, type: input},
			{ name: `${name}.Sca.Z`, type: input},
		];
		case 'color': return [
			{ name: `${name}.Col.R`,      type: inout},
			{ name: `${name}.Col.G`,      type: inout},
			{ name: `${name}.Col.B`,      type: inout},
			{ name: `${name}.Col.Select`, type: inout},
		];
		case 'triggerActive': return [
			{ name: `${name}.Trg.Active`,   type: input},
			{ name: `${name}.Trg.PlayerId`, type: input},
			{ name: `${name}.Trg.Force`,    type: inout},
		];
		case 'sign': return [
			{ name: `${name}.Sign.Write`,   type: output},
			{ name: `${name}.Sign.Sel`,     type: output},
			{ name: `${name}.Sign.Control`, type: output},
			{ name: `${name}.Sign.Number`,  type: output},
		];
		case 'player': return [
			{ name: `Player.SelIndex`, type: output},
			{ name: `Player.SelId`,    type: output},
			{ name: `Player.SelPart`,  type: output},
			{ name: `Player.Control`,  type: output},
			{ name: `Player.Count`,    type: input},
			{ name: `Player.Valid`,    type: input},
			{ name: `Player.Id`,       type: input},
			{ name: `Player.Pos.X`,    type: input},
			{ name: `Player.Pos.Y`,    type: input},
			{ name: `Player.Pos.Z`,    type: input},
			{ name: `Player.Rot.X`,    type: input},
			{ name: `Player.Rot.Y`,    type: input},
			{ name: `Player.Rot.Z`,    type: input},
			{ name: `Player.Name`,     type: input},
			{ name: `Player.Col.Sel`,  type: output},
			{ name: `Player.Col.R`,    type: input},
			{ name: `Player.Col.G`,    type: input},
			{ name: `Player.Col.B`,    type: input},
			{ name: `Player.LocalId`,  type: input},
		];
	}
}

/**
 * @brief Add a register connected with a propert component.
 */
function add_connection_register(
	program: ProgramData,
	property: ProgrammablePropertyData,
	register_info: RegisterMeta,
): void {
	const {
		name,
		type: { type, index },
	} = register_info;

	const register = registerData();
	register.name = name;

	const register_index = add_register(program, register, type);

	const component = programmablePropertyDataComponent();
	component[index] = register_index;

	add_property_component(property, component);
}

/**
 * @brief Build the basic options of a connection.
 */
function build_connection(
	object_id: number,
	type: PropertyType,
	name: string,
): LevelNodeGASMConnection {
	const connection = gasmConnection();
	connection.objectID = object_id;
	connection.name = name;

	if (type === 'player') {
		connection.type = ConnectionType.PLAYER;
	} else {
		connection.type = ConnectionType.NODE;
	}

	return connection;
}

/**
 * @brief Get a unique name for a connection to a node.
 */
export function get_unique_connection_name(
	code_node: LevelNodeWith<LevelNodeGASM>,
	target_node: LevelNode | undefined,
): string {
	const connections = (code_node.levelNodeGASM.connections ??= []);

	const existing_names = connections.map((conn) => conn.name);

	const name = get_connection_name(target_node);

	let index = 0;
	while (existing_names.includes(`${name}${index}`)) {
		index++;
	}

	return `${name}${index}`;
}

/**
 * @brief Get the base name for a connection to a node.
 */
function get_connection_name(node: LevelNode | undefined): string {
	const fallback = 'Obj';

	if (node === undefined) return fallback;
	if (node.levelNodeStart) return node.levelNodeStart.name ?? 'Sta';
	if (node.levelNodeGroup) return node.levelNodeGroup.name ?? 'Grp';
	if (node.levelNodeTrigger) return 'Trg';
	if (node.levelNodeSound) return 'Snd';
	if (node.levelNodeFinish) return 'Fin';
	if (node.levelNodeGravity) return 'Grav';
	if (node.levelNodeParticleEmitter) return 'Ptcl';
	if (node.levelNodeSign) return 'Sign';
	if (node.levelNodeGASM) return 'Code';

	return fallback;
}

/**
 * @brief Add a GASM connection to a LevelNodeGASM.
 *
 * If the object is already connected, merge properties and components.
 * Returns whether the connection object is new.
 */
export function add_gasm_connection(
	level_node: LevelNodeWith<LevelNodeGASM>,
	connection: LevelNodeGASMConnection,
): boolean {
	const connections = (level_node.levelNodeGASM.connections ??= []);

	const existing_connection = connections.find(
		(conn) => conn.objectID === connection.objectID,
	);

	if (existing_connection) {
		merge_gasm_connections(existing_connection, connection);
		return false;
	}

	connections.push(connection);
	return true;
}

/**
 * @brief Merge GASM Connection properties.
 *
 * If properties are the same type, merge components.
 */
function merge_gasm_connections(
	connection: LevelNodeGASMConnection,
	other_connection: LevelNodeGASMConnection,
): void {
	const other_properties = (other_connection.properties ??= []);

	for (const property of other_properties) {
		add_connection_property(connection, property);
	}
}

/**
 * @brief Add a GASM Connection property.
 *
 * If property exists, merge components.
 */
function add_connection_property(
	connection: LevelNodeGASMConnection,
	property: ProgrammablePropertyData,
): void {
	const properties = (connection.properties ??= []);

	const existing_property = properties.find((prop) =>
		props_are_same_type(prop, property),
	);

	if (existing_property) {
		merge_gasm_properties(existing_property, property);
	} else {
		properties.push(property);
	}
}

/**
 * @brief Merge GASM property components.
 *
 * If components are the same type, discard them.
 */
function merge_gasm_properties(
	property: ProgrammablePropertyData,
	other_property: ProgrammablePropertyData,
): void {
	const other_components = (other_property.components ??= []);

	for (const component of other_components) {
		add_property_component(property, component);
	}
}

/**
 * @brief Add GASM property component.
 *
 * If component exists, discard.
 */
function add_property_component(
	property: ProgrammablePropertyData,
	component: ProgrammablePropertyDataComponent,
): void {
	const components = (property.components ??= []);

	const existing_component = components.find((comp) =>
		components_are_same(comp, component),
	);

	if (!existing_component) {
		components.push(component);
	}
}

/**
 * @brief Two components point to the same register.
 */
function components_are_same(
	comp1: ProgrammablePropertyDataComponent,
	comp2: ProgrammablePropertyDataComponent,
): boolean {
	for (const key of Object.keys(
		comp1,
	) as (keyof ProgrammablePropertyDataComponent)[]) {
		if (comp1[key] !== comp2[key]) return false;
	}
	return true;
}

/**
 * @brief Two components have the same register type.
 */
function components_are_same_type(
	comp1: ProgrammablePropertyDataComponent,
	comp2: ProgrammablePropertyDataComponent,
): boolean {
	return component_type(comp1) === component_type(comp2);
}

/**
 * @brief Register type used by component
 */
function component_type(
	component: ProgrammablePropertyDataComponent,
): string | null {
	for (const [key, value] of Object.entries(component)) {
		if (value !== -1) return key;
	}

	return null;
}

/**
 * @brief Two properties have the same type.
 */
function props_are_same_type(
	prop1: ProgrammablePropertyData,
	prop2: ProgrammablePropertyData,
): boolean {
	return Object.keys(prop1).every((key) => key in prop2);
}
