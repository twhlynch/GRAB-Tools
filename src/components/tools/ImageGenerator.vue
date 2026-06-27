<script>
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import { generate_pixel_art } from '@/tools/image';
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'image-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) {
				window.toast('No image file chosen', 'error');
				return;
			}

			const file = files[0];
			const width = parseInt(getByID(`${toolID}-width`).value) || 50;
			const height = parseInt(getByID(`${toolID}-height`).value) || 50;
			const mode = getByID(`${toolID}-mode`).value;
			const shape = getByID(`${toolID}-shape`).value;
			const greedy = getByID(`${toolID}-greedy`).checked;

			const node = await generate_pixel_art(
				file,
				width,
				height,
				mode,
				shape,
				greedy,
			);

			const obj = createLevel(
				[node],
				'Image',
				'Generated with GRAB Tools',
				['.index', 'GRAB Tools'],
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
		<template #title>Pixel Art</template>
		<template #info>Generate pixel art from an image.</template>
		<input id="image-tool-width" type="number" placeholder="width (50)" />
		<input id="image-tool-height" type="number" placeholder="height (50)" />
		<select id="image-tool-mode">
			<option value="cubes" selected>cubes</option>
			<option value="particles">particles</option>
		</select>
		<select id="image-tool-shape">
			<option value="plane" selected>plane</option>
			<option value="sphere">sphere</option>
		</select>
		<label>
			optimise
			<input id="image-tool-greedy" type="checkbox" />
		</label>
		<input id="image-tool-file" type="file" accept="image/*" />
		<button id="image-tool-btn" class="button" @click="run">
			Generate
		</button>
	</ToolTemplate>
</template>
