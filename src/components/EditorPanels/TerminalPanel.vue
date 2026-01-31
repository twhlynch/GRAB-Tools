<script>
import build_editor from '@/assets/EditorSetup';
import { javascript } from '@codemirror/lang-javascript';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export default {
	data() {
		return { last_command: '' };
	},
	components: {},
	emits: ['command'],
	mounted() {
		this.view = build_editor(this.$refs.terminal, '', javascript(), [
			EditorView.lineWrapping,
		]);
	},
	methods: {
		run_command(content) {
			this.last_command = content;
			this.$emit('command', (level) => {
				try {
					eval(content);
				} catch (e) {
					console.error(e);
				}
				return level;
			});
		},
		keydown(e) {
			const { code, shiftKey } = e;
			if (code === 'Enter') {
				if (!shiftKey) {
					e.preventDefault();
					const content = this.view.state.doc.toString();
					this.run_command(content);
					this.view.dispatch({
						changes: {
							from: 0,
							to: this.view.state.doc.length,
							insert: '',
						},
					});
				}
			}
		},
		click(e) {
			if (e.target === this.$refs.terminal) {
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
};
</script>

<template>
	<section :ref="'terminal'" @keydown="keydown" @click="click"></section>
</template>

<style scoped>
section {
	width: 100%;
	height: 100%;
	background-color: #141415;
	cursor: text;
}
</style>
