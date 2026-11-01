<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import ProgressBar from '@/components/ProgressBar.vue';
import video from '@/tools/video';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
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
			const fileInput = this.$refs.file as HTMLInputElement;
			const widthInput = this.$refs.width as HTMLInputElement;
			const heightInput = this.$refs.height as HTMLInputElement;
			const modeInput = this.$refs.mode as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'misuse');
				return;
			}

			const width = parseInt(widthInput.value) || 40;
			const height = parseInt(heightInput.value) || 30;
			const mode = modeInput.value as 'animations' | 'code';

			const progress_callback = (progress: number) => {
				this.progress = progress;
			};
			const video_nodes = await video.video(file, width, height, mode, progress_callback);
			this.progress = 100;
			if (!video_nodes) {
				this.progress = 0;
				return;
			}

			const obj = createLevel(video_nodes, 'Video', 'Generated with GRAB Tools', [
				'.index',
				'GRAB Tools',
			]);

			const encoded = encodeLevel(obj);
			if (!encoded) return;

			downloadLevel(encoded);
			this.progress = 0;
		},
	},
});
</script>

<template>
	<ToolTemplate
		:name="'Video Generator'"
		:details="'Convert an MP4 video to grab. Note: if on firefox you will be given the old version with 15 second max length.'"
	>
		<input ref="width" type="number" placeholder="width (40)" />
		<input ref="height" type="number" placeholder="height (30)" />
		<select ref="mode">
			<option value="animations" selected>animations</option>
			<option value="code">code</option>
		</select>
		<input ref="file" type="file" />
		<ProgressBar :progress="progress" />
		<button class="button" @click="generate">Process Video</button>
	</ToolTemplate>
</template>

<style scoped></style>
