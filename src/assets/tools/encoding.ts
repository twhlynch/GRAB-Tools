import definition from '@/assets/proto/proto.proto?raw';
import { DOMAIN, FORMAT_VERSION } from '@/config';
import {
	Animation,
	AnimationFrame,
	Color,
	Level,
	LevelNode,
	LevelNodeCrumbling,
	LevelNodeFinish,
	LevelNodeGASM,
	LevelNodeGASMConnection,
	LevelNodeGravity,
	LevelNodeGroup,
	LevelNodeLobbyTerminal,
	LevelNodeParticleEmitter,
	LevelNodeSign,
	LevelNodeSound,
	LevelNodeStart,
	LevelNodeStatic,
	LevelNodeTrigger,
	ProgrammablePropertyData,
	ProgrammablePropertyDataComponent,
	RegisterData,
	TriggerSource,
	TriggerTarget,
} from '@/generated/proto';
import { LevelNodeTypes, LevelNodeWith, Root } from '@/types/levelNodes';
import protobuf from 'protobufjs';
import { Object3D } from 'three';

let protobuf_definition: string = definition;
const vanilla_root: Root = protobuf.parse(protobuf_definition).root as Root;
protobuf_definition = add_modded_types(protobuf_definition);
set_protobuf(protobuf_definition);

export function load(): Root {
	return (window._root ??= protobuf.parse(protobuf_definition).root as Root);
}

function set_protobuf(new_definition: string) {
	protobuf_definition = new_definition;
	window._root = protobuf.parse(protobuf_definition).root as Root;
}

function get_protobuf(): string {
	return protobuf_definition;
}

function add_modded_types(definition: string): string {
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

	definition = definition.replace(
		'// modded materials',
		`// modded materials\n  ${modded_materials}`,
	);
	definition = definition.replace(
		'// modded shapes',
		`// modded shapes\n  ${modded_shapes}`,
	);

	return definition;
}

function unmodded_root() {
	return vanilla_root;
}

function materials(): Record<string, number> {
	return vanilla_root.COD.Level.LevelNodeMaterial as Record<string, number>;
}

function shapes(): Record<string, number> {
	return vanilla_root.COD.Level.LevelNodeShape as Record<string, number>;
}

async function decodeLevel(buffer: Blob): Promise<Level | null> {
	try {
		const data: ArrayBuffer = await new Promise<ArrayBuffer>(
			(resolve, reject) => {
				const reader = new FileReader();

				reader.onload = () => {
					const result = reader.result;

					if (result instanceof ArrayBuffer) {
						resolve(result);
					} else {
						reject(new Error('Unexpected FileReader result type'));
					}
				};

				reader.onerror = () => {
					reject(reader.error ?? new Error('FileReader error'));
				};

				reader.readAsArrayBuffer(buffer);
			},
		);

		const root = load();

		const message = root.lookupType('COD.Level.Level');
		const decoded = message.decode(new Uint8Array(data));

		const level: Level = message.toObject(decoded);

		return level;
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Invalid level data: ' + e.message;
			window.toast(e, 'error');
		}
		return null;
	}
}

async function encodeLevel(level: Level): Promise<ArrayBuffer | null> {
	const root = load();
	const message = root.lookupType('COD.Level.Level');

	const errMsg = message.verify(level);
	if (errMsg) {
		window.toast(errMsg, 'error');
		return null;
	}

	return message.encode(message.fromObject(level)).finish();
}

function downloadLevel(
	level: ArrayBuffer,
	name: string = Date.now().toString().slice(0, -3),
) {
	const blob = new Blob([level], {
		type: 'application/octet-stream',
	});

	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.level';
	link.click();
}

function downloadJSON(
	json: Level,
	name: string = Date.now().toString().slice(0, -3),
) {
	const blob = new Blob([JSON.stringify(json, null, 2)], {
		type: 'application/json',
	});

	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.json';
	link.click();
}

