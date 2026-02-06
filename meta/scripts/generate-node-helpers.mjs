import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const input_file = path.resolve('src/generated/proto.ts');
const output_file = path.resolve('src/generated/nodes.ts');

const source_text = fs.readFileSync(input_file, 'utf8');

const source_file = ts.createSourceFile(
	input_file,
	source_text,
	ts.ScriptTarget.Latest,
	true,
);

const wrapper_types = ['LevelNode', 'TriggerSource', 'TriggerTarget'];

function get_interfaces() {
	const interfaces = [];

	const wrapper_interfaces = [];
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
					wrapper.members.some((member) => member.name.text === camel)
				) {
					interfaces.push({
						name,
						camel,
						wrapper: camelCase(wrapper.name.text),
						scope: name.slice(wrapper.name.text.length),
					});
				}
			}
		}
	});

	return interfaces;
}

function camelCase(str) {
	return str.charAt(0).toLowerCase() + str.slice(1);
}

// generate output
function generate(interfaces) {
	let output = `
import { ${interfaces.map((i) => i.camel).join(', \n')} } from './helpers';
import { ${interfaces.map((i) => i.name).join(', \n')} } from './proto';
import { levelNodeWith, triggerSourceWith, triggerTargetWith } from './util';
`;

	interfaces.forEach(({ name, camel, wrapper, scope }) => {
		output += `
export function ${wrapper}With${scope}(overrides?: Partial<${name}>) {
	return ${wrapper}With({
		${camel}: ${camel}(overrides),
	});
}`;
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
