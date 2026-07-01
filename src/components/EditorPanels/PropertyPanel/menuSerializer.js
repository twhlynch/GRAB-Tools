import { obj } from "@/tools/obj";

function isVector3(obj) {
	return (
		obj &&
		'x' in obj &&
		'y' in obj &&
		'z' in obj &&
		Object.keys(obj).length === 3
	);
}
function isVector4(obj) {
	return (
		obj &&
		'x' in obj &&
		'y' in obj &&
		'z' in obj &&
		'w' in obj &&
		Object.keys(obj).length === 4
	);
}

function camelToTitleCase(str) {
	const spaced = str.replace(/([A-Z])/g, ' $1');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const classify_as = {
	vector3: ['Position', 'Scale'],
	vector4: ['Rotation'],
	color: ['Color', 'Color1', 'Color2'],
};

function deSerialize(object) {
	if (object.children) {
		if (object.type=='array') {
			let result = [];
			object.children.forEach(element => {
				result.push(deSerialize(element));
			});
			return result;
		} else {
			let result = {};
			object.children.forEach(element => {
				result[element.key] = deSerialize(element);
			});
			return result;
		}
	}
	return object.value;
}

function serializeToMenu(value, key = 'node') {
	const serkey = camelToTitleCase(key);

	if (typeof value === 'object' && classify_as.vector3.includes(key)) {
		return {
			serkey,
			key: key,
			type: 'vector3',
			value: {
				x: 0,
				y: 0,
				z: 0,
				...value,
			},
			isExpandable: false,
			children: null,
		};
	}

	if (typeof value === 'object' && classify_as.vector4.includes(key)) {
		return {
			serkey,
			key: key,
			type: 'vector4',
			value: {
				x: 0,
				y: 0,
				z: 0,
				w: 0,
				...value,
			},
			isExpandable: false,
			children: null,
		};
	}

	if (typeof value === 'object' && classify_as.color.includes(key)) {
		return {
			serkey,
			key: key,
			type: 'color',
			value: { ...value },
			isExpandable: false,
			children: null,
		};
	}

	if (Array.isArray(value)) {
		return {
			serkey,
			key: key,
			type: 'array',
			value: null,
			isExpandable: value.length > 0,
			children: value.map((item, index) =>
				serializeToMenu(item, index.toString()),
			),
		};
	}

	if (typeof value === 'object' && value !== null) {
		return {
			serkey,
			key: key,
			type: 'object',
			value: null,
			isExpandable: value != {},
			children: Object.entries(value).map(([subKey, subVal]) =>
				serializeToMenu(subVal, subKey),
			),
		};
	}

	return {
		serkey,
		key: key,
		type: typeof value,
		value: value,
		isExpandable: false,
		children: null,
	};
}

export { serializeToMenu, deSerialize };