function createLevel(
	nodes: Array<LevelNode> = [],
	title = 'New Level',
	description = 'Made with GRAB Tools',
	creators: Array<string> | string = [DOMAIN],
	checkpoints = 10,
	horizon = {
		a: 1.0,
		b: 0.9574,
		g: 0.9574,
		r: 0.916,
	},
	zenith = {
		a: 1.0,
		b: 0.73,
		g: 0.476,
		r: 0.28,
	},
	sunAltitude = 45,
	sunAzimuth = 315,
	sunSize = 1,
	fogDensity = 0,
): Level {
	if (Array.isArray(creators)) {
		creators = creators.join(', ');
	}
	return {
		formatVersion: FORMAT_VERSION,
		title: title,
		creators: creators,
		description: description,
		tags: [],
		maxCheckpointCount: checkpoints,
		defaultSpawnPointID: 0,
		unlisted: false,
		showReplays: true,
		complexity: 0,
		ambienceSettings: ambienceSettings(
			horizon,
			zenith,
			sunAltitude,
			sunAzimuth,
			sunSize,
			fogDensity,
		),
		levelNodes: nodes,
	};
}

function isObject3D(object: LevelNode | Object3D): object is Object3D {
	return object && 'userData' in object;
}

function node_data(object: LevelNode | Object3D): LevelNodeTypes {
	const node: LevelNode = isObject3D(object) ? object.userData.node : object;
	const entries = Object.entries(node);

	const data: LevelNodeTypes = entries.find((e) =>
		e[0].includes('levelNode'),
	)?.[1];
	return data;
}

function deepClone<T>(node: T): T {
	return JSON.parse(JSON.stringify(node));
}

function levelNode<T extends LevelNodeTypes>(
	nodeData: LevelNodeWith<T>,
): LevelNodeWith<T> {
	return {
		...nodeData,
		isLocked: false,
		animations: [],
		activeAnimation: 0,
	};
}

function vec3(x = 0, y = 0, z = 0) {
	return { y, x, z };
}

function vec2(x = 0, y = 0) {
	return { x, y };
}

function quat(x = 0, y = 0, z = 0, w = 1) {
	return { x, y, z, w };
}

function color(r = 0, g = 0, b = 0, a = 1) {
	return { r, g, b, a };
}

function ambienceSettings(
	horizon: Color,
	zenith: Color,
	sunAltitude: number,
	sunAzimuth: number,
	sunSize: number,
	fogDensity: number,
) {
	if (
		!(
			horizon ||
			zenith ||
			sunAzimuth ||
			sunAltitude ||
			sunSize ||
			fogDensity
		)
	) {
		horizon = {
			a: 1.0,
			b: 0.9574,
			g: 0.9574,
			r: 0.916,
		};
		zenith = {
			a: 1.0,
			b: 0.73,
			g: 0.476,
			r: 0.28,
		};
		sunAltitude = 45;
		sunAzimuth = 315;
		sunSize = 1;
		fogDensity = 0;
	}
	return {
		skyHorizonColor: horizon ?? { r: 0, g: 0, b: 0 },
		skyZenithColor: zenith ?? { r: 0, g: 0, b: 0 },
		sunAltitude: sunAltitude ?? 0,
		sunAzimuth: sunAzimuth ?? 0,
		sunSize: sunSize ?? 0,
		fogDensity: fogDensity ?? 0,
	};
}

function levelNodeStart() {
	return levelNode<LevelNodeStart>({
		levelNodeStart: {
			position: vec3(),
			rotation: quat(),
			radius: 0.5,
			name: 'start0',
			isHidden: false,
		},
	});
}

function levelNodeFinish() {
	return levelNode<LevelNodeFinish>({
		levelNodeFinish: {
			position: vec3(),
			radius: 0.5,
		},
	});
}

