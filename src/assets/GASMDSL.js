import { StreamLanguage } from '@codemirror/language';

export const gasm = StreamLanguage.define({
	token(stream) {
		if (stream.eatSpace()) return null;

		if (stream.match(/;.*/, true)) return 'lineComment';

		// keywords
		if (
			stream.match(
				/(?:NOOP|SET|SWAP|ADD|SUB|MUL|DIV|EQUAL|LESS|GREATER|AND|OR|NOT|LABEL|GOTO|IF|SLEEP|END|RAND)\b/,
				true,
			)
		)
			return 'keyword';

		// registers
		if (stream.match(/R\d+\b/, true)) return 'variableName';
		if (stream.match(/IN\d+\b/, true)) return 'variableName';
		if (stream.match(/OUT\d+\b/, true)) return 'variableName';

		// numbers
		if (stream.match(/\d+(?:\.\d+)?\b/, true)) return 'number';

		// labels
		if (stream.match(/[A-Za-z_][A-Za-z0-9_]*/, true)) return 'string';

		stream.next();
		return null;
	},
});
