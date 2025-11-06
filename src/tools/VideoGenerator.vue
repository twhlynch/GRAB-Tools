<script>
import encoding from '@/assets/tools/encoding.js';
import video from '@/assets/tools/video.js';

export default {
	methods: {
		async generate() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'video-generator-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) {
				window.toast('No video file chosen', 'error');
				return;
			}

			const width = parseInt(getByID(`${toolID}-width`).value) || 40;
			const height = parseInt(getByID(`${toolID}-height`).value) || 30;

			const file = files[0];

			let videoNodes = await video.video(file, width, height);
			if (videoNodes === null) return;

			const obj = encoding.createLevel(
				videoNodes,
				'Video',
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
		<h2>Video Generator</h2>
		<p>
			Convert an MP4 video to grab. Note: if on firefox you will be given
			the old version with 15 second max length.
		</p>
		<div>
			<input
				type="number"
				id="video-generator-tool-width"
				placeholder="width (40)"
			/>
			<input
				type="number"
				id="video-generator-tool-height"
				placeholder="height (30)"
			/>
			<input type="file" id="video-generator-tool-file" />
			<button
				class="button"
				id="video-generator-tool-btn"
				@click="generate"
			>
				Process Video
			</button>
		</div>
	</div>
</template>

<style scoped></style>