function levelNodeStatic() {
	return levelNode<LevelNodeStatic>({
		levelNodeStatic: {
			shape: 1000,
			material: 0,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			color1: color(),
			color2: color(),
			isNeon: false,
			isTransparent: false,
			isGrabbable: false,
			isGrapplable: false,
			isPassable: false,
		},
	});
}

function levelNodeSign() {
	return levelNode<LevelNodeSign>({
		levelNodeSign: {
			position: vec3(),
			rotation: quat(),
			scale: 1,
			text: 'Text',
			color: color(1, 1, 1),
			weight: 0,
			hideModel: false,
		},
	});
}

function levelNodeCrumbling() {
	return levelNode<LevelNodeCrumbling>({
		levelNodeCrumbling: {
			shape: 1000,
			material: 7,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			stableTime: 5,
			respawnTime: 5,
		},
	});
}

function levelNodeGroup() {
	return levelNode<LevelNodeGroup>({
		levelNodeGroup: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			name: 'group',
			physicsObject: false,
			localPhysicsObject: false,
			mass: 1,
			childNodes: [],
		},
	});
}

function levelNodeGravity() {
	return levelNode<LevelNodeGravity>({
		levelNodeGravity: {
			mode: 0,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			direction: vec3(0, 1, 0),
		},
	});
}

function levelNodeLobbyTerminal() {
	return levelNode<LevelNodeLobbyTerminal>({
		levelNodeLobbyTerminal: {
			position: vec3(),
			rotation: quat(),
		},
	});
}

function levelNodeTrigger() {
	return levelNode<LevelNodeTrigger>({
		levelNodeTrigger: {
			shape: 1000,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			isShared: false,
			triggerSources: [],
			triggerTargets: [],
		},
	});
}

function levelNodeParticleEmitter() {
	return levelNode<LevelNodeParticleEmitter>({
		levelNodeParticleEmitter: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			particlesPerSecond: 10,
			lifeSpan: vec2(1, 2),
			startColor: color(1, 1, 1),
			endColor: color(0, 0, 0),
			startSize: vec2(1, 2),
			endSize: vec2(0.5, 1),
			velocity: vec3(0.1, 0.1, 0.1),
			velocityMin: vec3(-0.1, -0.1, -0.1),
			velocityMax: vec3(0.1, 0.1, 0.1),
			accelerationMin: vec3(-0.1, -0.1, -0.1),
			accelerationMax: vec3(0.1, 0.1, 0.1),
		},
	});
}

function levelNodeSound() {
	return levelNode<LevelNodeSound>({
		levelNodeSound: {
			position: vec3(),
			rotation: quat(),
			parameters: {
				volume: 1,
				waveType: 0,
				envelopeAttack: 0.0,
				envelopeSustain: 0.0,
				envelopeRelease: 0.0,
				envelopePunch: 0.0,
				frequencyBase: 0.0,
				frequencyLimit: 0.0,
				frequencyRamp: 0.0,
				frequencyDeltaRamp: 0.0,
				vibratoStrength: 0.0,
				vibratoSpeed: 0.0,
				pitchJumpMod: 0.0,
				pitchJumpSpeed: 0.0,
				dutyCycle: 0.0,
				dutyCycleRamp: 0.0,
				repeatSpeed: 0.0,
				flangerFrequency: 0.0,
				flangerDepth: 0.0,
				lowPassFilterFrequency: 0.0,
				highPassFilterFrequency: 0.0,
				reverbDelay: 0.0,
				reverbDecayFactor: 0.0,
			},
			name: 'sound0',
			repeat: false,
			volume: 1,
			startActive: false,
			maxRangeFactor: 1,
		},
	});
}

function animation(): Animation {
	return {
		name: 'idle',
		speed: 1,
		frames: [],
		interpolation: 0,
		direction: 0,
	};
}

function frame(): AnimationFrame {
	return {
		time: 0,
		position: vec3(),
		rotation: quat(),
	};
}

function triggerTarget(target: TriggerTarget): TriggerTarget {
	return {
		...target,
		mode: 0,
	};
}

