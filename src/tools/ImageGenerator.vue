<script>
import encoding from '@/assets/tools/encoding.js';
import image from '@/assets/tools/image.js';
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

			const node = await image.image(file, width, height, mode, shape);

			const obj = encoding.createLevel(
				[node],
				'Image',
				'Generated with GRAB Tools',
				['.index', 'GRAB Tools'],
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
		<template #title>Pixel Art</template>
		<template #info>Generate pixel art from an image.</template>
		<textarea
			id="text-signs-tool-text"
			cols="30"
			rows="5"
			placeholder="text"
		></textarea>
		<select id="text-signs-tool-mode">
			<option value="simple" selected>simple</option>
			<option value="animated">animated</option>
		</select>
		<button class="button" id="text-signs-tool-btn" @click="run">
			Generate
		</button>
	</ToolTemplate>
</template>
