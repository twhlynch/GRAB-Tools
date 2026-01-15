<script>
import build_editor from '@/assets/EditorSetup';
import { foldGutter, StreamLanguage } from '@codemirror/language';
import { protobuf } from '@codemirror/legacy-modes/mode/protobuf';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';

export default {
	mounted() {
		this.view = build_editor(
			this.$refs.code_container,
			'',
			StreamLanguage.define(protobuf),
			[foldGutter(), highlightSelectionMatches()],
			[...searchKeymap],
		);
	},
	methods: {
		save() {
			this.$emit('set', this.view.state.doc.toString());
		},
		close() {
			this.$emit('close');
		},
		set(protobuf) {
			this.view.dispatch({
				changes: {
					from: 0,
					to: this.view.state.doc.length,
					insert: protobuf,
				},
			});
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
	emits: ['set', 'close'],
};
</script>

<template>
	<section :ref="'editor'" @click="click">
		<div class="controls">
			<button @click="save">Save</button>
			<button @click="close">Close</button>
		</div>
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
	border: 5px solid #424243;
	position: relative;
}
.controls {
	position: absolute;
	right: 0.5rem;
	top: 0.5rem;
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
	z-index: 1;

	button {
		background-color: #424243;
		border-radius: 0.5rem;
		cursor: pointer;
		padding: 0.5rem 0.8rem;
		color: white;
	}
}
.code-container {
	overflow-y: scroll;
	max-height: 100%;
}
</style>
