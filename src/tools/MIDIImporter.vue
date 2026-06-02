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
			const start_active =
				getByID(`${toolID}-start-active`).value == 'yes';
			const loop = getByID(`${toolID}-loop`).value == 'yes';
			const volume = parseInt(getByID(`${toolID}-volume`).value) || 40;

			const node = await midi.midi(file, 0, start_active, loop, volume);
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
		<select id="midi-tool-start-active">
			<option value="no">Start active: No</option>
			<option value="yes" selected>Start active: Yes</option>
		</select>
		<select id="midi-tool-loop">
			<option value="no">Loop: No</option>
			<option value="yes" selected>Loop: Yes</option>
		</select>
		<input
			type="number"
			id="midi-tool-volume"
			placeholder="Volume (0-100, default 30)"
		/>
		<button class="button" id="midi-tool-btn" @click="run">Generate</button>
	</ToolTemplate>
</template>
