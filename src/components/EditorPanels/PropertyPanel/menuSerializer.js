import { load } from '@/common/root';

function camelToTitleCase(str) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/^./, (c) => c.toUpperCase());
}

function enumCaseToTitleCase(str) {
	if (str.toLowerCase() != str && str.toUpperCase() != str) {
		return camelToTitleCase(str);
	}
	return str
		.toLowerCase()
		.replace(
			/([a-z0-9])_([a-z0-9])/g,
			(_, p1, p2) => `${p1} ${p2.toUpperCase()}`,
		)
		.replace(/^./, (c) => c.toUpperCase());
}

const PRIMITIVE_DEFAULTS = {
	double: 0,
	float: 0,
	int32: 0,
	int64: 0,
	uint32: 0,
	uint64: 0,
	sint32: 0,
	sint64: 0,
	fixed32: 0,
	fixed64: 0,
	sfixed32: 0,
	sfixed64: 0,
	bool: false,
	string: '',
};

const registry = {
	loaded: false,
	types: {},
	enums: {},
	enumLookup: {},
};

function loadTypeRegistry() {
	const proto = load();
	registry.loaded = true;

	Object.values(proto._fullyQualifiedObjects).forEach((item) => {
		// enums
		if (item.valuesById) {
			const enumData = [];

			Object.entries(item.valuesById).forEach(([k, i]) => {
				if (i.charAt(0) === '_') return;
				// store as [id, displayName]
				enumData.push([parseInt(k), enumCaseToTitleCase(i)]);
			});

			registry.enums[item.name] = enumData;
			registry.enumLookup[item.name] = true;
		}

		// messages
		else if (item.fields) {
			const typeDef = { fields: {}, oneofs: {} };

			// field metadata
			Object.entries(item.fields).forEach(([fieldName, field]) => {
				typeDef.fields[fieldName] = {
					type: field.type,
					repeated: field.repeated,
					oneof: field.oneof
						? typeof field.oneof === 'string'
							? field.oneof
							: field.oneof.name
						: null,
				};
			});

			// store oneof definitions
			if (item.oneofs) {
				Object.entries(item.oneofs).forEach(([oneofName, oneof]) => {
					typeDef.oneofs[oneofName] = oneof.oneof.slice();
				});
			}

			registry.types[item.name] = typeDef;
		}
	});
}

/** build a default for any proto type */
function getDefaultForType(typeName) {
	// primitives use their defaults
	if (typeName in PRIMITIVE_DEFAULTS) return PRIMITIVE_DEFAULTS[typeName];
	// enums use 0
	if (registry.enumLookup[typeName]) return 0;

	const typeDef = registry.types[typeName];
	if (!typeDef) return undefined;

	// collect oneofs
	const oneofFieldNames = new Set();
	Object.values(typeDef.oneofs || {}).forEach((variants) => {
		variants.forEach((v) => oneofFieldNames.add(v));
	});

	const result = {};

	// build children recursively excluding oneofs
	Object.entries(typeDef.fields).forEach(([fieldName, field]) => {
		if (oneofFieldNames.has(fieldName)) return;
		result[fieldName] = field.repeated ? [] : getDefaultForType(field.type);
	});

	return result;
}

/** generate template objects for array add menus */
function getBlankTypesForArray(elementType) {
	const typeDef = registry.types[elementType];
	if (!typeDef) return null;

	const oneofs = typeDef.oneofs;
	const oneofKeys = Object.keys(oneofs);

	// simple types just build their default
	if (oneofKeys.length === 0) {
		const defaultVal = getDefaultForType(elementType);
		if (defaultVal === undefined) return null;
		return { [elementType]: defaultVal };
	}

	// oneof types build one for each option
	const result = {};

	oneofKeys.forEach((oneofName) => {
		oneofs[oneofName].forEach((variantFieldName) => {
			const field = typeDef.fields[variantFieldName];
			if (!field) return;

			const defaultVal = getDefaultForType(field.type);
			if (defaultVal === undefined) return;

			result[camelToTitleCase(variantFieldName)] = {
				[variantFieldName]: defaultVal,
			};
		});
	});

	return result;
}

/** look up a field on a parent type */
function getFieldInfo(typeName, key) {
	const typeDef = registry.types[typeName];
	return typeDef?.fields[key] || null;
}

