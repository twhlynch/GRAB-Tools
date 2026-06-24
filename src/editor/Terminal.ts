import build_editor from '@/editor/EditorSetup';
import { Level } from '@/generated/proto';
import { javascript } from '@codemirror/lang-javascript';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from 'codemirror';

export class Terminal {
	view: EditorView;

	constructor(element: HTMLElement) {
		this.view = build_editor(element, '', javascript(), [
			EditorView.lineWrapping,
		]);
	}

	run_command(command: string, level: Level) {
		try {
			new Function('level', command)(level);
		} catch (e) {
			console.error(e);
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
