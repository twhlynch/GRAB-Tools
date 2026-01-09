<script>
import encoding from '@/assets/tools/encoding.js';
import audio from '@/assets/tools/audio.js';
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'audio-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) {
				window.toast('No file chosen', 'error');
				return;
			}

			const file = files[0];
			const samples =
				parseInt(getByID(`${toolID}-pitch-samples`).value) || 40;

			const node = await audio.audio(file, samples);
			if (!node) return;

			const obj = encoding.createLevel(
				[node],
				'Audio',
				'Generated with GRAB Tools',
				['SFX2GL', 'GRAB Tools'],
			);

			const encoded = await encoding.encodeLevel(obj);
			if (encoded === null) return;

			encoding.downloadLevel(encoded);
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Import audio</template>
		<template #info>
			Generate audio with triggers and sound blocks.
		</template>
		<input
			type="number"
			id="audio-tool-pitch-samples"
			placeholder="samples (40)"
		/>
		<input type="file" id="audio-tool-file" accept="audio/*" />
		<button class="button" id="audio-tool-btn" @click="run">
			Generate
		</button>
	</ToolTemplate>
</template>
