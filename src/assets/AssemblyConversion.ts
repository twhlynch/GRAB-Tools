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

function panic(message: string) {
	window.toast(message, 'err');
	return undefined;
}

// asm to json
export function asm_to_json(
	asm: string,
	old_json: LevelNodeWith<LevelNodeGASM>,
) {
	const node = safe_node(old_json);

	const code = compile_gasm(asm);

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
		.map((line) => (line.split(';')[0] ?? '').trim())
		.filter((line) => line.length);

	const code = preprocess_asm(lines);

	return code;
}

function preprocess_asm(lines: string[]): string[] {
	const processed_scopes = preprocess_scopes(lines);
	return processed_scopes;
}

function preprocess_scopes(
	lines: string[],
	context: Record<string, unknown> = {},
): string[] {
	const resolve = (val: string, ctx: Record<string, unknown>): unknown => {
		// an existing variable
		if (ctx[val] !== undefined) return ctx[val];
		// a number
		if (!isNaN(Number(val))) return Number(val);

		// a small equation `a+b`        non start +-/*%
		const [var_a, var_b] = val.split(/(?<!^)[+-/*%]/);

		if (var_a === undefined || var_b === undefined) {
			window.toast(`Invalid value: ${val}`, 'error');
			return NaN;
		}

		const a = resolve(var_a, context);
		const b = resolve(var_b, context);

		if (typeof a === 'number' && typeof b === 'number') {
			if (val.includes('+')) return a + b;
			else if (val.includes('*')) return a * b;
			else if (val.includes('/')) return a / b;
			else if (val.includes('%')) return a % b;
			else if (val.includes('-')) return a - b;
		}

		window.toast(`Invalid value: ${val}`, 'error');
		return undefined;
	};
	const substitute = (line: string, ctx: Record<string, unknown>): string => {
		let result = line;

		const sorted = Object.keys(ctx).sort((a, b) => b.length - a.length);

		for (const key of sorted) {
			const value = ctx[key];
			result = result.replaceAll(`#${key}`, String(value));
		}

		return result;
	};
	const find_end = (start: number): number => {
		let depth = 1;
		for (let i = start + 1; i < lines.length; i++) {
			const parts = lines[i]!.trim().split(/\s+/);
			const directive = parts[0];

			if (directive === DIRECTIVES.FOR || directive === DIRECTIVES.IF) {
				depth++;
			} else if (directive === DIRECTIVES.END) {
				depth--;
			}

			if (depth === 0) {
				return i;
			}
		}
		throw new Error(`Missing ${DIRECTIVES.END} for block at line ${start}`);
	};

	const output: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const [directive, ...parts] = line.trim().split(/\s+/);

		if (directive === DIRECTIVES.DEFINE) {
			const [variable, ...rest] = parts;
			if (variable === undefined) {
				window.toast(`Invalid directive: ${line}`, 'error');
				continue;
			}

			const setup = Object.keys(context)
				.map((v) => `let ${v} = ${JSON.stringify(context[v])};`)
				.join('');
			const expr = `(() => {${setup} return ${rest.join(' ')}})();`;
			console.log(expr);
			context[variable] = eval(expr);
		} else if (directive === DIRECTIVES.FOR) {
			const [var_name, start_arg, stop_arg, step_arg] = parts;
			if (
				var_name === undefined ||
				start_arg === undefined ||
				stop_arg === undefined
			) {
				window.toast(`Invalid directive: ${line}`, 'error');
				continue;
			}

			const start = resolve(start_arg, context);
			const stop = resolve(stop_arg, context);
			const step =
				step_arg !== undefined ? resolve(step_arg, context) : 1;

			if (
				typeof start !== 'number' ||
				typeof stop !== 'number' ||
				typeof step !== 'number'
			) {
				window.toast('Expected number at ' + line, 'error');
				continue;
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
			if (left === undefined || op === undefined || right === undefined) {
				window.toast(`Invalid directive: ${line}`, 'error');
				continue;
			}

			const lhs = resolve(left, context);
			const rhs = resolve(right, context);

			if (typeof lhs !== 'number' || typeof rhs !== 'number') {
				window.toast('Expected number at ' + line, 'error');
				continue;
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
	if (type === undefined) return panic(`Invalid instruction: ${instruction}`);

	const count = operand_counts[type]!;
	// handle labels with spaces (they must be the last operand)
	operands.push(operands.splice(count - 1, operands.length).join(' '));

	return {
		type,
		operands: operands
			.map((operand, i) => operand_asm_to_json(operand, type, i, node))
			.filter((operand) => {
				if (operand === undefined) panic(`Invalid operand: ${operand}`);
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

	return panic(`Failed to parse operand: ${operand}`);
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

	return panic(`Invalid operand type: ${type}`);
}

function clean_instruction(name: string): string {
	return name.replace('In', '').toUpperCase();
}

function dirty_instruction(name: string): string {
	return `In${name.charAt(0)}${name.toLowerCase().slice(1)}`;
}
