import { load } from '@/common/root';

const rgbToHex = (r, g, b) =>
	'#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');

function camelToTitleCase(str) {
	// camelCase
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/^./, (c) => c.toUpperCase());
}

function enumCaseToTitleCase(str) {
	// ENUM_CASE or enum_case or enumCase
	if (str.toLowerCase() != str && str.toUpperCase() != str) {
		// probably in camel case
		return camelToTitleCase(str);
	}
	str = str.toLowerCase();
	return str
		.replace(
			/([a-z0-9])_([a-z0-9])/g,
			(p1, p2) => `${p1} ${p2.toUpperCase()}`,
		)
		.replace(/^./, (c) => c.toUpperCase());
}

function titleToCamelCase(str) {
	// Title Case
	if (!str) return '';
	if (str.toUpperCase() === str) return str;
	return str.charAt(0).toLowerCase() + str.slice(1);
}

const structure = {
	loaded: false,
	classes: {},
	enums: [],
	blank_types: [],
};

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
	{
		parentKey: 'node',
		key: 'levelNodeStatic',
		ifKey: {
			material: 8,
		},
		types: {
			Colored: {
				shape: 1000,
				material: 8,
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				scale: {
					x: 1,
					y: 1,
					z: 1,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				color1: {
					r: 0,
					g: 0,
					b: 0,
					a: 1,
				},
				isNeon: false,
				isTransparent: false,
				color2: {
					r: 0,
					g: 0,
					b: 0,
					a: 1,
				},
				isGrabbable: false,
				isGrapplable: false,
				isPassable: false,
				isGradient: false,
				gradientDirection: {
					x: 0,
					y: 0,
					z: 0,
				},
				specularBrightness: 0,
				isAdditive: false,
			},
		},
	},
	{
		parentKey: 'node',
		key: 'levelNodeStatic',
		ifKey: {
			material: [0, 1, 2, 4, 5, 6, 9, 10],
		},
		types: {
			default: {
				shape: 1000,
				material: 0,
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				scale: {
					x: 1,
					y: 1,
					z: 1,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
			},
		},
	},
	{
		parentKey: 'node',
		key: 'levelNodeStatic',
		ifKey: {
			material: 3,
		},
		types: {
			ColoredLava: {
				shape: 1000,
				material: 3,
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				scale: {
					x: 1,
					y: 1,
					z: 1,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				color1: {
					r: 0,
					g: 0,
					b: 0,
					a: 1,
				},
				isTransparent: false,
				color2: {
					r: 0,
					g: 0,
					b: 0,
					a: 1,
				},
				isGrabbable: false,
				isGrapplable: false,
				isPassable: false,
				isGradient: false,
				gradientDirection: {
					x: 0,
					y: 0,
					z: 0,
				},
				specularBrightness: 0,
				isAdditive: false,
			},
		},
	},
	{
		parentKey: 'node',
		key: 'levelNodeStatic',
		ifKey: {
			material: 7,
		},
		types: {
			Crumbling: {
				shape: 1000,
				material: 7,
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				scale: {
					x: 1,
					y: 1,
					z: 1,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				stableTime: 5,
				respawnTime: 5,
				isLocal: false,
			},
		},
	},
	{
		parentKey: 'frames',
		types: {
			Frame: {
				time: 1,
				position: {
					x: 0,
					y: 1,
					z: 0,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
			},
		},
	},
	{
		parentKey: 'node',
		key: 'levelNodeSign',
		ifKey: {
			hideModel: false,
		},
		types: {
			DefaultSign: {
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				text: 'Text',
				color: {
					r: 1,
					g: 1,
					b: 1,
				},
				hideModel: false,
				isNeon: false,
			},
		},
	},
	{
		parentKey: 'node',
		key: 'levelNodeSign',
		ifKey: {
			hideModel: true,
		},
		types: {
			DefaultSign: {
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				text: 'Text',
				scale: 1,
				color: {
					r: 1,
					g: 1,
					b: 1,
				},
				hideModel: false,
				weight: 0,
				isNeon: false,
			},
		},
	},
];

function load_proto_data() {
	const proto = load();
	console.log(proto);

	structure.loaded = true;

	// Load enums
	Object.values(proto._fullyQualifiedObjects).forEach((item) => {
		if (item.constructor.name == 'Enum') {
			let enumData = [];
			Object.entries(item.valuesById).forEach(([k, i]) => {
				if (i.charAt(0) == '_') return; // hidden
				try {
					enumData.push([parseInt(k), enumCaseToTitleCase(i)]);
				} catch (_err) {
					window.toast('Invalid protobuf enums', 'error');
				}
			});
			let key_override = null;
			let parentKey_override = null;
			if (item.name === 'LevelNodeShape') {
				key_override = 'shape';
				parentKey_override = 'levelNodeStatic';
			}
			if (item.name === 'LevelNodeMaterial') {
				key_override = 'material';
				parentKey_override = 'levelNodeStatic';
			}
			if (item.parent.name === 'Animation') {
				parentKey_override = 'Animations';
			}
			if (item.parent.name.includes('TriggerTarget')) {
				parentKey_override = 'TriggerTargets';
			}
			if (item.name === 'InterpolationType') {
				parentKey_override = 'triggerTargetAmbience';
			}
			structure.enums.push({
				key: key_override ? key_override : titleToCamelCase(item.name),
				parentKey: parentKey_override
					? parentKey_override
					: titleToCamelCase(item.parent.name),
				enumData: enumData,
			});
		} else {
			Object.entries(item.fields).forEach(([k, i]) => {
				if (structure.classes[k]) return;
				structure.classes[k] = i.type;
			});
		}
	});

	console.log(structure);
}

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
	if (!structure.loaded) load_proto_data();

	const serkey = camelToTitleCase(key);

	const type = structure.classes[key];

	let node = {
		title: serkey,
		key: key,
		arrayIndex: arrayIndex,
	};

	// Blank type serialization
	let selected_blank_type = null;
	blank_types.forEach((e) => {
		//console.log(e);
		if (parentKey != e.parentKey) return;
		if (e.key && key != e.key) return;
		let matches = false;
		if (e.ifKey) {
			Object.entries(e.ifKey).forEach(([akey, val]) => {
				if (
					(Array.isArray(val) && val.includes(value[akey])) ||
					value[akey] == val
				)
					matches = true;
			});
			if (!matches) return;
		}
		selected_blank_type = e.types;
	});
	if (selected_blank_type) {
		node.blankTypes = selected_blank_type;
		if (
			Object.keys(node.blankTypes).length == 1 &&
			typeof value == 'object' &&
			!Array.isArray(value)
		) {
			let source = Object.entries(node.blankTypes)[0][1];
			let source_keys = Object.keys(source);
			value = {
				...source,
				...value,
			};
			let new_value = {};
			Object.entries(value).forEach(([akey, val]) => {
				if (source_keys.includes(akey)) {
					new_value[akey] = val;
				}
			});
			value = new_value;
		}
	}

	if (key == 'node') {
		value = {
			isLocked: false,
			animations: [],
			activeAnimation: 0,
			...value,
		};
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
	if (typeof value === 'object' && type === 'Vector' && !node.type) {
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
	if (typeof value === 'object' && type === 'Quaternion' && !node.type) {
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
	if (typeof value === 'object' && type === 'Vector2' && !node.type) {
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
	if (typeof value === 'object' && type === 'Color' && !node.type) {
		const col = {
			r: Math.floor(value.r * 255 || 0),
			g: Math.floor(value.g * 255 || 0),
			b: Math.floor(value.b * 255 || 0),
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
			children: value
				.map((item, index) =>
					serializeToMenu(item, index.toString(), key, index),
				)
				.toSorted((a, b) => a.key[0] - b.key[0]),
		};
	}

	// Objects
	if (typeof value === 'object' && value !== null && !node.type) {
		node = {
			...node,
			type: 'object',
			arrayIndex: arrayIndex,
			isExpandable: value != {},
			children: Object.entries(value)
				.map(([subKey, subVal]) =>
					serializeToMenu(
						subVal,
						subKey,
						arrayIndex != null ? parentKey : key,
					),
				)
				.toSorted(
					(a, b) => a.key[0].charCodeAt(0) - b.key[0].charCodeAt(0),
				),
		};
	}

	// Enums
	let enumData = null;
	structure.enums.forEach((e) => {
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
