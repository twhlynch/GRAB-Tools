<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import audio from '@/tools/audio';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const fileInput = this.$refs.file as HTMLInputElement;
			const samplesInput = this.$refs.samples as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'misuse');
				return;
			}

			const samples = parseInt(samplesInput.value) || 40;

			const node = await audio.audio(file, samples);
			if (!node) return;

			const obj = createLevel([node], 'Audio', 'Generated with GRAB Tools', [
				'SFX2GL',
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
		:name="'Import audio'"
		:details="'Generate audio with triggers and sound blocks.'"
	>
		<input ref="samples" type="number" placeholder="samples (40)" />
		<input ref="file" type="file" accept="audio/*" />
		<button class="button" @click="run">Generate</button>
	</ToolTemplate>
</template>
