import { parse } from 'py-ast';

export function python_to_gasm(text: string): string {
	console.log(parse(text));
	return text;
}

export function gasm_to_python(text: string): string {
	return text;
}