function triggerTargetAnimation() {
	return triggerTarget({
		triggerTargetAnimation: {
			objectID: 1,
			animationName: 'idle',
			loop: false,
			reverse: false,
			mode: 1,
		},
	});
}

function triggerTargetSubLevel() {
	return triggerTarget({
		triggerTargetSubLevel: {
			levelIdentifier: '29r46v7djliny6t4rzvq7:1654257963',
			spawnPoint: 'default',
		},
	});
}

function triggerTargetGASM() {
	return triggerTarget({
		triggerTargetGASM: {
			objectID: 0,
			mode: 3,
		},
	});
}

function triggerTargetSound() {
	return triggerTarget({
		triggerTargetSound: {
			objectID: 1,
			repeat: false,
			mode: 1,
		},
	});
}

function triggerTargetAmbience() {
	return triggerTarget({
		triggerTargetAmbience: {
			skyColor0: color(),
			skyColor1: color(),
			sunAltitude: 0.0,
			sunAzimuth: 0.0,
			sunSize: 1.0,
			fogDensity: 1.0,
			changeDuration: 1.0,
			interpolationType: 0,
		},
	});
}

function triggerSource(source: TriggerSource): TriggerSource {
	return {
		...source,
	};
}

function triggerSourceBasic() {
	return triggerSource({
		triggerSourceBasic: {
			type: 0,
		},
	});
}

function triggerSourceBlockNames() {
	return triggerSource({
		triggerSourceBlockNames: {
			names: ['name'],
		},
	});
}

function levelNodeGASM() {
	return levelNode<LevelNodeGASM>({
		levelNodeGASM: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			program: {
				inoutRegisters: [],
				workingRegisters: [
					{ name: 'R0' },
					{ name: 'R1' },
					{ name: 'R2' },
					{ name: 'R3' },
					{ name: 'R4' },
					{ name: 'R5' },
					{ name: 'R6' },
					{ name: 'R7' },
				],
				labels: [],
				instructions: [],
			},
			connections: [],
			startActive: false,
		},
	});
}
function registerData(): RegisterData {
	return { name: '' };
}
function gasmConnection(): LevelNodeGASMConnection {
	return {
		objectID: 0,
		name: 'Obj',
		properties: [],
		type: 0,
	};
}
function programmablePropertyData(): ProgrammablePropertyData {
	return {
		objectID: 0,
		components: [],
	};
}
function programmablePropertyDataComponent(): ProgrammablePropertyDataComponent {
	return {
		inputRegisterIndex: -1,
		outputRegisterIndex: -1,
		inoutRegisterIndex: -1,
	};
}

function traverse_node(node: LevelNode, func: (node: LevelNode) => void) {
	if (node.levelNodeGroup?.childNodes?.length) {
		node.levelNodeGroup.childNodes.forEach((child) =>
			traverse_node(child, func),
		);
	}
	func(node);
}

function random_material() {
	const options = Object.values(materials());
	options.filter((option) => option !== materials().TRIGGER);
	const length = options.length;
	return options[Math.floor(Math.random() * length)];
}
function random_shape() {
	const length =
		Object.entries(shapes()).length -
		(shapes().__END_OF_SPECIAL_PARTS__ ?? 0) -
		1;
	return 1000 + Math.floor(Math.random() * length);
}

function add_nodes(level: Level, nodes: LevelNode[]) {
	(level.levelNodes ??= []).push(...(nodes ?? []));
}

