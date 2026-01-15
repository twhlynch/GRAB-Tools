<script>
import AssemblyConversion from '@/assets/AssemblyConversion';
import build_editor from '@/assets/EditorSetup';
import {
	gasmCompletion,
	update_json_completions,
	update_text_completions,
} from '@/assets/GASMCompletion';
import { gasm } from '@/assets/GASMDSL';
import { useConfigStore } from '@/stores/config';
import { foldGutter } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import { vim } from '@replit/codemirror-vim';
import { basicSetup } from 'codemirror';
import { mapState } from 'pinia';

export default {
	data() {
		return {
			json: undefined,
		};
	},
	computed: {
		...mapState(useConfigStore, ['vim_enabled']),
	},
	mounted() {
		this.create_editor();
	},
	methods: {
		create_editor() {
			this.view = build_editor(
				this.$refs.code_container,
				' ',
				gasm,
				[
					foldGutter(),
					highlightSelectionMatches(),
					...(this.vim_enabled ? [vim()] : []),
					basicSetup,
					...gasmCompletion(),
				],
				[...searchKeymap],
			);
		},
		set_json(json) {
			this.json = json;
			const asm = AssemblyConversion.json_to_asm(json);
			this.view.dispatch({
				changes: {
					from: 0,
					to: this.view.state.doc.length,
					insert: asm,
				},
			});

			update_json_completions(json);
			update_text_completions('');
		},
		save() {
			let data;
			try {
				data = AssemblyConversion.asm_to_json(
					this.view.state.doc.toString(),
					this.json,
				);
			} catch (e) {
				window.toast(e.message, 'error');
				return;
			}

			this.$emit('set', data);
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
	},
	emits: ['set'],
	watch: {
		vim_enabled() {
			const asm = this.view.state.doc.toString();

			this.view.dom.parentNode.removeChild(this.view.dom);
			this.view.destroy();

			this.create_editor();

			this.view.dispatch({
				changes: {
					from: 0,
					to: this.view.state.doc.length,
					insert: asm,
				},
			});

			if (this.json) {
				update_json_completions(this.json);
				update_text_completions('');
			}
		},
	},
};
</script>

<template>
	<section :ref="'editor'" @click="click">
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
