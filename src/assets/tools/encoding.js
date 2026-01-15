import definition from '@/assets/proto/proto.proto?raw';
import { DOMAIN, FORMAT_VERSION } from '@/config';
import protobuf from 'protobufjs';

let protobuf_definition = definition;
const vanilla_root = protobuf.parse(protobuf_definition).root;
add_modded_types();

/**
 * @returns {protobuf.Root} - The level message root
 */
function load() {
	if (window._root === undefined) {
		const { root } = protobuf.parse(protobuf_definition);
		window._root = root;
	}

	return window._root;
}

function set_protobuf(new_definition) {
	protobuf_definition = new_definition;
	window._root = undefined;
}

function get_protobuf() {
	return protobuf_definition;
}

function add_modded_types() {
	const root = load();

	let modded_shapes = '';
	let modded_materials = '';

	let current_materials = Object.values(root.COD.Level.LevelNodeMaterial);
	let current_shapes = Object.values(root.COD.Level.LevelNodeShape);

	for (let i = -2000; i < 2000; i++) {
		if (!current_materials.includes(i)) {
			modded_materials += `_M${i}=${i};`.replace('-', 'N');
		}
		if (!current_shapes.includes(i)) {
			modded_shapes += `_S${i}=${i};`.replace('-', 'N');
		}
	}

	protobuf_definition = protobuf_definition.replace(
		'// modded materials',
		`// modded materials\n  ${modded_materials}`,
	);
	protobuf_definition = protobuf_definition.replace(
		'// modded shapes',
		`// modded shapes\n  ${modded_shapes}`,
	);

	window._root = undefined;
}

function unmodded_root() {
	return vanilla_root;
}

function materials() {
	return vanilla_root.COD.Level.LevelNodeMaterial;
}
function shapes() {
	return vanilla_root.COD.Level.LevelNodeShape;
}

/**
 * @param {ArrayBuffer} buffer - A level as a buffer
 * @returns {Promise<Object>} - A level decoded to json
 */
async function decodeLevel(buffer) {
	try {
		const data = await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsArrayBuffer(buffer);
		});

		const root = load();
		const message = root.lookupType('COD.Level.Level');
		const decoded = message.decode(new Uint8Array(data));

		return message.toObject(decoded);
	} catch (e) {
		e.message = 'Invalid level data: ' + e.message;
		window.toast(e, 'error');
		return null;
	}
}

/**
 * @param {Object} level - A level as json
 * @returns {Promise<ArrayBuffer>} - A level encoded as a buffer
 */
async function encodeLevel(level) {
	const root = load();
	const message = root.lookupType('COD.Level.Level');

	const errMsg = message.verify(level);
	if (errMsg) {
		window.toast(errMsg, 'error');
		return null;
	}

	return message.encode(message.fromObject(level)).finish();
}

/**
 * @param {ArrayBuffer} buffer - A level as a buffer
 */
function downloadLevel(buffer, name = Date.now().toString().slice(0, -3)) {
	let blob = new Blob([buffer], {
		type: 'application/octet-stream',
	});

	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.level';
	link.click();
}

/**
 * @param {JSON} json - A level as json
 */
function downloadJSON(json, name = Date.now().toString().slice(0, -3)) {
	let blob = new Blob([JSON.stringify(json, null, 2)], {
		type: 'application/json',
	});

	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.json';
	link.click();
}

/**
 * @returns {Array<Object>} - A level json
 */
function createLevel(
	nodes = [],
	title = 'New Level',
	description = 'Made with GRAB Tools',
	creators = [DOMAIN],
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
) {
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

/**
 * @param object can be a THREE object or node json
 */
function node_data(object) {
	if (object?.userData?.node) {
		const entries = Object.entries(object.userData.node);
		const node = entries.find((e) => e[0].includes('levelNode'))[1];
		return node;
	}

	const entries = Object.entries(object);
	const node = entries.find((e) => e[0].includes('levelNode'))[1];
	return node;
}

function deepClone(node) {
	return JSON.parse(JSON.stringify(node));
}

function levelNode(nodeData) {
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
	horizon,
	zenith,
	sunAltitude,
	sunAzimuth,
	sunSize,
	fogDensity,
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
	return levelNode({
		levelNodeStart: {
			position: vec3(),
			rotation: quat(),
			radius: 0.5,
			name: 'start0',
		},
	});
}

function levelNodeFinish() {
	return levelNode({
		levelNodeFinish: {
			position: vec3(),
			radius: 0.5,
		},
	});
}

function levelNodeStatic() {
	return levelNode({
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
	return levelNode({
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
	return levelNode({
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
	return levelNode({
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
	return levelNode({
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
	return levelNode({
		levelNodeLobbyTerminal: {
			position: vec3(),
			rotation: quat(),
		},
	});
}

function levelNodeTrigger() {
	return levelNode({
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
	return levelNode({
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
	return levelNode({
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

function animation() {
	return {
		name: 'idle',
		speed: 1,
		frames: [],
		interpolation: 0,
		direction: 0,
	};
}

function frame() {
	return {
		time: 0,
		position: vec3(),
		rotation: quat(),
	};
}

function triggerTarget(target) {
	return {
		mode: 0,
		...target,
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

function triggerSource(source) {
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
	return levelNode({
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
function registerData() {
	return { name: '' };
}
function gasmConnection() {
	return {
		objectID: 0,
		name: 'Obj',
		properties: [],
	};
}
function programmablePropertyData() {
	return {
		objectID: 0,
		components: [],
	};
}
function programmablePropertyDataComponent() {
	return {
		inputRegisterIndex: -1,
		outputRegisterIndex: -1,
		inoutRegisterIndex: -1,
	};
}

function traverse_node(node, func) {
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
		Object.entries(shapes()).length - shapes().__END_OF_SPECIAL_PARTS__ - 1;
	return 1000 + Math.floor(Math.random() * length);
}

function add_nodes(level, nodes) {
	(level.levelNodes ??= []).push(...(nodes ?? []));
}

function json_parse(text) {
	try {
		return JSON.parse(text);
	} catch (e) {
		e.message = 'Invalid JSON: ' + e.message;
		window.toast(e, 'error');
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

function get_new_connection_name(object, target) {
	const names = object.levelNodeGASM.connections.map((conn) => conn.name);
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

function add_code_connection(object, type, name, objectID) {
	const node = object.levelNodeGASM;
	if (!node) return false;
	(node.program ??= {}).inoutRegisters ??= [];
	(node.program ??= {}).inputRegisters ??= [];
	(node.program ??= {}).outputRegisters ??= [];
	node.connections ??= [];

	const existing_connection = node.connections.find(
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
	prop[type.replace('active', 'triggerActive')] = {};

	if (type === 'active') {
		const comp = programmablePropertyDataComponent();
		comp.inputRegisterIndex = node.program.inputRegisters.length;
		prop.components = [comp];

		const act_reg = registerData();
		act_reg.name = `${connection.name}.Act`;
		node.program.inputRegisters.push(act_reg);
	} else {
		const x_comp = programmablePropertyDataComponent();
		const y_comp = programmablePropertyDataComponent();
		const z_comp = programmablePropertyDataComponent();
		x_comp.inoutRegisterIndex = node.program.inoutRegisters.length;
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

		node.program.inoutRegisters.push(...[x_reg, y_reg, z_reg]);
	}

	connection.properties.push(prop);
	if (!existing_connection) {
		node.connections.push(connection);
		return true;
	}
	return false;
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
	get_new_connection_name,
};
