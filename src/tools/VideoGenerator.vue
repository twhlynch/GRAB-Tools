<script>
import encoding from '@/assets/tools/encoding.js';
import video from '@/assets/tools/video.js';
import ProgressBar from '@/components/ProgressBar.vue';
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ProgressBar,
		ToolTemplate,
	},
	data() {
		return {
			progress: 0,
		};
	},
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

			const progress_callback = (progress) => {
				this.progress = progress;
			};
			const video_nodes = await video.video(
				file,
				width,
				height,
				progress_callback,
			);
			this.progress = 100;
			if (!video_nodes) {
				this.progress = 0;
				return;
			}

			const obj = encoding.createLevel(
				video_nodes,
				'Video',
				'Generated with GRAB Tools',
				['.index', 'GRAB Tools'],
			);

			const encoded = await encoding.encodeLevel(obj);
			if (encoded === null) return;

			encoding.downloadLevel(encoded);
			this.progress = 0;
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Video Generator</template>
		<template #info>
			Convert an MP4 video to grab. Note: if on firefox you will be given
			the old version with 15 second max length.
		</template>
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
		<ProgressBar :progress="progress" />
		<button class="button" id="video-generator-tool-btn" @click="generate">
			Process Video
		</button>
	</ToolTemplate>
</template>

<style scoped></style>
