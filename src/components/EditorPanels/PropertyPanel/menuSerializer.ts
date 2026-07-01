function isVector3(obj) {
	return obj && 'x' in obj && 'y' in obj && 'z' in obj && Object.keys(obj).length === 3;
}

export function serializeToMenu(value, key = 'Root') {
	if (typeof value === 'object' && isVector3(value)) {
		return {
			key,
			type: 'vector3',
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
      			isExpandable: true,
      			children: value.map((item, index) => serializeToMenu(item, `[${index}]`))
    		};
  	}

  	if (typeof value === 'object' && value !== null) {
    		return {
      			key,
      			type: 'object',
      			value: null,
      			isExpandable: true,
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
