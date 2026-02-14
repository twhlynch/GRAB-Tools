<script>
import { compile_gasm } from '@/assets/AssemblyConversion';
import build_editor from '@/assets/EditorSetup';
import { create_connection } from '@/assets/encoding/gasm/connections';
import {
	gasmCompletion,
	update_json_completions,
} from '@/assets/GASMCompletion';
import { gasm } from '@/assets/GASMDSL';
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
				],
				[...searchKeymap],
				(update) => {
					if (update.docChanged) {
						const asm = this.view.state.doc.toString();
						this.set_default_gasm(asm);
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
				const change = this.view.dispatch({ changes });
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
			const change = this.view.dispatch({ changes });
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
				const change = this.view.dispatch({ changes });
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
