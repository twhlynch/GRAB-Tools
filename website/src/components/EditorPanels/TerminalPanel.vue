<script lang="ts">
import { StrictRaw, markRawStrict } from '@/common/utils';
import { Terminal } from '@/editor/Terminal';
import { Level } from '@grab-tools/lib/generated/proto';
import { defineComponent } from 'vue';

export default defineComponent({
	components: {},
	emits: {
		command: (_: (_: Level) => Level) => true,
	},
	data() {
		return {
			terminal: null as unknown as StrictRaw<Terminal>,
		};
	},
	computed: {
		refs() {
			return this.$refs as Record<'terminal', HTMLElement>;
		},
	},
	mounted() {
		this.terminal = markRawStrict(new Terminal(this.refs.terminal));
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
	overflow-y: scroll;
}
</style>
