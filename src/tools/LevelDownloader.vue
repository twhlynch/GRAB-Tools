<script>
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	data() {
		return {
			download_link: '/download',
		};
	},
	methods: {
		async change() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'download-tool';

			const input = getByID(`${toolID}-urls`).value;
			const links = input
				.split(',')
				.map((link) => link.trim().split('=')[1])
				.join('+');

			this.download_link = `/download?level=${links}`;
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Level Downloader</template>
		<template #info>
			Paste a list of level browser links to your levels to download them.
		</template>
		<textarea
			id="download-tool-urls"
			cols="30"
			rows="5"
			placeholder="link, link, link, link"
			@change="change"
		></textarea>
		<a class="button" id="download-tool-btn" :href="download_link">
			Download
		</a>
	</ToolTemplate>
</template>
