<script lang="ts">
import { Terminal } from '@/editor/Terminal';
import { Level } from '@/generated/proto';
import { defineComponent, markRaw } from 'vue';

export default defineComponent({
	components: {},
	emits: ['command'],
	data() {
		return {
			terminal: null! as Terminal,
		};
	},
	computed: {
		refs() {
			return this.$refs as Record<'terminal', HTMLElement>;
		},
	},
	mounted() {
		this.terminal = markRaw(new Terminal(this.refs.terminal));
	},
	methods: {
		keydown(e: KeyboardEvent) {
			if (e.code === 'Enter') {
				if (e.shiftKey) return;

				e.preventDefault();

				this.$emit('command', (level: Level) => {
					this.terminal.run(level);
					return level;
				});
			}
		},
		click(e: MouseEvent) {
			if (e.target === this.refs.terminal) {
				this.terminal.focus();
			}
		},
	},
});
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
