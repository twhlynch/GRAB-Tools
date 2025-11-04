<script>
import encoding from '@/assets/tools/encoding.js';
import image from '@/assets/tools/image.js';

export default {
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
	<div>
		<h2>Pixel Art</h2>
		<p>Generate pixel art from an image.</p>
		<div>
			<input type="number" id="image-tool-width" placeholder="width" />
			<input type="number" id="image-tool-height" placeholder="height" />
			<select id="image-tool-mode">
				<option value="cubes" selected>cubes</option>
				<option value="particles">particles</option>
			</select>
			<select id="image-tool-shape">
				<option value="plane" selected>plane</option>
				<option value="sphere">sphere</option>
			</select>
			<input type="file" id="image-tool-file" accept="image/*" />
			<button class="button" id="image-tool-btn" @click="run">
				Generate
			</button>
		</div>
	</div>
</template>

<style scoped></style>
