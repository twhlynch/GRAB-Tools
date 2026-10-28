<script lang="ts">
import { BaseEditor, EditorConstructor } from '@/editor/GASMEditor';
import { ViewUpdate } from '@codemirror/view';
import { defineComponent, markRaw, PropType } from 'vue';

export default defineComponent({
	props: {
		editor: {
			type: Function as unknown as PropType<EditorConstructor>,
			required: true,
		},
	},
	emits: {
		changed: () => true,
	},
	data() {
		const instance: BaseEditor = null!;

		return {
			instance,
		};
	},
	mounted() {
		this.create_editor();
	},
	methods: {
		create_editor() {
			this.instance = markRaw(
				new this.editor(this.$refs.code_container as HTMLElement, (update: ViewUpdate) => {
					if (update.docChanged) {
						this.$emit('changed');
					}
				}),
			);
		},

		get() {
			return this.instance.get();
		},
		set(text: string) {
			this.instance.set(text);
		},
		compile() {
			return this.instance.compile();
		},
		focus() {
			this.instance.focus();
		},
		undo() {
			this.instance.undo();
		},
		redo() {
			this.instance.redo();
		},
		async copy() {
			await this.instance.copy();
		},
		async paste() {
			await this.instance.paste();
		},

		click(e: MouseEvent) {
			if (e.target === this.$refs.code_container) {
				this.focus();
			}
		},
	},
});
</script>

<template>
	<section ref="editor">
		<div :ref="'code_container'" class="code-container" @click="click"></div>
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
