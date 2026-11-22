<script lang="ts">
import { markRawStrict, StrictRaw } from '@/common/utils';
import { asm_to_json, json_to_asm } from '@/editor/AssemblyConversion';
import build_editor from '@/editor/EditorSetup';
import {
	gasmCompletion,
	update_json_completions,
	update_text_completions,
} from '@/editor/GASMCompletion';
import { gasm } from '@/editor/GASMDSL';
import { useConfigStore } from '@/stores/config';
import { foldGutter } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import { LevelNodeWith } from '@grab-tools/lib/generated/nodes';
import { LevelNodeGASM } from '@grab-tools/lib/generated/proto';
import { vim } from '@replit/codemirror-vim';
import { basicSetup, EditorView } from 'codemirror';
import { mapState } from 'pinia';
import { defineComponent } from 'vue';

export default defineComponent({
	emits: {
		set: (_: LevelNodeWith<LevelNodeGASM>) => true,
	},
	data() {
		return {
			json: undefined as StrictRaw<LevelNodeWith<LevelNodeGASM>> | undefined,
			view: null! as StrictRaw<EditorView>,
		};
	},
	computed: {
		...mapState(useConfigStore, ['vim_enabled']),
	},
	watch: {
		vim_enabled() {
			const asm = this.view.state.doc.toString();

			this.view.dom.parentNode!.removeChild(this.view.dom);
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
	mounted() {
		this.create_editor();
	},
	methods: {
		create_editor() {
			this.view = markRawStrict(
				build_editor(
					this.$refs.code_container as HTMLElement,
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
				),
			);
		},
		set_json(json: LevelNodeWith<LevelNodeGASM>) {
			this.json = markRawStrict(json);
			const asm = json_to_asm(json);
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
				data = asm_to_json(this.view.state.doc.toString(), this.json!);
			} catch (e) {
				if (e instanceof Error) {
					window.toast(e.message, 'error');
				}
				return;
			}

			if (data) {
				this.$emit('set', data);
			}
		},
		click(e: Event) {
			if (e.target === (this.$refs.code_container as HTMLElement)) {
				this.view.focus();
				this.view.dispatch({
					selection: EditorSelection.cursor(this.view.state.doc.length),
					scrollIntoView: true,
				});
			}
		},
	},
});
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
