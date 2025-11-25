import encoding from '@/assets/tools/encoding';

const instruction_map = encoding.load().COD.Level.InstructionData.Type;
const operand_map = encoding.load().COD.Level.OperandData.Type;

// asm to json
function asm_to_json(asm, old_json) {
	old_json.levelNodeGASM.program.labels = [];

	const lines = asm
		.split('\n')
		.map((line) => line.split(';')[0].trim())
		.filter((line) => line.length);

	const instructions = lines.map((line) =>
		instruction_asm_to_json(line, old_json),
	);

	old_json.levelNodeGASM.program.instructions = instructions;

	return old_json;
}

function instruction_asm_to_json(instruction, old_json) {
	const parts = instruction.split(' ');
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

	if (/^-?\d+(\.\d+)?$/.test(operand)) {
		return {
			type: operand_map['OpConstant'],
			value: parseFloat(operand),
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

	const op = operand_map[operand.type ?? 0];
	if (op === 'OpConstant') {
		return `${operand.value}`;
	} else if (op === `OpLabel`) {
		return `${labels[operand.index].name}`;
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
