import encoding from '@/assets/tools/encoding';

const instruction_map = encoding.load().COD.Level.InstructionData.Type;
const operand_map = encoding.load().COD.Level.OperandData.Type;

const special_registers = encoding.special_registers();

const operand_counts = {
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

// asm to json
function asm_to_json(asm, old_json) {
	old_json.levelNodeGASM.program.labels = [];

	const lines = asm
		.split('\n')
		.map((line) => line.split(';')[0].trim())
		.filter((line) => line.length);

	const code = preprocess_asm(lines);

	const instructions = code.map((line) =>
		instruction_asm_to_json(line, old_json),
	);

	old_json.levelNodeGASM.program.instructions = instructions;

	return old_json;
}

function preprocess_asm(lines) {
	const processed_scopes = preprocess_scopes(lines);
	return processed_scopes;
}

function preprocess_scopes(lines, context = {}) {
	const resolve = (val, ctx) => {
		const parts = val.split(/[+-/*%]/);
		if (val.includes('+'))
			val = resolve(parts[0], context) + resolve(parts[1], context);
		else if (val.includes('-') && val.charAt(0) !== '-')
			val = resolve(parts[0], context) - resolve(parts[1], context);
		else if (val.includes('*'))
			val = resolve(parts[0], context) * resolve(parts[1], context);
		else if (val.includes('/'))
			val = resolve(parts[0], context) / resolve(parts[1], context);
		else if (val.includes('%'))
			val = resolve(parts[0], context) % resolve(parts[1], context);
		if (!isNaN(Number(val))) return Number(val);
		return ctx[val] ?? val;
	};
	const substitute = (line, ctx) => {
		let result = line;

		const sorted = Object.keys(ctx).sort((a, b) => b.length - a.length);

		for (const key of sorted) {
			const value = ctx[key];
			result = result.replaceAll(`#${key}`, value);
		}

		return result;
	};
	const find_end = (lines, start) => {
		let depth = 1;
		for (let i = start + 1; i < lines.length; i++) {
			const parts = lines[i].trim().split(/\s+/);
			const directive = parts[0];

			if (directive === '#FOR' || directive === '#IF') {
				depth++;
			} else if (directive === '#END') {
				depth--;
			}

			if (depth === 0) {
				return i;
			}
		}
		throw new Error(`Missing #END for block at line ${start}`);
	};

	let output = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const parts = trimmed.split(/\s+/);
		const directive = parts[0];

		if (directive === '#DEFINE') {
			const [_, variable, ...rest] = parts;
			const setup = Object.keys(context)
				.map((v) => `let ${v} = ${context[v]};`)
				.join('');
			const expr = `(() => {${setup} return ${rest.join(' ')}})();`;
			context[variable] = eval(expr);
		} else if (directive === '#FOR') {
			const varName = parts[1];

			const start = resolve(parts[2], context);
			const stop = resolve(parts[3], context);
			const step = parts[4] ? resolve(parts[4], context) : 1;

			const end = find_end(lines, i);
			const block = lines.slice(i + 1, end);

			for (let val = start; val <= stop; val += step) {
				const ctx = { ...context, [varName]: val };

				const block_output = preprocess_scopes(block, ctx);
				output.push(...block_output);
			}

			i = end;
		} else if (directive === '#IF') {
			const lhs = resolve(parts[1], context);
			const op = parts[2];
			const rhs = resolve(parts[3], context);

			const end = find_end(lines, i);

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
		} else if (directive === '#END') {
			continue;
		} else {
			output.push(substitute(line, context));
		}
	}

	return output;
}

function instruction_asm_to_json(instruction, old_json) {
	const parts = instruction.split(/\s+/);
	const operator = parts[0];
	const operands = parts.slice(1);

	const type = instruction_map[dirty_instruction(operator)];
	const count = operand_counts[type];
	// handle labels with spaces (they must be the last operand)
	operands.push(operands.splice(count - 1, operands.length).join(' '));

	return {
		type,
		operands: operands
			.map((operand, i) =>
				operand_asm_to_json(operand, type, i, old_json),
			)
			.filter(Boolean),
	};
}

function operand_asm_to_json(operand, instruction, index, old_json) {
	const program = old_json.levelNodeGASM.program;
	const labels = program.labels;
	const inoutRegisters = (program.inoutRegisters ?? []).map((r) => r.name);
	const inRegisters = (program.inputRegisters ?? []).map((r) => r.name);
	const outRegisters = (program.outputRegisters ?? []).map((r) => r.name);

	const is_label =
		(instruction === instruction_map.InLabel ||
			instruction === instruction_map.InGoto ||
			instruction === instruction_map.InIf) &&
		index === operand_counts[instruction] - 1;

	if (is_label) {
		let index = labels.findIndex((label) => label.name === operand);
		if (index === -1) {
			labels.push({ name: operand });
			index = labels.length - 1;
		}
		return {
			type: operand_map.OpLabel,
			index: index,
		};
	}
	if (special_registers.includes(operand)) {
		return {
			type: operand_map.OpSpecialRegister,
			index: special_registers.indexOf(operand),
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

	window.toast(`Failed to parse ${operand}`, 'warn');
	return undefined;
}

// json to asm
function json_to_asm(json) {
	const instructions = json.levelNodeGASM.program.instructions;

	const code = instructions.map((instruction) =>
		instruction_json_to_asm(instruction, json),
	);

	return `${code.join('\n')}`;
}

function instruction_json_to_asm(instruction, json) {
	const operator = instruction_map[instruction.type ?? 0];
	const operands = instruction.operands.map((operand) =>
		operand_json_to_asm(operand, json),
	);
	return `${clean_instruction(operator)} ${operands.join(' ')}`;
}

function operand_json_to_asm(operand, json) {
	const program = json.levelNodeGASM.program;
	const labels = program.labels;
	const inoutRegisters = program.inoutRegisters ?? [];
	const inRegisters = program.inputRegisters ?? [];
	const outRegisters = program.outputRegisters ?? [];

	const type = operand.type ?? 0;
	const index = operand.index ?? 0;
	const value = operand.value ?? 0;
	const ops = operand_map;

	if (type === ops.OpConstant) {
		return `${value}`;
	}
	if (type === ops.OpLabel) {
		return `${labels[index].name}`;
	}
	if (type === ops.OpSpecialRegister) {
		return `${special_registers[index]}`;
	}
	if (type === ops.OpInOutRegister) {
		return inoutRegisters[index].name;
	}
	if (type === ops.OpInputRegister) {
		return inRegisters[index].name;
	}
	if (type === ops.OpOutputRegister) {
		return outRegisters[index].name;
	}
	if (type === ops.OpWorkingRegister) {
		return `R${index}`;
	}

	return '';
}

function clean_instruction(name) {
	return name.replace('In', '').toUpperCase();
}

function dirty_instruction(name) {
	return `In${name.charAt(0)}${name.toLowerCase().slice(1)}`;
}

export default {
	asm_to_json,
	json_to_asm,
};
