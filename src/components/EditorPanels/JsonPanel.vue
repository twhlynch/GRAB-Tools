<script>
import build_editor from '@/assets/EditorSetup';
import { json } from '@codemirror/lang-json';
import { foldGutter } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';

export default {
	data() {
		return {
			json: {},
			ignore_change: false,
		};
	},
	mounted() {
		this.view = build_editor(
			this.$refs.editor,
			JSON.stringify(this.json, null, 4),
			json(),
			[foldGutter(), highlightSelectionMatches()],
			[...searchKeymap],
			(update) => {
				if (update.docChanged && !this.ignore_change) {
					const new_json = this.view.state.doc.toString();
					const new_object = JSON.parse(new_json);
					if (
						JSON.stringify(this.json) !== JSON.stringify(new_object)
					) {
						this.$emit('changed', new_object);
						this.json = new_object;
					}
				}
			},
		);
	},
	methods: {
		set_json(json) {
			this.json = json;
			this.ignore_change = true;
			this.view.dispatch({
				changes: {
					from: 0,
					to: this.view.state.doc.length,
					insert: JSON.stringify(this.json, null, 4),
				},
			});
			this.ignore_change = false;
		},
		click(e) {
			if (e.target === this.$refs.editor) {
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
	emits: ['changed'],
};
</script>

<template>
	<section :ref="'editor'" @click="click"></section>
</template>

<style scoped>
section {
	width: 100%;
	height: 100%;
	overflow-y: scroll;
	background-color: #141415;
}
</style>
