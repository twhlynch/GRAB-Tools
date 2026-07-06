import build_editor from '@/editor/EditorSetup';
import { Level } from '@/generated/proto';
import {
	acceptCompletion,
	autocompletion,
	CompletionContext,
	CompletionResult,
} from '@codemirror/autocomplete';
import { completionPath, javascript } from '@codemirror/lang-javascript';
import { EditorSelection } from '@codemirror/state';
import { keymap, placeholder } from '@codemirror/view';
import { EditorView } from 'codemirror';

import { levelNodeGroupFrom } from '@/common/group';
import * as helpers from '@/generated/helpers';
import * as nodes from '@/generated/nodes';

const terminal_context = {
	...helpers,
	...nodes,
	levelNodeGroupFrom,
};

const completion_options = [
	{ label: 'LEVEL', type: 'keyword' },
	...Object.keys(terminal_context).map((key) => ({
		label: key,
		type: 'function' as const,
	})),
];

function completion(context: CompletionContext): CompletionResult | null {
	const info = completionPath(context);
	if (!info?.name) return null;

	const { path, name } = info;

	// dont complete paths
	if (path.length > 0) return null;

	// complete terminal context tokens
	const from = context.pos - name.length;
	const options = completion_options.filter(
		(opt) => opt.label.startsWith(name) && opt.label !== name,
	);
	return options.length ? { from, options } : null;
}

const placeholder_text = `
LEVEL.title = "Example code";

LEVEL.levelNodes.push(
  levelNodeWithStatic({
    scale: { y: 0.5 },
    material: 8,
  }),
);
`.trim();

export class Terminal {
	view: EditorView;

	constructor(element: HTMLElement) {
		this.view = build_editor(element, '', javascript(), [
			EditorView.lineWrapping,
			placeholder(placeholder_text),
			autocompletion({ override: [completion] }),
			keymap.of([
				{
					key: 'Tab',
					run: acceptCompletion,
				},
			]),
		]);
	}

	run_command(command: string, level: Level) {
		try {
			new Function('LEVEL', ...Object.keys(terminal_context), command)(
				level,
				...Object.values(terminal_context),
			);
		} catch (e) {
			console.error(e);
			if (e instanceof Error) {
				window.toast(e.message, 'error');
			}
		}
	}

	get() {
		return this.view.state.doc.toString();
	}

	clear() {
		this.view.dispatch({
			changes: {
				from: 0,
				to: this.view.state.doc.length,
				insert: '',
			},
		});
	}

	run(level: Level) {
		this.run_command(this.get(), level);
		this.clear();
	}

	focus() {
		this.view.focus();
		this.view.dispatch({
			selection: EditorSelection.cursor(this.view.state.doc.length),
			scrollIntoView: true,
		});
	}
}
