import { load } from '@/common/root';
import { LevelNode } from '@grab-tools/lib/generated/proto';
import { Enum, Field, OneOf, Type } from 'protobufjs';
//import '@/components/EditorPanels/PropertyPanel/fullyQualifiedObjectTypes.ts';

function camelToTitleCase(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/^./, (c) => c.toUpperCase());
}

function enumCaseToTitleCase(str: string) {
	if (str.toLowerCase() != str && str.toUpperCase() != str) {
		return camelToTitleCase(str);
	}
	return str
		.toLowerCase()
		.replace(
			/([a-z0-9])_([a-z0-9])/g,
			(_: string, p1: string, p2: string) => `${p1} ${p2.toUpperCase()}`,
		)
		.replace(/^./, (c) => c.toUpperCase());
}

const PRIMITIVE_DEFAULTS: Record<string, number | boolean | string> = {
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

interface TypeDefField {
	type: string;
	repeated: boolean;
	oneof: object;
}

interface TypeDef {
	fields: Record<string, TypeDefField>;
	oneofs: Record<string, string[]>;
}

interface Registry {
	loaded: boolean;
	types: Record<string, TypeDef>;
	enums: Record<string, [number, string][]>;
	enumLookup: Record<string, boolean>;
}

const registry: Registry = {
	loaded: false,
	types: {},
	enums: {},
	enumLookup: {},
};

function loadTypeRegistry() {
	const proto = load();
	console.log(proto);
	registry.loaded = true;

	Object.values(
		(
			proto as unknown as {
				_fullyQualifiedObjects: Record<string, Type | Enum>;
			}
		)._fullyQualifiedObjects,
	).forEach((item: Type | Enum) => {
		// enums
		if (item instanceof Enum) {
			const enumData: [number, string][] = [];

			Object.entries(item.valuesById).forEach(([k, i]: string[]) => {
				if (i?.startsWith('_')) return;
				// store as [id, displayName]
				enumData.push([
					parseInt(k ?? '0'),
					enumCaseToTitleCase(i ?? 'UNKNOWN_ENUM'),
				]);
			});

			registry.enums[
				item.parent?.name == 'Level'
					? item.name
					: item.parent?.name + '.' + item.name
			] = enumData;
			registry.enumLookup[
				item.parent?.name == 'Level'
					? item.name
					: item.parent?.name + '.' + item.name
			] = true;
		}

		// messages
		else if (item instanceof Type) {
			const typeDef: TypeDef = { fields: {}, oneofs: {} };

			// field metadata
			Object.entries(item.fields).forEach(
				([fieldName, field]: [string, Field]) => {
					typeDef.fields[fieldName] = {
						type: field.type,
						repeated: field.repeated,
						/*oneof: field.oneof
						? typeof field.oneof === 'string'
							? field.oneof
							: field.oneof.name
						: null,*/
						oneof: {},
					};
				},
			);
			// store oneof definitions
			// website dosent load without the or on item.oneofs, and eslint complains when i do use the or
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			Object.entries(item.oneofs || {}).forEach(
				([oneofName, oneof]: [string, OneOf]) => {
					typeDef.oneofs[oneofName] = oneof.oneof.slice();
				},
			);

			registry.types[item.name] = typeDef;
		}
	});
	console.log(registry);
}

/** build a default for any proto type */
function getDefaultForType(
	typeName: string,
	parentTypeName = '',
	labelName = '',
) {
	// scale
	if (labelName == 'scale') return { x: 1, y: 1, z: 1 };
	// levelNodeStart and levelNodeFinish
	if (labelName == 'radius') return 1;
	// levelNodeCrumbling defualt material is grabbableCrumbling (id: 7)
	if (labelName == 'material' && parentTypeName == 'LevelNodeCrumbling')
		return 7;
	// primitives use their defaults
	if (typeName in PRIMITIVE_DEFAULTS) return PRIMITIVE_DEFAULTS[typeName];
	// shape should be cube
	if (typeName == 'LevelNodeShape') return 1000;
	// enums use 0
	if (registry.enumLookup[parentTypeName + '.' + typeName]) return 0;
	if (registry.enumLookup[typeName]) return 0;
	// colors have an alpha of 1
	if (typeName == 'Color') return { r: 0, g: 0, b: 0, a: 1 };
	// quaternions have a w of 1
	if (typeName == 'Quaternion') return { x: 0, y: 0, z: 0, w: 1 };

	const typeDef = registry.types[typeName];
	if (!typeDef) return undefined;

	// collect oneofs
	const oneofFieldNames = new Set();
	Object.values(typeDef.oneofs).forEach((variants) => {
		variants.forEach((v) => oneofFieldNames.add(v));
	});

	const result: Record<string, unknown> = {};

	// build children recursively excluding oneofs
	Object.entries(typeDef.fields).forEach(([fieldName, field]) => {
		if (oneofFieldNames.has(fieldName)) return;
		result[fieldName] = field.repeated
			? []
			: getDefaultForType(field.type, typeName, fieldName);
	});

	return result;
}

/** generate template objects for array add menus */
function getBlankTypesForArray(elementType: string) {
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
	const result: Record<string, Record<string, unknown>> = {};

	oneofKeys.forEach((oneofName) => {
		oneofs[oneofName]?.forEach((variantFieldName: string) => {
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
function getFieldInfo(typeName: string, key: string) {
	const typeDef = registry.types[typeName];
	return typeDef?.fields[key] ?? null;
}

/** look up an enum by type name */
function getEnumData(typeName: string, parentTypeName: string) {
	const x = registry.enums[parentTypeName + '.' + typeName] ?? null;
	if (!x) {
		return registry.enums[typeName] ?? null;
	}
	return x;
}

/** resolve a type from its parent */
function resolveValueType(key: string, parentTypeName: string) {
	// root node
	if (key == '') {
		return { typeName: 'LevelNode', fieldInfo: null };
	}

	// known field within a message type
	const fieldInfo = getFieldInfo(parentTypeName, key);
	if (fieldInfo) return { typeName: fieldInfo.type, fieldInfo };

	// unknown
	return { typeName: null, fieldInfo: null };
}

/** collect child entries from a known message type */
function buildTypedefEntries(
	value: Record<string, object>,
	typeDef: TypeDef,
	typeName: string,
	parentTypeName = '',
) {
	const entries: [string, Node, number][] = [];

	// oneofs
	const oneofs = typeDef.oneofs;
	const oneofFieldNames = new Set();
	Object.values(oneofs).forEach((variants) => {
		variants.forEach((v) => oneofFieldNames.add(v));
	});

	// active oneof variant
	Object.entries(oneofs).forEach(([, variants]) => {
		// a variant should exist but fallback to the first one
		const activeVariant =
			variants.find((v: string) => value[v] != null) ?? variants[0];

		if (activeVariant) {
			// appease the typescript gods, in reality activeVariant should always be something
			const subVal =
				activeVariant in value
					? value[activeVariant] // value
					: getDefaultForType(
							typeDef.fields[activeVariant]?.type ?? '', // this looks so dumb
							parentTypeName,
						); // default

			entries.push([
				activeVariant,
				serialize(subVal, activeVariant, typeName),
				0, // oneof
			]);
		}
	});

	Object.entries(typeDef.fields).forEach(([subKey, subField]) => {
		if (oneofFieldNames.has(subKey)) return;

		const isPresent = subKey in value;
		const subVal = isPresent
			? value[subKey]
			: subField.repeated
				? []
				: subKey == 'color1' // default main color on concrete is white
					? { r: 1, g: 1, b: 1, a: 1 }
					: getDefaultForType(subField.type, parentTypeName);

		entries.push([
			subKey,
			serialize(subVal, subKey, typeName),
			subField.type === 'bool' ? 2 : 1, // bools last
		]);
	});

	entries.sort((a, b) => a[2] - b[2]); // oneofs, other, bools
	return entries;
}

function getBlankType(
	value: Record<string, object>,
	blankTypes: Record<string, unknown> | null,
) {
	if (Object.keys(value).length == 0) return;
	const valTypeNames = Object.keys(value).map((v) => {
		return camelToTitleCase(v);
	});
	for (const v of valTypeNames) {
		if (blankTypes?.[v]) return v;
	}
	console.warn('cant find blank type', value, blankTypes);
}

export interface Node {
	value: unknown;
	title: string;
	key: string;
	arrayIndex: number;
	parentTypeName: string;
	typeName: string | null;
	selectedBlankType: string | null;
	elementType: string | null;
	blankTypes: Record<string, unknown> | null;
	type: string | null;
	isExpandable: boolean;
	children: Node[] | null;
	enumData: [number, string][] | null;
}

/** serialise an object into a menu tree */
export function serialize(
	value: unknown,
	key = '',
	parentTypeName = '',
	arrayIndex = -1,
): Node {
	if (!registry.loaded) loadTypeRegistry();

	// resolve the expected type from parent
	let { typeName, fieldInfo } = resolveValueType(key, parentTypeName);

	if (!typeName && arrayIndex > -1 && parentTypeName != '') {
		typeName = parentTypeName;
		fieldInfo = null;
	}

	const node: Node = {
		title: camelToTitleCase(key),
		key,
		arrayIndex,
		parentTypeName,
		typeName: null,
		selectedBlankType: null,
		elementType: null,
		blankTypes: null,
		type: null,
		isExpandable: false,
		children: null,
		value: null,
		enumData: null,
	};
	if (typeName) node.typeName = typeName;

	// array
	if (Array.isArray(value)) {
		const elementType = fieldInfo?.type ?? '';
		const blankTypes = elementType
			? getBlankTypesForArray(elementType)
			: null;

		const children: Node[] = value
			.map((item, index) => {
				const child = serialize(
					item,
					index.toString(),
					elementType,
					index,
				);
				if (blankTypes && Object.keys(blankTypes).length > 1) {
					child.selectedBlankType =
						getBlankType(item, blankTypes) ?? '';
				}
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
		fieldInfo && !fieldInfo.repeated
			? getEnumData(typeName ?? '', parentTypeName)
			: [];
	if (enumData && enumData.length > 0) {
		return { ...node, type: 'enum', value, enumData };
	}

	// object
	if (typeof value === 'object' && value !== null) {
		const blankTypes =
			parentTypeName == '' ? getBlankTypesForArray('LevelNode') : null;
		const selectedBlankType =
			blankTypes && Object.keys(blankTypes).length > 1
				? (getBlankType(value as Record<string, object>, blankTypes) ??
					null)
				: null;
		const typeDef = typeName ? registry.types[typeName] : null;

		const entries = typeDef
			? buildTypedefEntries(
					value as Record<string, object>,
					typeDef,
					typeName ?? '',
					parentTypeName,
				)
			: Object.entries(value).map(([subKey, subVal]) => [
					subKey,
					serialize(
						subVal,
						subKey,
						(arrayIndex != -1 ? parentTypeName : typeName) ?? '',
					),
				]);

		return {
			...node,
			type: typeName ?? 'object',
			isExpandable: entries.length > 0,
			children: entries.map(([, child]) => child as Node),
			blankTypes,
			selectedBlankType,
		};
	}

	// primitive
	return { ...node, type: typeof value, value, isExpandable: false };
}

/** reconstruct an object from a menu tree */
export function deserialize(object: Node): LevelNode {
	// value
	if (!object.children) return object.value as LevelNode;
	// array
	if (object.type === 'array') return object.children.map(deserialize);
	// object
	const result: Record<string, unknown> = {};
	object.children.forEach((c: Node) => {
		result[c.key] = deserialize(c);
	});
	return result;
}
