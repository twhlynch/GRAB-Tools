import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const input_file = path.resolve('src/generated/proto.ts');
const output_file = path.resolve('src/generated/helpers.ts');

const source_text = fs.readFileSync(input_file, 'utf8');

const source_file = ts.createSourceFile(
	input_file,
	source_text,
	ts.ScriptTarget.Latest,
	true,
);

// collect all interface names
function get_interfaces() {
	const interfaces = new Set();

	source_file.forEachChild((node) => {
		if (ts.isInterfaceDeclaration(node)) interfaces.add(node.name.text);
	});

	return interfaces;
}

function has_default_comment(node) {
	const start = node.end;
	const eol = source_text.indexOf('\n', start);

	const end = eol === -1 ? source_text.length : eol;
	const slice = source_text.slice(start, end);

	const index = slice.indexOf('//');
	if (index === -1) return false;

	const comment = slice.slice(index + 2).trim();

	return comment === 'default';
}

function enum_member_is_zero(member) {
	const init = member.initializer;
	return init && ts.isNumericLiteral(init) && Number(init.text) === 0;
}

function get_enum_default(node) {
	// explicit // default
	for (const member of node.members) {
		if (has_default_comment(member)) {
			return member.name.getText(source_file);
		}
	}

	// explicit = 0
	for (const member of node.members) {
		if (enum_member_is_zero(member)) {
			return member.name.getText(source_file);
		}
	}

	// implicit first member if no specified value
	if (node.members.length > 0) {
		const init = node.members[0].initializer;
		if (init && ts.isNumericLiteral(init)) {
			return node.members[0].name.getText(source_file);
		}
	}
}

// collect enums and their 0 member
function get_enums() {
	const enums = new Map();

	source_file.forEachChild((node) => {
		if (!ts.isEnumDeclaration(node)) return;

		const name = node.name.text;
		let default_member = get_enum_default(node);

		enums.set(name, default_member);
	});

	return enums;
}

function get_comment(prop) {
	const comments = ts.getTrailingCommentRanges(source_text, prop.end);
	if (!comments) return;

	const comment = comments
		.map((c) => source_text.slice(c.pos, c.end).trim())
		.map((t) => t.replace(/^\/\/\s*/, '')) // remove leading //
		.join(' ');

	if (comment.length > 0) return comment;
}

function default_value_for_type(prop, interfaces, enums) {
	const type_name = prop.type.typeName.getText(source_file);

	if (type_name === 'Array') return `[]`;
	if (interfaces.has(type_name)) return `${camelCase(type_name)}()`;

	if (enums.has(type_name)) {
		const member = enums.get(type_name);
		if (member) return `proto.${type_name}.${member}`;
		return '0'; // fallback if no zero member
	}

	return '0';
}

// default value generator
function default_value(prop, interfaces, enums) {
	if (prop) {
		const comment = get_comment(prop);
		if (comment !== undefined) return comment;
	}

	if (!prop.type) return 'undefined';

	switch (prop.type.kind) {
		case ts.SyntaxKind.NumberKeyword:
			return '0';
		case ts.SyntaxKind.StringKeyword:
			return "''";
		case ts.SyntaxKind.BooleanKeyword:
			return 'false';
		case ts.SyntaxKind.ArrayType:
			return `[]`;
		case ts.SyntaxKind.TypeReference:
			return default_value_for_type(prop, interfaces, enums);
		default:
			return 'undefined';
	}
}

function camelCase(str) {
	return str.charAt(0).toLowerCase() + str.slice(1);
}

// generate output
function generate(interfaces, enums) {
	let output = `import * as proto from './proto';

function merge<T extends object>(target: T, source: Partial<T>): T {
	for (const key in source) {
		const srcVal = source[key];
		const tgtVal = target[key];

		if (
			srcVal !== undefined &&
			typeof srcVal === 'object' &&
			!Array.isArray(srcVal)
		) {
			if (
				!tgtVal ||
				typeof tgtVal !== 'object' ||
				Array.isArray(tgtVal)
			) {
				target[key] = {} as T[typeof key];
			}
			merge(
				target[key] as T[keyof T] & object,
				srcVal as Partial<T[keyof T]>,
			);
		} else {
			target[key] = srcVal as T[Extract<keyof T, string>];
		}
	}
	return target;
}

`;

	source_file.forEachChild((node) => {
		if (!ts.isInterfaceDeclaration(node)) return;

		const name = node.name.text;
		const func_name = camelCase(name);

		const properties = node.members
			.filter(ts.isPropertySignature)
			.map((prop) => {
				const propName = prop.name.getText(source_file);
				const def = default_value(prop, interfaces, enums);
				if (def === 'undefined') return null;
				return `${propName}: ${def},`;
			})
			.filter(Boolean);

		output += `
export function ${func_name}(overrides?: Partial<proto.${name}>): proto.${name} {
	const obj: proto.${name} = {
		${properties.join('\n\t\t')}
	};
	if (overrides) merge(obj, overrides);
	return obj;
}
`;
	});

	return output;
}

function main() {
	const enums = get_enums();
	const interfaces = get_interfaces();

	const output = generate(interfaces, enums);

	fs.writeFileSync(output_file, output);
	console.log(`Generated ${output_file}`);
}

main();
