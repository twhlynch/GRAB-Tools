<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import { generate_pixel_art } from '@/tools/image';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const widthInput = this.$refs.width as HTMLInputElement;
			const heightInput = this.$refs.height as HTMLInputElement;
			const modeInput = this.$refs.mode as HTMLInputElement;
			const shapeInput = this.$refs.shape as HTMLInputElement;
			const greedyInput = this.$refs.greedy as HTMLInputElement;
			const fileInput = this.$refs.file as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No image file chosen', 'misuse');
				return;
			}

			const width = parseInt(widthInput.value) || 50;
			const height = parseInt(heightInput.value) || 50;
			const mode = modeInput.value as 'cubes' | 'particles';
			const shape = shapeInput.value as 'plane' | 'sphere';
			const greedy = greedyInput.checked;

			const node = await generate_pixel_art(file, width, height, mode, shape, greedy);

			const obj = createLevel([node], 'Image', 'Generated with GRAB Tools', [
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
	<ToolTemplate :name="'Pixel Art'" :details="'Generate pixel art from an image.'">
		<input ref="width" type="number" placeholder="width (50)" />
		<input ref="height" type="number" placeholder="height (50)" />
		<select ref="mode">
			<option value="cubes" selected>cubes</option>
			<option value="particles">particles</option>
		</select>
		<select ref="shape">
			<option value="plane" selected>plane</option>
			<option value="sphere">sphere</option>
		</select>
		<label>
			optimise
			<input ref="greedy" type="checkbox" />
		</label>
		<input ref="file" type="file" accept="image/*" />
		<button class="button" @click="run">Generate</button>
	</ToolTemplate>
</template>
