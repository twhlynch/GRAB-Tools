import fs from 'fs';
import path from 'path';
import ts from 'typescript';

interface Interface {
	name: string;
	camel: string;
	wrapper: string;
	scope: string;
	props: string[];
}

const input_file = path.resolve('lib/src/generated/proto.ts');
const output_file = path.resolve('lib/src/generated/nodes.ts');

const source_text = fs.readFileSync(input_file, 'utf8');

const source_file = ts.createSourceFile(
	input_file,
	source_text,
	ts.ScriptTarget.Latest,
	true,
);

const wrapper_types = ['LevelNode', 'TriggerSource', 'TriggerTarget'];

function get_interfaces() {
	const interfaces: Interface[] = [];

	const wrapper_interfaces: ts.InterfaceDeclaration[] = [];
	source_file.forEachChild((node) => {
		if (ts.isInterfaceDeclaration(node)) {
			if (wrapper_types.includes(node.name.text)) {
				wrapper_interfaces.push(node);
			}
		}
	});

	source_file.forEachChild((node) => {
		if (ts.isInterfaceDeclaration(node)) {
			for (const wrapper of wrapper_interfaces) {
				const name = node.name.text;
				const camel = camelCase(name);

				if (
					name.startsWith(wrapper.name.text) &&
					wrapper.members.some(
						(member) =>
							ts.isPropertySignature(member) &&
							ts.isIdentifier(member.name) &&
							member.name.text === camel,
					)
				) {
					const props = node.members
						.filter(ts.isPropertySignature)
						.map((member) => member.name.getText(source_file));

					interfaces.push({
						name,
						camel,
						wrapper: camelCase(wrapper.name.text),
						scope: name.slice(wrapper.name.text.length),
						props,
					});
				}
			}
		}
	});

	return interfaces;
}

function camelCase(str: string) {
	return str.charAt(0).toLowerCase() + str.slice(1);
}
function TitleCase(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// generate output
function generate(interfaces: Interface[]) {
	let output = `
import {
	${interfaces.map((i) => i.camel).join(', \n')},
	${wrapper_types.map(camelCase).join(', \n')},
} from './helpers';
import {
	${interfaces.map((i) => i.name).join(', \n')},
	${wrapper_types.join(', \n')},
} from './proto';

import { KeysOfType, PropsStartingWith, KeyMapping, TypesExcept, AllKeys } from './util';
`;

	wrapper_types.forEach((type) => {
		const camel = camelCase(type);
		output += `
export type ${type}With<T> = ${type} &
	Record<KeysOfType<${type}, T, '${camel}'>, T>;
export type ${type}Types = NonNullable<
	PropsStartingWith<${type}, '${camel}'>
>;

export type ${type}Key = keyof KeyMapping<${type}, '${camel}'>;
export type ${type}TypeFor<K extends ${type}Key> = KeyMapping<${type}, '${camel}'>[K];

export type ${type}TypesExcept<T extends ${type}Types[]> = TypesExcept<
	${type}, '${camel}', ${type}Types, T
>;

export function ${camel}With<T extends ${type}Types>(
	nodeData: Partial<${type}With<T>>,
): ${type}With<T> {
	return ${camel}(nodeData) as ${type}With<T>;
}
export type ${type}WithAny = {
	[K in ${type}Key]: ${type}With<${type}TypeFor<K>>;
}[${type}Key];

export type ${type}DataSlot<N> = {
	[P in ${type}Key]: N extends Record<P, ${type}TypeFor<P>> ? P : never;
}[${type}Key];

export type ${type}DataOf<N extends ${type}> = [
	${type}DataSlot<N>
] extends [never]
	? ${type}Types
	: ${type}TypeFor<${type}DataSlot<N>>;

export function ${camel}Data<N extends ${type}>(node: N): ${type}DataOf<N>;
export function ${camel}Data<T extends ${type}Types>(node: ${type}With<T>): T;
export function ${camel}Data(node: ${type}WithAny): ${type}Types;
export function ${camel}Data(node: ${type}): ${type}Types | undefined;
export function ${camel}Data(node: ${type}): ${type}Types | undefined {
	return Object.entries(node).find(
		([key, val]) => key.startsWith('${camel}') && !!val,
	)?.[1] as ${type}Types | undefined;
}

export function is${type}<K extends ${type}Key>(
	node: ${type},
	key: K,
): node is ${type}With<${type}TypeFor<K>>;
export function is${type}(node: ${type}): node is ${type}WithAny;
export function is${type}(node: ${type}, key?: ${type}Key): boolean {
	if (key !== undefined) {
		return !!node[key];
	}
	return Object.entries(node).some(
		([k, v]) => k.startsWith('${camel}') && !!v,
	);
}

export type ${type}DataKey = AllKeys<${type}Types>;

export type ${type}sWithKey<K extends ${type}DataKey> = {
	[P in ${type}Key]: K extends keyof ${type}TypeFor<P> ? P : never;
}[${type}Key];

export type ${type}WithKey<K extends ${type}DataKey> = {
	[P in ${type}sWithKey<K>]: ${type}With<${type}TypeFor<P>> &
		Partial<Record<Exclude<${type}Key, P>, undefined>>;
}[${type}sWithKey<K>];
`;

		const wrapper_props = interfaces.filter((i) => i.wrapper === camel);
		output += `
const ${camel}_slots: Record<${type}DataKey, readonly ${type}Key[]> = {
	${[...new Set(wrapper_props.flatMap((i) => i.props))]
		.map(
			(prop) =>
				`'${prop}': [${wrapper_props
					.filter((i) => i.props.includes(prop))
					.map((i) => `'${i.camel}'`)
					.join(', ')}]`,
		)
		.join(',\n\t')}
};

export function ${camel}HasKey<K extends ${type}DataKey>(
	node: ${type},
	key: K,
): node is ${type}WithKey<K> {
	return ${camel}_slots[key].some((slot) => !!node[slot]);
}

export const ${camel}Metadata = [
	${wrapper_props
		.map(
			(i) => `{
		name: '${i.name}',
		camel: '${i.camel}',
		wrapper: '${i.wrapper}',
		scope: '${i.scope}',
		props: [${i.props.map((p) => `'${p}'`).join(', ')}],
		with: ${i.wrapper}With${i.scope},
		is: is${TitleCase(i.wrapper)}${i.scope},
	}`,
		)
		.join(',\n\t')}
] as const;
`;
	});

	interfaces.forEach(({ name, camel, wrapper, scope }) => {
		output += `
export function ${wrapper}With${scope}(overrides?: Partial<${name}>) {
	return ${wrapper}With({
		${camel}: ${camel}(overrides),
	});
}
export function is${TitleCase(wrapper)}${scope}(
	node: ${TitleCase(wrapper)},
): node is ${TitleCase(wrapper)}With<${name}> {
	return !!node.${camel};
}
`;
	});

	return output;
}

function main() {
	const interfaces = get_interfaces();

	const output = generate(interfaces);

	fs.writeFileSync(output_file, output);
	console.log(`Generated ${output_file}`);
}

main();
