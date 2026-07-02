const rgbToHex = (r, g, b) =>
	'#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');

function camelToTitleCase(str) {
	const spaced = str.replace(/([A-Z])/g, ' $1');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const classify_as = {
	vector3: [
		'position',
		'scale',
		'gradientDirection',
		'direction',
		'velocity',
		'velocityMin',
		'velocityMax',
		'accelerationMin',
		'accelerationMax',
	],
	vector4: ['rotation'],
	color: [
		'color',
		'color1',
		'color2',
		'startColor',
		'endColor',
		'skyColor0',
		'skyColor1',
		'sunColor',
		'ambientColor',
	],
	minmax: ['lifeSpan', 'startSize', 'endSize'],
};

const enumerate_as = [
	{
		key: 'shape',
		enumData: [
			[1000, 'Cube'],
			[1001, 'Sphere'],
			[1002, 'Cylinder'],
			[1003, 'Pyramid'],
			[1004, 'Prisim'],
			[1005, 'Cone'],
			[1006, 'Pyramid Square'],
			[0, 'Start'],
			[1, 'Finish'],
			[2, 'Sign'],
			[3, 'Gravity'],
			[4, 'Lobby Terminal'],
			[5, 'Particle Emitter'],
			[6, 'Sound'],
			[7, 'GASM'],
			[8, 'Light'],
		],
	},
	{
		key: 'material',
		enumData: [
			[0, 'Stone'],
			[1, 'Cheese'],
			[2, 'Ice'],
			[3, 'Lava'],
			[4, 'Wood'],
			[5, 'Grapple'],
			[6, 'Lava Grapple'],
			[7, 'Crumbling'],
			[8, 'Color / Concrete'],
			[9, 'Bouncing'],
			[10, 'Frost'],
			[11, 'Trigger'],
		],
	},
	{
		key: 'interpolationType',
		enumData: [
			[0, 'Linear'],
			[1, 'Quadratic Ease In'],
			[2, 'Quadratic Ease Out'],
			[3, 'Quadratic Ease In Out'],
			[4, 'Sinusoidal Ease In'],
			[5, 'Sinusoidal Ease Out'],
			[6, 'Sinusoidal Ease In Out'],
			[7, 'Exponential Ease In'],
			[8, 'Exponential Ease Out'],
			[9, 'Exponential Ease In Out'],
			[10, 'Circular Ease In'],
			[11, 'Circular Ease Out'],
			[12, 'Circular Ease In Out'],
			[13, 'Cubic Ease In'],
			[14, 'Cubic Ease Out'],
			[15, 'Cubic Ease In Out'],
			[16, 'Quartic Ease In'],
			[17, 'Quartic Ease Out'],
			[18, 'Quartic Ease In Out'],
			[19, 'Quintic Ease In'],
			[20, 'Quintic Ease Out'],
			[21, 'Quintic Ease In Out'],
		],
	},
	{
		key: 'weight',
		parentKey: 'levelNodeSign',
		enumData: [
			[0, 'Regular'],
			[1, 'Light'],
			[2, 'Semibold'],
			[3, 'Bold'],
			[4, 'Italic'],
		],
	},
	{
		key: 'mode',
		parentKey: 'levelNodeGravity',
		enumData: [
			[0, 'Legs'],
			[1, 'Fling'],
		],
	},
	{
		key: 'type',
		parentKey: 'triggerSourceBasic',
		enumData: [
			[0, 'Hand'],
			[1, 'Head'],
			[2, 'Grapple'],
			[3, 'Feet'],
			[4, 'Block'],
		],
	},
	{
		key: 'mode',
		parentKey: 'triggerTargetAnimation',
		enumData: [
			[0, 'Stop'],
			[1, 'Start'],
			[2, 'Toggle'],
			[3, 'Toggle Reverse'],
			[4, 'Restart'],
			[5, 'Reset'],
		],
	},
	{
		key: 'mode',
		parentKey: 'triggerTargetSound',
		enumData: [
			[0, 'Stop'],
			[1, 'Start'],
			[2, 'Toggle'],
			[3, 'Restart'],
			[4, 'Reset'],
		],
	},
	{
		key: 'mode',
		parentKey: 'triggerTargetGASM',
		enumData: [
			[0, 'Stop'],
			[1, 'Start'],
			[2, 'Toggle'],
			[3, 'Restart'],
			[4, 'Reset'],
		],
	},
	{
		key: 'mode',
		parentKey: 'triggerTargets',
		enumData: [
			[0, 'On Enter'],
			[1, 'On Leave'],
			[2, 'Enter or Leave'],
			[3, 'None'],
		],
	},
	{
		key: 'waveType',
		enumData: [
			[0, 'Square'],
			[1, 'Sawtooth'],
			[2, 'Sine'],
			[3, 'Noise'],
		],
	},
	{
		key: 'type',
		parentKey: 'connections',
		enumData: [
			[0, 'Node'],
			[1, 'Player'],
		],
	},
	{
		key: 'type',
		parentKey: 'levelNodeLight',
		enumData: [
			[0, 'Point'],
			[1, 'Spot'],
		],
	},
	{
		key: 'direction',
		parentKey: 'animations',
		enumData: [
			[0, 'Restart'],
			[1, 'Ping Pong'],
		],
	},
	{
		key: 'interpolation',
		parentKey: 'animations',
		enumData: [
			[0, 'No interpolation'],
			[1, 'Interpolation'],
		],
	},
];

const blank_types = [
	{
		parentKey: 'animations',
		types: {
			Animation: {
				name: 'idle',
				frames: [],
				direction: 0,
				speed: 1,
				interpolation: 0,
			},
		},
	},
	{
		parentKey: 'frames',
		types: {
			Frame: {
				time: 0,
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0, w: 0 },
			},
		},
	},
	{
		parentKey: 'triggerSources',
		types: {
			Basic: {
				triggerSourceBasic: {
					type: 0,
				},
			},
			Block: {
				triggerSourceBlockNames: {
					names: [],
				},
			},
		},
	},
	{
		parentKey: 'names',
		types: {
			String: '',
		},
	},
	{
		parentKey: 'triggerTargets',
		types: {
			Animation: {
				mode: 0,
				triggerTargetAnimation: {
					objectID: 0,
					animationName: 'idle',
					loop: false,
					reverse: false,
					mode: 3, // toggle reverse
				},
			},
			Sublevel: {
				mode: 0,
				triggerTargetSubLevel: {
					levelIdentifier: '',
					spawnPoint: 'default',
				},
			},
			Ambience: {
				mode: 0,
				triggerTargetAmbience: {
					skyColor0: { r: 0, g: 0, b: 0, a: 0 },
					skyColor1: { r: 0, g: 0, b: 0, a: 0 },
					sunAltitude: 0,
					sunAzimuth: 0,
					sunSize: 1,
					fogDensity: 1,
					changeDuration: 1,
					interpolationType: 0,
					useAdvancedSunSettings: false,
					sunColor: { r: 0, g: 0, b: 0, a: 0 },
					sunBrightness: 0,
					ambientColor: { r: 0, g: 0, b: 0, a: 0 },
					ambientBrightness: 0,
				},
			},
			Sound: {
				mode: 0,
				triggerTargetSound: {
					objectID: 0,
					mode: 3,
					repeat: false,
				},
			},
			Light: {
				mode: 0,
				triggerTargetLight: {
					objectID: 0,
					color: { r: 0, g: 0, b: 0, a: 0 },
					range: 0,
					brightness: 0,
					fadeDuration: 0,
				},
			},
		},
	},
];

