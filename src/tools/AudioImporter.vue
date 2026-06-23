<script>
import {
	createLevel,
	downloadLevel,
	encodeLevel,
} from '@/assets/encoding/levels';
import audio from '@/assets/tools/audio';
import ToolTemplate from '@/tools/ToolTemplate.vue';

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

			const obj = createLevel(
				[node],
				'Audio',
				'Generated with GRAB Tools',
				['SFX2GL', 'GRAB Tools'],
			);

			const encoded = await encodeLevel(obj);
			if (encoded === null) return;

			downloadLevel(encoded);
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
			id="audio-tool-pitch-samples"
			type="number"
			placeholder="samples (40)"
		/>
		<input id="audio-tool-file" type="file" accept="audio/*" />
		<button id="audio-tool-btn" class="button" @click="run">
			Generate
		</button>
	</ToolTemplate>
</template>
