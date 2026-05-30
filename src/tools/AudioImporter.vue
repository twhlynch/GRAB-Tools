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
			const complexity =
				parseInt(getByID(`${toolID}-complexity`).value) || 40;

			const nodes = await audio.audio(file, complexity);
			if (!nodes) return;

			const obj = createLevel(
				nodes,
				'Audio',
				'Generated with GRAB Tools',
				['GRAB Tools'],
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
			Generate audio with code, trigger, and sound blocks.
		</template>
		<input
			type="number"
			id="audio-tool-complexity"
			placeholder="max complexity (1000)"
		/>
		<input type="file" id="audio-tool-file" accept="audio/*" />
		<button class="button" id="audio-tool-btn" @click="run">
			Generate
		</button>
	</ToolTemplate>
</template>