function deSerialize(object) {
	if (object.children) {
		if (object.type == 'array') {
			let result = [];
			object.children.forEach((element) => {
				result.push(deSerialize(element));
			});
			return result;
		} else {
			let result = {};
			object.children.forEach((element) => {
				result[element.key] = deSerialize(element);
			});
			return result;
		}
	}
	if (object.type == 'color' && typeof object.value === 'string') {
		return {
			r: parseInt(object.value.substring(1, 3), 16) / 255,
			g: parseInt(object.value.substring(3, 5), 16) / 255,
			b: parseInt(object.value.substring(5, 7), 16) / 255,
			a: 1,
		};
	}
	return object.value;
}

function serializeToMenu(
	value,
	key = 'node',
	parentKey = null,
	arrayIndex = null,
) {
	const serkey = camelToTitleCase(key);

	let node = {
		title: serkey,
		key: key,
		arrayIndex: arrayIndex,
	};

	// Blank type serialization
	let selected_blank_type;
	blank_types.forEach((e) => {
		if (parentKey != e.parentKey) return;
		selected_blank_type = e.types;
	});
	if (selected_blank_type) {
		node.blankTypes = selected_blank_type;
	}

	// 42 empty array parents looking to populate in your area
	if (Array.isArray(value) && value.length == 0) {
		blank_types.forEach((e) => {
			if (key != e.parentKey) return;
			selected_blank_type = e.types;
		});
		if (selected_blank_type) {
			node.blankTypes = selected_blank_type;
		}
	}

	// Vector3
	if (
		typeof value === 'object' &&
		classify_as.vector3.includes(key) &&
		!node.type
	) {
		node = {
			...node,
			type: 'vector3',
			value: {
				x: 0,
				y: 0,
				z: 0,
				...value,
			},
		};
	}

	// Vector4
	if (
		typeof value === 'object' &&
		classify_as.vector4.includes(key) &&
		!node.type
	) {
		node = {
			...node,
			type: 'vector4',
			value: {
				x: 0,
				y: 0,
				z: 0,
				w: 0,
				...value,
			},
		};
	}

	// Min-Max range
	if (
		typeof value === 'object' &&
		classify_as.minmax.includes(key) &&
		!node.type
	) {
		node = {
			...node,
			type: 'minmax',
			value: {
				x: 0,
				y: 0,
				...value,
			},
		};
	}

	// Color
	if (
		typeof value === 'object' &&
		classify_as.color.includes(key) &&
		!node.type
	) {
		const col = {
			r: value.r * 255 || 0,
			g: value.g * 255 || 0,
			b: value.b * 255 || 0,
		};
		node = {
			...node,
			type: 'color',
			value: rgbToHex(col.r, col.g, col.b),
		};
	}

	// Array
	if (Array.isArray(value) && !node.type) {
		node = {
			...node,
			type: 'array',
			isExpandable: value.length > 0,
			children: value.map((item, index) =>
				serializeToMenu(item, index.toString(), key, index),
			),
		};
	}

	// Objects
	if (typeof value === 'object' && value !== null && !node.type) {
		node = {
			...node,
			type: 'object',
			arrayIndex: arrayIndex,
			isExpandable: value != {},
			children: Object.entries(value).map(([subKey, subVal]) =>
				serializeToMenu(
					subVal,
					subKey,
					arrayIndex != null ? parentKey : key,
				),
			),
		};
	}

	// Enums
	let enumData = null;
	enumerate_as.forEach((e) => {
		if (e.key != key) return;
		if (e.parentKey && e.parentKey != parentKey) return;
		enumData = e.enumData;
	});
	if (enumData && !node.type) {
		node = {
			...node,
			type: 'enum',
			value: value,
			enumData: enumData,
		};
	}

	// Basic data types (number, string, etc)
	if (!node.type) {
		node = {
			...node,
			type: typeof value,
			value: value,
			arrayIndex: arrayIndex,
			isExpandable: false,
			children: null,
		};
	}

	return node;
}

export { deSerialize, serializeToMenu };
