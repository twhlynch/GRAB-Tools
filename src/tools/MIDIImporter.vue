<script>
import {
	createLevel,
	downloadLevel,
	encodeLevel,
} from '@/assets/encoding/levels';
import midi from '@/assets/tools/midi';
import ToolTemplate from '@/tools/ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'midi-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) {
				window.toast('No file chosen', 'error');
				return;
			}

			const file = files[0];
			const start_active = getByID(`${toolID}-start-active`).checked;
			const loop = getByID(`${toolID}-loop`).checked;
			const optimize = getByID(`${toolID}-optimize`).checked;
			const volume = parseInt(getByID(`${toolID}-volume`).value) || 40;

			const node = await midi.midi(
				file,
				0,
				start_active,
				loop,
				optimize,
				volume,
			);
			if (!node) return;

			const obj = createLevel(
				[node],
				'MIDI: ' + file.name,
				'Generated with GRAB Tools',
				['TheTrueFax', 'GRAB Tools'],
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
		<template #title>Import MIDI files</template>
		<template #info>
			Generate songs with triggers and sound blocks.
		</template>
		<input id="midi-tool-file" type="file" accept=".mid,.midi" />
		<label>
			Start active:
			<input id="midi-tool-start-active" type="checkbox" checked="true" />
		</label>
		<label>
			Loop: <input id="midi-tool-loop" type="checkbox" checked="true" />
		</label>
		<label>
			Optimize complexity:
			<input id="midi-tool-optimize" type="checkbox" />
		</label>
		<input
			id="midi-tool-volume"
			type="number"
			min="0"
			max="100"
			placeholder="Volume (0-100, default 30)"
		/>
		<button id="midi-tool-btn" class="button" @click="run">Generate</button>
	</ToolTemplate>
</template>
