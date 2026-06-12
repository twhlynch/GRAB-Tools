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
		<input type="file" id="midi-tool-file" accept=".mid,.midi" />
		<label>
			Start active:
			<input type="checkbox" id="midi-tool-start-active" checked="true" />
		</label>
		<label>
			Loop: <input type="checkbox" id="midi-tool-loop" checked="true" />
		</label>
		<label>
			Optimize complexity:
			<input type="checkbox" id="midi-tool-optimize" />
		</label>
		<input
			type="number"
			id="midi-tool-volume"
			min="0"
			max="100"
			placeholder="Volume (0-100, default 30)"
		/>
		<button class="button" id="midi-tool-btn" @click="run">Generate</button>
	</ToolTemplate>
</template>
