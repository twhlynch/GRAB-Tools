import encoding from '@/assets/tools/encoding';
import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { EditorView } from 'codemirror';

const instruction_map = encoding.load().COD.Level.InstructionData.Type;
const instructions_list = Object.keys(instruction_map)
	.map((ins) => ins.replace('In', '').toUpperCase())
	.map((label) => ({
		label,
		type: 'function',
	}));

const special_registers = encoding.special_registers().map((label) => ({
	label,
	type: 'class',
}));

let node_completions = [];
let json_completions = [];

export function update_json_completions(node) {
	const labels = node.levelNodeGASM.program.labels;
	const iregisters = node.levelNodeGASM.program.inputRegisters;
	const oregisters = node.levelNodeGASM.program.outputRegisters;
	const ioregisters = node.levelNodeGASM.program.inoutRegisters;
	json_completions = [...labels, ...iregisters, ...oregisters, ...ioregisters]
		.map((e) => e.name)
		.map((label) => ({
			label,
			type: 'variable',
		}));
}

export function update_text_completions(text) {
	node_completions = text
		.trim()
		.split(/\s+/)
		.map((label) => ({
			label,
			type: 'type',
		}));
}

function completion(context) {
	let word = context.matchBefore(/[^\s]*/);
	if (word.from === word.to && !context.explicit) return null;

	const completions_list = [
		...new Map(
			[
				...node_completions,
				...json_completions,
				...special_registers,
				...instructions_list,
			].map((item) => [item.label, item]),
		).values(),
	];

	const options = completions_list.filter(
		(completion) =>
			completion.label.toLowerCase().includes(word.text.toLowerCase()) &&
			completion.label.toLowerCase() !== word.text.toLowerCase(),
	);

	return {
		from: word.from,
		options: options,
	};
}

function updater() {
	return EditorView.updateListener.of((update) => {
		if (!update.docChanged) return;
		update_text_completions(update.view.state.doc.toString());
	});
}

function tab_complete() {
	return keymap.of([
		{
			key: 'Tab',
			run: acceptCompletion,
		},
	]);
}

export function gasmCompletion() {
	return [
		autocompletion({ override: [completion] }),
		updater(),
		tab_complete(),
	];
}
