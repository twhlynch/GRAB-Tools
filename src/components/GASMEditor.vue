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
	data() {
		return {
			current_page: 1,
			parent_page: 1,
			parent_page_text: '',
		};
	},
	computed: {
		...mapState(useConfigStore, ['vim_enabled', 'default_gasm']),
	},
	mounted() {
		this.create_editor();
	},
	methods: {
		...mapActions(useConfigStore, ['set_default_gasm']),
		create_editor() {
			this.view = build_editor(
				this.$refs.code_container,
				this.default_gasm ?? '',
				gasm,
				[
					foldGutter(),
					highlightSelectionMatches(),
					...(this.vim_enabled ? [vim()] : []),
					basicSetup,
					...gasmCompletion(),
					gasmDiagnostics,
				],
				[...searchKeymap],
				(update) => {
					if (update.docChanged) {
						const asm = this.view.state.doc.toString();
						this.set_default_gasm(asm);

						if (this.current_page != 0) {
							// page 0 (raw GASM) dosent compile back to any other tabs, so ignore parent changes
							this.parent_page_text = asm;
							this.parent_page = this.current_page;
						}
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
				const to = this.view.state.doc.length;
				const changes = { from: 0, to, insert };
				const _change = this.view.dispatch({ changes });
			} catch (e) {
				window.toast(e.message, 'error');
				return;
			}
		},
		undo() {
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
		switch_page(from, to) {
			this.current_page = to;
			if (to === this.parent_page) {
				// switching back to parent page with no changes made to other pages
				this.set(this.parent_page_text);
			}
			if (
				from === this.parent_page &&
				this.parent_page_text != this.view.state.doc.toString()
			) {
				this.parent_page_text = this.view.state.doc.toString();
			}
			if (to === 0) {
				// switch to raw GASM page
				let text;
				if (from === 1) {
					text = this.parent_page_text;
				} else {
					// TODO: call compile python code to GASM function
					text = '';
				}
				this.set(compile_gasm(text).join('\n'));
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
	height: 100%;
	background-color: #141415;
	display: grid;
	grid-template-rows: 1fr 0;
}
.code-container {
	overflow-y: scroll;
	max-height: 100%;
}
</style>
