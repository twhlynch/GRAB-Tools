function isVector3(obj) {
	return obj && 'x' in obj && 'y' in obj && 'z' in obj && Object.keys(obj).length === 3;
}
function isVector4(obj) {
	return obj && 'x' in obj && 'y' in obj && 'z' in obj && 'w' in obj && Object.keys(obj).length === 4;
}

function camelToTitleCase(str) {
  const spaced = str.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function serializeToMenu(value, key = "node") {
	key = camelToTitleCase(key);
	
	if (typeof value === 'object' && isVector3(value)) {
		return {
			key,
			type: 'vector3',
			value: { ...value },
			isExpandable: false,
			children: null
		};
	}

	if (typeof value === 'object' && isVector4(value)) {
		return {
			key,
			type: 'vector4',
			value: { ...value },
			isExpandable: false,
			children: null
		};
	}

	if (Array.isArray(value)) {
    		return {
      			key,
      			type: 'array',
      			value: null,
      			isExpandable: value.length > 0,
      			children: value.map((item, index) => serializeToMenu(item, index))
    		};
  	}

  	if (typeof value === 'object' && value !== null) {
    		return {
      			key,
      			type: 'object',
      			value: null,
      			isExpandable: value != {},
      			children: Object.entries(value).map(([subKey, subVal]) => serializeToMenu(subVal, subKey))
    		};
  	}

  	return {
    		key,
    		type: typeof value,
    		value: value,
    		isExpandable: false,
    		children: null
  	};
}