function json_parse(text: string) {
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

function special_registers() {
	return [
		'ProgramCounter', // index of instruction
		'Halt', // boolean that halts the program
		'HaltFrame', // boolean that skips a frame. equivelant to SLEEP 0
		'SleepTimer', // idk time sleeping maybe but that seems wrong
		'DeltaTime', // time since last frame
	];
}

function get_new_connection_name(
	object: LevelNodeWith<LevelNodeGASM>,
	target: LevelNode,
) {
	const names = (object.levelNodeGASM.connections ?? []).map(
		(conn) => conn.name,
	);
	let name = target.levelNodeGroup?.name ?? target.levelNodeStart?.name;
	if (name?.length) {
		if (!names.includes(name)) {
			return name;
		}
		let index = 0;
		while (names.includes(`${name}${index}`)) {
			index++;
		}
		name = `${name}${index}`;
		return name;
	}

	let index = 0;
	while (names.includes(`Obj${index}`)) {
		index++;
	}
	name = `Obj${index}`;
	return name;
}

function add_code_connection(
	object: LevelNode,
	type: 'position' | 'rotation' | 'active' | 'color' | 'sign',
	name: string,
	objectID: number,
) {
	const node = object.levelNodeGASM;
	if (!node) return false;

	node.program ??= {};
	node.connections ??= [];
	const program = node.program;
	program.inoutRegisters ??= [];
	program.inputRegisters ??= [];
	program.outputRegisters ??= [];
	const { inoutRegisters, inputRegisters, outputRegisters } = program;
	const connections = node.connections;

	const existing_connection = connections.find(
		(conn) => conn.objectID === objectID,
	);

	let connection = existing_connection;
	if (!connection) {
		connection = gasmConnection();
		connection.objectID = objectID;
		connection.name = name;
	}

	const prop = programmablePropertyData();
	prop.objectID = objectID; // redundant??
	const key: 'position' | 'rotation' | 'triggerActive' | 'color' | 'sign' =
		type === 'active' ? 'triggerActive' : type;
	prop[key] = {};

	if (type === 'active') {
		const comp = programmablePropertyDataComponent();
		comp.inputRegisterIndex = inputRegisters.length;
		prop.components = [comp];

		const act_reg = registerData();
		act_reg.name = `${connection.name}.Act`;
		inputRegisters.push(act_reg);
	} else if (type === 'color') {
		const r_comp = programmablePropertyDataComponent();
		const g_comp = programmablePropertyDataComponent();
		const b_comp = programmablePropertyDataComponent();
		const mode_comp = programmablePropertyDataComponent();
		r_comp.inoutRegisterIndex = inoutRegisters.length;
		g_comp.inoutRegisterIndex = r_comp.inoutRegisterIndex + 1;
		b_comp.inoutRegisterIndex = r_comp.inoutRegisterIndex + 2;
		mode_comp.inoutRegisterIndex = r_comp.inoutRegisterIndex + 3;
		prop.components = [r_comp, g_comp, b_comp, mode_comp];

		const r_reg = registerData();
		const g_reg = registerData();
		const b_reg = registerData();
		const mode_reg = registerData();
		r_reg.name = `${connection.name}.R`;
		g_reg.name = `${connection.name}.G`;
		b_reg.name = `${connection.name}.B`;
		mode_reg.name = `${connection.name}.Mode`;

		inoutRegisters.push(r_reg, g_reg, b_reg, mode_reg);
	} else if (type === 'sign') {
		const output_registers = [
			'SIGN.Write',
			'SIGN.Mode',
			'SIGN.TextCtrl',
			'SIGN.Number',
		];

		prop.components = [];
		const components = prop.components;
		output_registers.forEach((name) => {
			const comp = programmablePropertyDataComponent();
			comp.inoutRegisterIndex = outputRegisters.length;
			components.push(comp);
			const reg = registerData();
			reg.name = `${connection.name}.${name}`;
			outputRegisters.push(reg);
		});
	} else {
		const x_comp = programmablePropertyDataComponent();
		const y_comp = programmablePropertyDataComponent();
		const z_comp = programmablePropertyDataComponent();
		x_comp.inoutRegisterIndex = inoutRegisters.length;
		y_comp.inoutRegisterIndex = x_comp.inoutRegisterIndex + 1;
		z_comp.inoutRegisterIndex = x_comp.inoutRegisterIndex + 2;
		prop.components = [x_comp, y_comp, z_comp];

		const x_reg = registerData();
		const y_reg = registerData();
		const z_reg = registerData();
		const type_spec = type.charAt(0).toUpperCase() + type.slice(1, 3);
		x_reg.name = `${connection.name}.${type_spec}.X`;
		y_reg.name = `${connection.name}.${type_spec}.Y`;
		z_reg.name = `${connection.name}.${type_spec}.Z`;

		inoutRegisters.push(x_reg, y_reg, z_reg);
	}

	(connection.properties ??= []).push(prop);
	if (!existing_connection) {
		node.connections.push(connection);
		return true;
	}
	return false;
}

function add_player_connections(object: LevelNode) {
	const node = object.levelNodeGASM;
	if (!node) return;
	if (node.connections?.find((c) => c.name === 'Player')) {
		window.toast('Object already has Player connection', 'warn');
		return;
	}

	node.program ??= {};
	const program = node.program;
	node.connections ??= [];
	const connections = node.connections;

	program.inputRegisters ??= [];
	program.outputRegisters ??= [];
	program.inoutRegisters ??= [];
	const inputRegisters = program.inputRegisters;
	const outputRegisters = program.outputRegisters;

	const output_registers = [
		'Plr.Sel',
		'Plr.SelId',
		'Plr.Part',
		'Plr.NameCtrl',
		'Plr.ColIdx',
	];
	const input_registers = [
		'Plr.Count',
		'Plr.Valid',
		'Plr.Id',
		'Plr.Pos.X',
		'Plr.Pos.Y',
		'Plr.Pos.Z',
		'Plr.Rot.X',
		'Plr.Rot.Y',
		'Plr.Rot.Z',
		'Plr.Name',
		'Plr.Col.R',
		'Plr.Col.G',
		'Plr.Col.B',
	];

	const connection = gasmConnection();
	connection.name = 'Player';
	connection.type = 1;
	connection.properties = [];

	const prop = programmablePropertyData();
	prop.components = [];
	prop.player = {};
	const components = prop.components;
	connection.properties.push(prop);

	input_registers.forEach((name) => {
		if (inputRegisters.find((reg) => reg.name === name)) return;
		const comp = programmablePropertyDataComponent();
		comp.inputRegisterIndex = inputRegisters.length;
		components.push(comp);

		const register = registerData();
		register.name = name;
		inputRegisters.push(register);
	});
	output_registers.forEach((name) => {
		if (outputRegisters.find((reg) => reg.name === name)) return;
		const comp = programmablePropertyDataComponent();
		comp.outputRegisterIndex = outputRegisters.length;
		components.push(comp);

		const register = registerData();
		register.name = name;
		outputRegisters.push(register);
	});

	connections.push(connection);
}

export default {
	load,
	set_protobuf,
	get_protobuf,
	unmodded_root,
	materials,
	shapes,
	decodeLevel,
	encodeLevel,
	createLevel,
	downloadLevel,
	downloadJSON,
	deepClone,
	node_data,
	levelNodeStart,
	levelNodeFinish,
	levelNodeStatic,
	levelNodeSign,
	levelNodeCrumbling,
	levelNodeGroup,
	levelNodeGravity,
	levelNodeLobbyTerminal,
	levelNodeTrigger,
	levelNodeParticleEmitter,
	levelNodeSound,
	levelNodeGASM,
	registerData,
	gasmConnection,
	programmablePropertyData,
	programmablePropertyDataComponent,
	animation,
	frame,
	triggerTargetAnimation,
	triggerTargetSubLevel,
	triggerTargetSound,
	triggerTargetAmbience,
	triggerTargetGASM,
	triggerSourceBasic,
	triggerSourceBlockNames,
	traverse_node,
	random_material,
	random_shape,
	ambienceSettings,
	add_nodes,
	json_parse,
	special_registers,
	add_code_connection,
	add_player_connections,
	get_new_connection_name,
};
