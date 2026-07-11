<script>
import { create_connection } from '@/common/connections';
import { compile_gasm } from '@/editor/AssemblyConversion';
import build_editor from '@/editor/EditorSetup';
import {
	gasmCompletion,
	update_json_completions,
} from '@/editor/GASMCompletion';
import { gasmDiagnostics } from '@/editor/GASMDiagnostics';
import { gasm } from '@/editor/GASMDSL';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
//import { gasm_to_python, python_to_gasm } from '@/editor/GASMPythonConversion';
import { levelNodeWithGASM } from '@/generated/nodes';
import { useConfigStore } from '@/stores/config';
import { redo, undo } from '@codemirror/commands';
import { foldGutter } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import { vim } from '@replit/codemirror-vim';
import { basicSetup } from 'codemirror';
import { mapActions, mapState } from 'pinia';

export default {
	props: {
		output: Boolean,
	},
	emits: ['output', 'switch_tab'],
	data() {
		return {
			gasm_page: '',
			python_page: '',
			current_page: 0,
			lastaction_swaptab: false,
		};
	},
	computed: {
		...mapState(useConfigStore, [
			'vim_enabled',
			'default_gasm',
			'default_python',
			'default_page',
		]),
	},
	mounted() {
		this.create_editor();
	},
	methods: {
		...mapActions(useConfigStore, ['set_default_gasm_values']),
		create_editor() {
			this.current_page = this.default_page;
			this.gasm_page = this.default_gasm;
			this.python_page = this.default_python;
			this.view = build_editor(
				this.$refs.code_container,
				this.$props.output ? '' : (this.default_gasm ?? ''),
				gasm,
				[
					foldGutter(),
					highlightSelectionMatches(),
					...(this.vim_enabled ? [vim()] : []),
					basicSetup,
					...gasmCompletion(),
					gasmDiagnostics,
					EditorState.readOnly.of(this.$props.output),
					EditorView.editable.of(!this.$props.output),
				],
				[...searchKeymap],
				(update) => {
					if (update.docChanged && !this.$props.output) {
						const asm = this.view.state.doc.toString();
						this.lastaction_swaptab = false;

						if (this.current_page == 1) {
							this.python_page = asm;
						} else {
							this.gasm_page = asm;
							this.compile();
						}

						this.set_default_gasm_values(
							this.gasm_page,
							this.python_page,
							this.current_page,
						);
					}
				},
			);

			const node = levelNodeWithGASM();
			create_connection(node, undefined, 0, 'player', undefined);
			create_connection(node, undefined, 1, 'sign', 'Obj');
			create_connection(node, undefined, 1, 'position', 'Obj');
			create_connection(node, undefined, 1, 'rotation', 'Obj');
			create_connection(node, undefined, 1, 'scale', 'Obj');
			create_connection(node, undefined, 1, 'triggerActive', 'Obj');
			create_connection(node, undefined, 1, 'color', 'Obj');
			create_connection(node, undefined, 1, 'scale', 'Obj');
			create_connection(node, undefined, 1, 'physics', 'Obj');
			create_connection(node, undefined, 1, 'light', 'Obj');
			create_connection(node, undefined, 0, 'lobbyVariables', undefined);
			create_connection(node, undefined, 0, 'playerVariables', undefined);
			update_json_completions(node);
		},
		click(e) {
			if (e.target === this.$refs.code_container) {
				this.view.focus();
				this.view.dispatch({
					selection: EditorSelection.cursor(
						this.view.state.doc.length,
					),
					scrollIntoView: true,
				});
			}
		},
		compile() {
			try {
				const asm = this.view.state.doc.toString();
				const insert = compile_gasm(asm).join('\n');
				this.$emit('output', insert, false);
			} catch (e) {
				console.log(e.message);
				return;
			}
		},
		undo() {
			if (this.lastaction_swaptab) {
				this.$emit('switch_tab');
			}
			undo(this.view);
		},
		redo() {
			redo(this.view);
		},
		set(insert) {
			const to = this.view.state.doc.length;
			const changes = { from: 0, to, insert };
			const _change = this.view.dispatch({ changes });
		},
		set_sample(text) {
			console.log(this.current_page);
			if (this.current_page == 0) {
				this.set(text);
			} else {
				window.toast(
					'GASM samples cannot be loaded into the python window',
					'error',
				);
			}
		},
		// _from should be used if cross-tab interactability is added, which may be added in the future
		switch_page(_from, to) {
			this.current_page = to;
			this.lastaction_swaptab = true;
			if (to == 1) {
				this.set(this.python_page);
			} else {
				this.set(this.gasm_page);
			}
		},
		async copy() {
			try {
				const text = this.view.state.doc.toString();
				await navigator.clipboard.writeText(text);
			} catch (err) {
				window.toast(err, 'error');
			}
		},
		async paste() {
			try {
				const insert = await navigator.clipboard.readText();
				const to = this.view.state.doc.length;
				const changes = { from: 0, to, insert };
				const _change = this.view.dispatch({ changes });
			} catch (err) {
				window.toast(err, 'error');
			}
		},
	},
};
</script>

<template>
	<section ref="editor" @click="click">
		<div :ref="'code_container'" class="code-container"></div>
	</section>
</template>

<style scoped>
section {
	width: 100%;
	height: calc(100% - 30px);
	background-color: #141415;
	display: grid;
	grid-template-rows: 1fr 0;
}
.code-container {
	overflow-y: scroll;
}
</style>
