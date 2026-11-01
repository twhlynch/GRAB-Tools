<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import svg from '@/tools/svg';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		async draw() {
			const fileInput = this.$refs.file as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'misuse');
				return;
			}

			const nodes = await svg.svg(file, 600);
			if (!nodes) return;

			const obj = createLevel(nodes, 'SVG', 'Generated with GRAB Tools', [
				'.index',
				'GRAB Tools',
			]);

			const encoded = encodeLevel(obj);
			if (!encoded) return;

			downloadLevel(encoded);
		},
	},
});
</script>

<template>
	<ToolTemplate
		:name="'SVG Drawer'"
		:details="'Convert simple SVG images into their built paths.'"
	>
		<input ref="file" type="file" accept=".svg" />
		<button ref="btn" class="button" @click="draw">Process</button>
	</ToolTemplate>
</template>
