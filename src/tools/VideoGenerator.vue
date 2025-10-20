<script>
import encoding from '#assets/tools/encoding.js';
import video from '#assets/tools/video.js';

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

			const file = files[0];

			let videoNodes = await video.video(file);
			if (videoNodes === null) return;

			const obj = encoding.createLevel(
				videoNodes,
				'Video',
				'Generated with Mp42Grab',
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
	<div id="video-section">
		<h2>Video Generator (Mp42Grab)</h2>
		<p>
			15 second max length. Output will always be 20x20. This is a demo of
			the full script which can be found
			<a href="https://github.com/twhlynch/Mp42Grab">here</a> to download.
		</p>
		<div>
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
