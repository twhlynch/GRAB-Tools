import encoding from '@/assets/tools/encoding';

const instruction_map = encoding.load().COD.Level.InstructionData.Type;
const operand_map = encoding.load().COD.Level.OperandData.Type;

const special_registers = encoding.special_registers();

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
	const processed_functions = preprocess_functions(lines);
	const processed_scopes = preprocess_scopes(processed_functions);
	return processed_scopes;
}

function preprocess_functions(lines) {
	const result = lines.flatMap((line) => {
		if (line.startsWith('#RAND')) {
			const [_, reg, from, to] = line.split(/\s+/);
			const diff = Number(to) - Number(from);
			return [
				`ADD ${reg} ${diff} 1`,
				`RAND ${reg} ${reg}`,
				`ADD ${reg} ${reg} ${from}`,
			];
		} else if (
			line.startsWith('#EQUAL') ||
			line.startsWith('#LESS') ||
			line.startsWith('#GREATER') ||
			line.startsWith('#AND') ||
			line.startsWith('#NOT') ||
			line.startsWith('#OR')
		) {
			const [ins, out, reg, cmp, label] = line.split(/\s+/);
			return [
				`${ins.slice(1)} ${out} ${reg} ${cmp}`,
				`IF ${out} ${label}`,
			];
		} else if (line.startsWith('#MIN') || line.startsWith('#MAX')) {
			const [ins, out, first, second, label] = line.split(/\s+/);
			return [
				`${
					ins === '#MIN' ? 'LESS' : 'GREATER'
				} ${out} ${first} ${second}`,
				`IF ${out} ${label}_1`,
				`SET ${out} ${second}`,
				`GOTO ${label}_2`,
				`LABEL ${label}_1`,
				`SET ${out} ${first}`,
				`LABEL ${label}_2`,
			];
		} else {
			return line;
		}
	});

	return result;
}

function preprocess_scopes(lines, context = {}) {
	const resolve = (val, ctx) => {
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

		if (directive === '#FOR') {
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
			const rhs = resolve(parts[2], context);

			const end = find_end(lines, i);

			if (lhs === rhs) {
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

	return {
		type: instruction_map[dirty_instruction(operator)],
		operands: operands.map((operand) =>
			operand_asm_to_json(operand, old_json),
		),
	};
}

function operand_asm_to_json(operand, old_json) {
	const labels = old_json.levelNodeGASM.program.labels;
	const inoutRegisters = old_json.levelNodeGASM.program.inoutRegisters ?? [];

	if (special_registers.includes(operand)) {
		return {
			type: operand_map['OpSpecialRegister'],
			index: special_registers.indexOf(operand),
		};
	} else if (/^-?\d+(\.\d+)?$/.test(operand)) {
		return {
			type: operand_map['OpConstant'],
			value: parseFloat(operand),
		};
	} else if (inoutRegisters.map((r) => r.name).includes(operand)) {
		const index = inoutRegisters.map((r) => r.name).indexOf(operand);
		const op = operand_map['OpInOutRegister'];
		return {
			type: op,
			index: index,
		};
	} else if (/^((R|IN|OUT)\d+)$/.test(operand)) {
		const match = operand.match(/^([A-Za-z]+)(\d+)$/);
		const op = operand_map[dirty_operand(match[1])];
		const index = match[2];
		return {
			type: op,
			index: parseInt(index),
		};
	} else {
		let index = labels.findIndex((label) => label.name === operand);
		if (index === -1) {
			labels.push({ name: operand });
			index = labels.length - 1;
		}
		return {
			type: operand_map['OpLabel'],
			index: index,
		};
	}
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
	const labels = json.levelNodeGASM.program.labels;
	const inoutRegisters = json.levelNodeGASM.program.inoutRegisters ?? [];

	const op = operand_map[operand.type ?? 0];
	if (op === 'OpConstant') {
		return `${operand.value}`;
	} else if (op === `OpLabel`) {
		return `${labels[operand.index].name}`;
	} else if (op === 'OpSpecialRegister') {
		return `${special_registers[operand.index]}`;
	} else if (op === 'OpInOutRegister') {
		return inoutRegisters[operand.index].name;
	}
	return `${clean_operand(op)}${operand.index}`;
}

function clean_operand(name) {
	return {
		OpInputRegister: 'IN',
		OpOutputRegister: 'OUT',
		OpWorkingRegister: 'R',
	}[name];
}

function dirty_operand(name) {
	return {
		IN: 'OpInputRegister',
		OUT: 'OpOutputRegister',
		R: 'OpWorkingRegister',
	}[name];
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
