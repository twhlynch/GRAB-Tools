<script>
import build_editor from '@/assets/EditorSetup';
import { json } from '@codemirror/lang-json';
import { foldGutter } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import { grabCompletion } from '@/assets/grabCompletion';
import { undo, redo } from '@codemirror/commands';

export default {
	props: {
		mini: Boolean,
	},
	data() {
		return {
			json: {},
			ignore_change: false,
			error: null,
		};
	},
	mounted() {
		this.view = build_editor(
			this.$refs.json_container,
			JSON.stringify(this.json, null, 4),
			json(),
			[foldGutter(), highlightSelectionMatches(), ...grabCompletion()],
			[...searchKeymap],
			(update) => {
				if (update.docChanged && !this.ignore_change) {
					const new_json = this.view.state.doc.toString();
					let new_object = undefined;
					this.error = null;
					try {
						new_object = JSON.parse(new_json);
					} catch (e) {
						this.error = e.message;
					}
					if (
						new_object !== undefined &&
						this.error === null &&
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
			if (e.target === this.$refs.json_container) {
				this.view.focus();
				this.view.dispatch({
					selection: EditorSelection.cursor(
						this.view.state.doc.length,
					),
					scrollIntoView: true,
				});
			}
		},
		undo() {
			undo(this.view);
		},
		redo() {
			redo(this.view);
		},
	},
	emits: ['changed'],
};
</script>

<template>
	<section :ref="'editor'" @click="click">
		<div :ref="'json_container'" class="json-container"></div>
		<div v-show="error !== null" class="error">
			<span>{{ error }}</span>
		</div>
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
.json-container {
	overflow-y: scroll;
	max-height: 100%;
}
.error {
	position: relative;

	span {
		position: absolute;
		bottom: 0;
		font-size: 0.6rem;
		width: 100%;
		height: 1rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		overflow-x: scroll;
		background-color: var(--red);
		color: white;
		font-family: var(--font-family-alt);
		white-space: nowrap;
	}
}
</style>
