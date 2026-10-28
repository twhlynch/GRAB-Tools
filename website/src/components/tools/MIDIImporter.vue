<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import midi from '@/tools/midi';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const fileInput = this.$refs.file as HTMLInputElement;
			const activeInput = this.$refs.active as HTMLInputElement;
			const loopInput = this.$refs.loop as HTMLInputElement;
			const instrumentInput = this.$refs.instrument as HTMLInputElement;
			const volumeInput = this.$refs.volume as HTMLInputElement;
			const speedInput = this.$refs.speed as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'error');
				return;
			}

			const start_active = activeInput.checked;
			const loop = loopInput.checked;
			const instrument = instrumentInput.value;
			const volume = (parseInt(volumeInput.value) || 30) / 100;
			const speedIndex = 1 / (parseFloat(speedInput.value) || 1);

			const nodes = await midi.midi(
				file,
				0,
				instrument,
				start_active,
				loop,
				volume,
				speedIndex,
			);
			if (!nodes) return;

			const obj = createLevel(nodes, 'MIDI: ' + file.name, 'Generated with GRAB Tools', [
				'TheTrueFax',
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
		:name="'Import MIDI files'"
		:details="'Generate songs with triggers and sound blocks.'"
	>
		<input ref="file" type="file" accept=".mid,.midi" />
		<select ref="instrument">
			<option value="Auto Instrument" selected>Auto Instrument</option>
			<option value="Sine (Classic)">Sine (Classic)</option>
			<option value="Saw (Classic)">Saw (Classic)</option>
			<option value="Square (Classic)">Square (Classic)</option>
		</select>
		<label>
			Start active:
			<input ref="active" type="checkbox" checked="true" />
		</label>
		<label> Loop: <input ref="loop" type="checkbox" checked="true" /> </label>
		<input
			ref="volume"
			type="number"
			min="0"
			max="100"
			placeholder="Volume (0-100, default 30)"
		/>
		<input ref="speed" type="number" min="0" placeholder="Speed multiplier (default 1)" />
		<span>
			Don't have a MIDI file? Download some
			<a href="https://onlinesequencer.net/sequences" target="_blank">here</a>!
		</span>
		<button class="button" @click="run">Generate</button>
	</ToolTemplate>
</template>
