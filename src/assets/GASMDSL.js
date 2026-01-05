import { StreamLanguage } from '@codemirror/language';
import encoding from '@/assets/tools/encoding';

const instruction_map = encoding.load().COD.Level.InstructionData.Type;
const instructions_list = Object.keys(instruction_map).map((ins) =>
	ins.replace('In', '').toUpperCase(),
);
const instructions_regex = new RegExp(`(?:${instructions_list.join('|')})\\b`);

const special_reg_list = encoding.special_registers();
const special_reg_regex = new RegExp(`(${special_reg_list.join('|')})\\b`);

export const gasm = StreamLanguage.define({
	token(stream) {
		if (stream.eatSpace()) return null;

		if (stream.match(/;.*/, true)) return 'lineComment';

		// macro
		if (stream.match(/#(FOR|IF|END|DEFINE)/, true)) return 'regexp';

		// variable
		if (stream.match(/#[A-Za-z_][A-Za-z0-9_]*/, true)) return 'regexp';

		// keywords
		if (stream.match(instructions_regex, true)) return 'keyword';

		// registers
		if (stream.match(/[A-Za-z_][A-Za-z0-9_]*\.[.A-Za-z0-9_]*\b/, true))
			return 'variableName';
		if (stream.match(/R\d*\b/, true)) return 'variableName';
		// special registers
		if (stream.match(special_reg_regex, true)) return 'propertyName';

		// numbers
		if (stream.match(/\d+(?:\.\d+)?\b/, true)) return 'number';

		// labels
		if (stream.match(/[A-Za-z_][A-Za-z0-9_]*\b/, true)) return 'string';

		stream.next();
		return null;
	},
});