/** look up an enum by type name */
function getEnumData(typeName) {
	return registry.enums[typeName] || null;
}

/** resolve a type from its parent */
function resolveValueType(key, parentTypeName) {
	// root node
	if (key === null) {
		return { typeName: 'LevelNode', fieldInfo: null };
	}

	// known field within a message type
	const fieldInfo = getFieldInfo(parentTypeName, key);
	if (fieldInfo) return { typeName: fieldInfo.type, fieldInfo };

	// unknown
	return { typeName: null, fieldInfo: null };
}

/** collect child entries from a known message type */
function buildTypedefEntries(value, typeDef, typeName, arrayIndex) {
	const entries = [];

	// oneofs
	const oneofs = typeDef.oneofs || {};
	const oneofFieldNames = new Set();
	Object.values(oneofs).forEach((variants) => {
		variants.forEach((v) => oneofFieldNames.add(v));
	});

	// active oneof variant
	Object.entries(oneofs).forEach(([, variants]) => {
		// a variant should exist but fallback to the first one
		const activeVariant = variants.find((v) => value[v]) ?? variants[0];

		const subVal =
			activeVariant in value
				? value[activeVariant] // value
				: getDefaultForType(typeDef.fields[activeVariant].type); // default

		entries.push([
			activeVariant,
			serialize(subVal, activeVariant, typeName, arrayIndex),
			0, // oneof
		]);
	});

	Object.entries(typeDef.fields).forEach(([subKey, subField]) => {
		if (oneofFieldNames.has(subKey)) return;

		const isPresent = subKey in value;
		const subVal = isPresent
			? value[subKey]
			: subField.repeated
				? []
				: getDefaultForType(subField.type);

		entries.push([
			subKey,
			serialize(subVal, subKey, typeName, arrayIndex),
			subField.type === 'bool' ? 2 : 1, // bools last
		]);
	});

	entries.sort((a, b) => a[2] - b[2]); // oneofs, other, bools
	return entries;
}

/** serialise an object into a menu tree */
export function serialize(
	value,
	key = null,
	parentTypeName = null,
	arrayIndex = null,
) {
	if (!registry.loaded) loadTypeRegistry();

	// resolve the expected type from parent
	let { typeName, fieldInfo } = resolveValueType(key, parentTypeName);

	if (!typeName && arrayIndex != null && parentTypeName) {
		typeName = parentTypeName;
		fieldInfo = null;
	}

	const node = { title: camelToTitleCase(key ?? ''), key, arrayIndex };
	if (typeName) node.typeName = typeName;

	// array
	if (Array.isArray(value)) {
		const elementType = fieldInfo?.type ?? null;
		const blankTypes = elementType
			? getBlankTypesForArray(elementType)
			: null;

		const children = value
			.map((item, index) => {
				const child = serialize(
					item,
					index.toString(),
					elementType,
					index,
				);
				child.elementType = elementType;
				child.blankTypes = blankTypes;
				return child;
			})
			.toSorted((a, b) => parseInt(a.key) - parseInt(b.key));

		return {
			...node,
			type: 'array',
			elementType,
			blankTypes,
			isExpandable: children.length > 0,
			children,
		};
	}

	// enum
	const enumData =
		fieldInfo && !fieldInfo.repeated ? getEnumData(fieldInfo.type) : null;
	if (enumData) {
		return { ...node, type: 'enum', value, enumData };
	}

	// object
	if (typeof value === 'object' && value !== null) {
		const typeDef = typeName ? registry.types[typeName] : null;
		const entries = typeDef
			? buildTypedefEntries(value, typeDef, typeName, arrayIndex)
			: Object.entries(value).map(([subKey, subVal]) => [
					subKey,
					serialize(
						subVal,
						subKey,
						arrayIndex != null ? parentTypeName : typeName,
						arrayIndex,
					),
				]);

		return {
			...node,
			type: typeName || 'object',
			isExpandable: entries.length > 0,
			children: entries.map(([, child]) => child),
		};
	}

	// primitive
	return { ...node, type: typeof value, value, isExpandable: false };
}

/** reconstruct an object from a menu tree */
export function deserialize(object) {
	// value
	if (!object.children) return object.value;
	// array
	if (object.type === 'array') return object.children.map(deserialize);

	// object
	const result = {};
	object.children.forEach((c) => {
		result[c.key] = deserialize(c);
	});
	return result;
}
