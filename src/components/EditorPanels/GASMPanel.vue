<script>
import build_editor from '@/assets/EditorSetup';
import { foldGutter } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import AssemblyConversion from '@/assets/AssemblyConversion';
import { gasm } from '@/assets/GASMDSL';
import { vim } from '@replit/codemirror-vim';
import { basicSetup } from 'codemirror';

export default {
	data() {
		return {
			json: undefined,
		};
	},
	mounted() {
		this.view = build_editor(
			this.$refs.code_container,
			' ',
			gasm,
			[foldGutter(), highlightSelectionMatches(), vim(), basicSetup],
			[...searchKeymap],
		);
	},
	methods: {
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
