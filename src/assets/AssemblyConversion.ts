import { SPECIAL_REGISTERS } from '@/assets/encoding/gasm/registers';
import { load } from '@/assets/encoding/root';
import {
	InstructionData,
	InstructionDataType,
	LevelNodeGASM,
	LevelNodeGASMConnection,
	OperandData,
	ProgramData,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';

const instruction_map = load().COD.Level.InstructionData.Type;
const operand_map = load().COD.Level.OperandData.Type;
const operand_counts: Record<InstructionDataType, number> = {
	[instruction_map.InNoop]: 0,
	[instruction_map.InSet]: 2,
	[instruction_map.InSwap]: 2,
	[instruction_map.InAdd]: 3,
	[instruction_map.InSub]: 3,
	[instruction_map.InMul]: 3,
	[instruction_map.InDiv]: 3,
	[instruction_map.InEqual]: 3,
	[instruction_map.InLess]: 3,
	[instruction_map.InGreater]: 3,
	[instruction_map.InAnd]: 3,
	[instruction_map.InOr]: 3,
	[instruction_map.InNot]: 2,
	[instruction_map.InLabel]: 1,
	[instruction_map.InGoto]: 1,
	[instruction_map.InIf]: 2,
	[instruction_map.InSleep]: 1,
	[instruction_map.InEnd]: 0,
	[instruction_map.InRand]: 2,
	[instruction_map.InFloor]: 2,
	[instruction_map.InMod]: 3,
	[instruction_map.InSin]: 2,
	[instruction_map.InCos]: 2,
	[instruction_map.InSqrt]: 2,
	[instruction_map.InAtan2]: 3,
};
export const DIRECTIVES = {
	FOR: '#FOR',
	IF: '#IF',
	END: '#END',
	DEFINE: '#DEFINE',
};

// helper
type SafeNode = {
	program: Required<ProgramData>;
	connections: LevelNodeGASMConnection[];
};
function safe_node(object: LevelNodeWith<LevelNodeGASM>): SafeNode {
	const node = object.levelNodeGASM;

	const program = (node.program ??= {});
	const connections = (node.connections ??= []);
	const instructions = (program.instructions ??= []);
	const labels = (program.labels ??= []);
	const workingRegisters = (program.workingRegisters ??= []);
	const inoutRegisters = (program.inoutRegisters ??= []);
	const inputRegisters = (program.inputRegisters ??= []);
	const outputRegisters = (program.outputRegisters ??= []);

	return {
		program: {
			instructions,
			labels,
			workingRegisters,
			inoutRegisters,
			inputRegisters,
			outputRegisters,
		},
		connections,
	};
}

// asm to json
export function asm_to_json(
	asm: string,
	old_json: LevelNodeWith<LevelNodeGASM>,
) {
	const node = safe_node(old_json);

	let code;
	try {
		code = compile_gasm(asm);
	} catch (e) {
		if (e instanceof Error) {
			window.toast(e, 'error');
		}
		return undefined;
	}

	const instructions = code
		.map((line) => {
			const json = instruction_asm_to_json(line, node);
			if (!json) window.toast(`Invalid instruction: ${line}`, 'warn');
			return json;
		})
		.filter((i) => i !== undefined);

	node.program.instructions.length = 0;
	node.program.instructions.push(...instructions);

	return old_json;
}

export function compile_gasm(asm: string): string[] {
	const lines = asm
		.split('\n')
		.map((line) => (line.split(';')[0] ?? '').trim());

	const code = preprocess_asm(lines);

	return code.filter((line) => line.length);
}

function preprocess_asm(str_lines: string[]): string[] {
	let lines = parse_lines(str_lines);
	lines = preprocess_scopes(lines);
	preprocess_characters(lines);
	verify_labels(lines);
	verify_lengths(lines);
	return join_lines(lines);
}

interface Line {
	number: number;
	string: string;
	operator: string;
	operands: string[];
	operator_id?: InstructionDataType; // also used as 'is macro'
}

interface CompilerError extends Error {
	line?: number;
}

function err(message: string, line: Line) {
	const current = `${line.operator} ${line.operands.join(' ')}`;
	let error_message = `${message} at '${current}'`;
	if (current != line.string) {
		error_message += ` (from '${line.string}')`;
	}

	const e: CompilerError = new Error(error_message);
	e.line = line.number;

	return e;
}

function join_lines(lines: Line[]): string[] {
	const strings: string[] = [];

	for (const line of lines) {
		const string = `${line.operator} ${line.operands.join(' ')}`;
		if (string.includes('#')) {
			throw err(`Undefined macro`, line);
		}
		strings.push(string);
	}

	return strings;
}

function verify_lengths(lines: Line[]) {
	for (const line of lines) {
		const { operator_id, operands, operator } = line;

		if (operator_id === undefined) continue;

		const count = operand_counts[operator_id];
		if (count === undefined) {
			throw err(`Invalid operator '${operator}'`, line);
		}

		const has_label =
			operator_id === instruction_map.InLabel ||
			operator_id === instruction_map.InGoto ||
			operator_id === instruction_map.InIf;

		if (has_label) {
			if (operands.length < count) {
				throw err(
					`Expected ${count} operands, found ${operands.length}`,
					line,
				);
			}
		} else {
			if (count !== operands.length) {
				throw err(
					`Expected ${count} operands, found ${operands.length}`,
					line,
				);
			}
		}
	}
}

function parse_lines(strings: string[]): Line[] {
	const lines: Line[] = [];

	for (let i = 0; i < strings.length; i++) {
		const string = strings[i]!;
		if (!string.length) continue;

		const number = i + 1;
		const is_macro = string[0] === '#';

		// split words and 'characters'
		const parts = string.match(/'.*'|\S+/g) ?? [];
		if (!parts.length) continue;

		const [operator, ...operands] = parts;
		if (!operator) continue;

		const line: Line = {
			number,
			string,
			operator,
			operands,
		};

		if (!is_macro) {
			const key = dirty_instruction(operator);
			const operator_id = instruction_map[key] as InstructionDataType;

			if (!operator_id) {
				throw err(`Invalid operator '${operator}'`, line);
			}

			const count = operand_counts[operator_id];
			if (count === undefined) {
				throw err(`Invalid operator '${operator}'`, line);
			}

			line.operator_id = operator_id;

			const has_label =
				operator_id === instruction_map.InLabel ||
				operator_id === instruction_map.InGoto ||
				operator_id === instruction_map.InIf;

			if (has_label) {
				if (operands.length < count) {
					throw err(
						`Expected ${count} operands, found ${operands.length}`,
						line,
					);
				}

				// combine label into a single operand
				line.operands = [
					...operands.slice(0, count - 1),
					operands.slice(count - 1).join(' '),
				];
			} else {
				if (count !== operands.length) {
					throw err(
						`Expected ${count} operands, found ${operands.length}`,
						line,
					);
				}
			}
		}

		lines.push(line);
	}

	return lines;
}

function verify_labels(lines: Line[]) {
	const labels = new Set<string>();

	for (const line of lines) {
		if (line.operator_id !== instruction_map.InLabel) continue;
		if (line.operands.length === 0) continue;

		const label = line.operands[line.operands.length - 1]!;
		labels.add(label);
	}

	for (const line of lines) {
		if (
			line.operator_id !== instruction_map.InGoto &&
			line.operator_id !== instruction_map.InIf
		)
			continue;
		if (line.operands.length === 0) continue;

		const label = line.operands[line.operands.length - 1]!;
		if (!labels.has(label)) {
			throw err(`Unknown label '${label}'`, line);
		}
	}
}

function preprocess_characters(lines: Line[]) {
	for (const line of lines) {
		if (line.operator_id === undefined) continue;
		const has_label =
			line.operator_id === instruction_map.InGoto ||
			line.operator_id === instruction_map.InIf ||
			line.operator_id === instruction_map.InLabel;

		for (let j = 0; j < line.operands.length; j++) {
			if (has_label && j === operand_counts[line.operator_id] - 1)
				continue;

			const operand = line.operands[j]!;

			if (operand[0] === "'" && operand[operand.length - 1] === "'") {
				if (operand.length === 3) {
					line.operands[j] = String(operand.charCodeAt(1));
				} else {
					throw err(`Invalid character ${operand}`, line);
				}
			}
		}
	}
}

function regroup_operands(line: Line) {
	const { operator_id, operands } = line;
	if (operator_id === undefined) return;

	const count = operand_counts[operator_id];
	if (count === undefined) return;

	const has_label =
		operator_id === instruction_map.InLabel ||
		operator_id === instruction_map.InGoto ||
		operator_id === instruction_map.InIf;

	const separated = operands.flatMap((op) => op.match(/'.*'|\S+/g) ?? []);

	if (has_label) {
		// combine label into a single operand
		line.operands = [
			...separated.slice(0, count - 1),
			separated.slice(count - 1).join(' '),
		];
	} else {
		line.operands = separated;
	}
}

function preprocess_scopes(
	lines: Line[],
	context: Record<string, unknown> = {},
): Line[] {
	const resolve = (
		val: string,
		ctx: Record<string, unknown>,
		line: Line,
	): unknown => {
		// an existing variable
		if (ctx[val] !== undefined) return ctx[val];
		// a number
		if (!isNaN(Number(val))) return Number(val);

		// a small equation `a+b`        non start +-/*%
		const [var_a, var_b] = val.split(/(?<!^)[+-/*%]/);

		if (var_a === undefined || var_b === undefined) {
			throw err(`Invalid value '${val}'`, line);
		}

		const a = resolve(var_a, ctx, line);
		const b = resolve(var_b, ctx, line);

		if (typeof a === 'number' && typeof b === 'number') {
			if (val.includes('+')) return a + b;
			else if (val.includes('*')) return a * b;
			else if (val.includes('/')) return a / b;
			else if (val.includes('%')) return a % b;
			else if (val.includes('-')) return a - b;
		}

		throw err(`Invalid value '${val}'`, line);
	};
	const substitute = (line: Line, ctx: Record<string, unknown>): Line => {
		const sorted = Object.keys(ctx).sort((a, b) => b.length - a.length);

		const new_operands: string[] = [];

		for (const operand of line.operands) {
			let updated = operand;

			for (const key of sorted) {
				const value = ctx[key];
				updated = updated.replaceAll(`#${key}`, String(value));
			}

			const split = updated.match(/'.*'|\S+/g) ?? [];
			new_operands.push(...split);
		}

		const result: Line = {
			...line,
			operands: new_operands,
		};

		regroup_operands(result);

		return result;
	};
	const find_end = (start: number): number => {
		let depth = 1;
		for (let i = start + 1; i < lines.length; i++) {
			const line = lines[i]!;
			const directive = line.operator;

			if (directive === DIRECTIVES.FOR || directive === DIRECTIVES.IF) {
				depth++;
			} else if (directive === DIRECTIVES.END) {
				depth--;
			}

			if (depth === 0) {
				return i;
			}
		}

		throw err(`Missing ${DIRECTIVES.END}`, lines[start]!);
	};

	const output: Line[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const directive = line.operator;
		const parts = line.operands;

		if (directive === DIRECTIVES.DEFINE) {
			const [variable, ...rest] = parts;
			if (variable === undefined) {
				throw err(`Expected variable name`, line);
			}
			if (rest.length === 0) {
				throw err(`Expected expression`, line);
			}

			const setup = Object.keys(context)
				.map((v) => `let ${v} = ${JSON.stringify(context[v])};`)
				.join('');
			const expr = `(() => {${setup} return ${rest.join(' ')}})();`;
			try {
				context[variable] = eval(expr);
			} catch (e) {
				if (e instanceof Error) {
					throw err(e.message, line);
				}
			}
			if (context[variable] === undefined) {
				throw err(
					`Expression '${rest.join(' ')}' results in undefined`,
					line,
				);
			}
		} else if (directive === DIRECTIVES.FOR) {
			const [var_name, start_arg, stop_arg, step_arg] = parts;
			if (var_name === undefined) {
				throw err(`Expected variable name`, line);
			}
			if (start_arg === undefined) {
				throw err(`Expected argument 1 'start'`, line);
			}
			if (stop_arg === undefined) {
				throw err(`Expected argument 2 'start'`, line);
			}

			const start = resolve(start_arg, context, line);
			const stop = resolve(stop_arg, context, line);
			const step =
				step_arg !== undefined ? resolve(step_arg, context, line) : 1;

			if (typeof start !== 'number') {
				throw err(`Expected number but found '${start_arg}'`, line);
			}
			if (typeof stop !== 'number') {
				throw err(`Expected number but found '${stop_arg}'`, line);
			}
			if (typeof step !== 'number') {
				throw err(`Expected number but found '${step_arg}'`, line);
			}

			const end = find_end(i);
			const block = lines.slice(i + 1, end);

			for (let val = start; val <= stop; val += step) {
				const ctx = { ...context, [var_name]: val };

				const block_output = preprocess_scopes(block, ctx);
				output.push(...block_output);
			}

			i = end;
		} else if (directive === DIRECTIVES.IF) {
			const [left, op, right] = parts;
			if (left === undefined) {
				throw err(`Expected argument 1 'left'`, line);
			}
			if (op === undefined) {
				throw err(`Expected operator`, line);
			}
			if (right === undefined) {
				throw err(`Expected argument 2 'right'`, line);
			}

			const lhs = resolve(left, context, line);
			const rhs = resolve(right, context, line);

			if (typeof lhs !== 'number') {
				throw err(`Expected number but found '${left}'`, line);
			}
			if (typeof rhs !== 'number') {
				throw err(`Expected number but found '${right}'`, line);
			}

			const end = find_end(i);

			const cond =
				(op === '==' && lhs == rhs) ||
				(op === '>' && lhs > rhs) ||
				(op === '>=' && lhs >= rhs) ||
				(op === '<' && lhs < rhs) ||
				(op === '<=' && lhs <= rhs) ||
				(op === '!=' && lhs != rhs);

			if (cond) {
				const block = lines.slice(i + 1, end);
				const block_output = preprocess_scopes(block, context);
				output.push(...block_output);
			}

			i = end;
		} else if (directive === DIRECTIVES.END) {
			continue;
		} else if (directive[0] === '#') {
			throw err(`Unknown directive`, line);
		} else {
			output.push(substitute(line, context));
		}
	}

	return output;
}

function instruction_asm_to_json(
	instruction: string,
	node: SafeNode,
): InstructionData | undefined {
	const parts = instruction.split(/\s+/);
	const operator = parts[0]!;
	const operands = parts.slice(1);

	const dirty = dirty_instruction(operator);
	const type = instruction_map[dirty] as InstructionDataType;
	if (type === undefined) {
		window.toast(`Invalid instruction: ${instruction}`, 'error');
		return undefined;
	}

	const count = operand_counts[type]!;
	// handle labels with spaces (they must be the last operand)
	operands.push(operands.splice(count - 1, operands.length).join(' '));

	return {
		type,
		operands: operands
			.map((operand, i) => operand_asm_to_json(operand, type, i, node))
			.filter((operand) => {
				if (operand === undefined)
					window.toast(`Invalid operand: ${operand}`, 'error');
				return operand !== undefined;
			}),
	};
}

function operand_asm_to_json(
	operand: string,
	instruction: number,
	index: number,
	node: SafeNode,
): OperandData | undefined {
	const program = node.program;
	const labels = program.labels;
	const inoutRegisters = program.inoutRegisters.map((r) => r.name);
	const inRegisters = program.inputRegisters.map((r) => r.name);
	const outRegisters = program.outputRegisters.map((r) => r.name);

	const is_label =
		(instruction === instruction_map.InLabel ||
			instruction === instruction_map.InGoto ||
			instruction === instruction_map.InIf) &&
		index === operand_counts[instruction] - 1;

	if (is_label) {
		let idx = labels.findIndex((label) => label.name === operand);
		if (idx === -1) {
			labels.push({ name: operand });
			idx = labels.length - 1;
		}
		return {
			type: operand_map.OpLabel,
			index: idx,
		};
	}
	if (SPECIAL_REGISTERS.includes(operand)) {
		return {
			type: operand_map.OpSpecialRegister,
			index: SPECIAL_REGISTERS.indexOf(operand),
		};
	}
	if (inoutRegisters.includes(operand)) {
		return {
			type: operand_map.OpInOutRegister,
			index: inoutRegisters.indexOf(operand),
		};
	}
	if (inRegisters.includes(operand)) {
		return {
			type: operand_map.OpInputRegister,
			index: inRegisters.indexOf(operand),
		};
	}
	if (outRegisters.includes(operand)) {
		return {
			type: operand_map.OpOutputRegister,
			index: outRegisters.indexOf(operand),
		};
	}
	if (/^R\d+$/.test(operand)) {
		return {
			type: operand_map.OpWorkingRegister,
			index: parseInt(operand.slice(1)),
		};
	}
	if (/^-?\d+(\.\d+)?$/.test(operand)) {
		return {
			type: operand_map.OpConstant,
			value: parseFloat(operand),
		};
	}
	if (/^'.'$/.test(operand)) {
		return {
			type: operand_map.OpConstant,
			value: operand.charCodeAt(1),
		};
	}

	window.toast(`Failed to parse operand: ${operand}`, 'error');
	return undefined;
}

// json to asm
export function json_to_asm(json: LevelNodeWith<LevelNodeGASM>): string {
	const node = safe_node(json);

	const { instructions } = node.program;

	const code = instructions.map((instruction) =>
		instruction_json_to_asm(instruction, node),
	);

	return `${code.join('\n')}`;
}

function instruction_json_to_asm(
	instruction: InstructionData,
	node: SafeNode,
): string {
	instruction.operands ??= [];

	const mapped = instruction_map[instruction.type ?? 0];
	const operator = clean_instruction(mapped);
	const operands = instruction.operands.map(
		(operand) => operand_json_to_asm(operand, node) ?? '',
	);

	const errors = [];
	if (mapped === undefined) errors.push('; ERROR: Invalid operator');
	if (operands.includes('')) errors.push('; ERROR: Invalid operand');

	const comment = errors.length ? ';' : '';

	return comment + [operator, ...operands, ...errors].join(' ');
}

function operand_json_to_asm(
	operand: OperandData,
	node: SafeNode,
): string | undefined {
	const { labels, inoutRegisters, inputRegisters, outputRegisters } =
		node.program;

	const type = operand.type ?? 0;
	const index = operand.index ?? 0;
	const value = operand.value ?? 0;

	// prettier-ignore
	switch (type) {
		case operand_map.OpConstant:        return `${value}`;
		case operand_map.OpLabel:           return labels[index]?.name;
		case operand_map.OpSpecialRegister: return SPECIAL_REGISTERS[index]
		case operand_map.OpInOutRegister:   return inoutRegisters[index]?.name;
		case operand_map.OpInputRegister:   return inputRegisters[index]?.name;
		case operand_map.OpOutputRegister:  return outputRegisters[index]?.name;
		case operand_map.OpWorkingRegister: return `R${index}`;
	}

	window.toast(`Invalid operand type: ${type}`, 'error');
	return undefined;
}

function clean_instruction(name: string): string {
	return name.replace('In', '').toUpperCase();
}

function dirty_instruction(name: string): string {
	return `In${name.charAt(0)}${name.toLowerCase().slice(1)}`;
}
