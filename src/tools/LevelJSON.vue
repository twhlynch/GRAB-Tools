<script>
import encoding from '@/assets/tools/encoding.js';
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'level-json-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) return;

			files
				.filter((file) => file.name.endsWith('.json'))
				.forEach(async (file) => {
					const json = JSON.parse(await file.text());
					const level = await encoding.encodeLevel(json);
					encoding.downloadLevel(
						level,
						file.name.replace(/\.(json|level)/, ''),
					);
				});
			files
				.filter((file) => file.name.endsWith('.level'))
				.forEach(async (file) => {
					const json = await encoding.decodeLevel(file);
					if (!json) return;
					encoding.downloadJSON(
						json,
						file.name.replace(/\.(json|level)/, ''),
					);
				});
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Level to JSON</template>
		<template #info>
			Convert a levels to readable JSON data and back.
		</template>
		<input
			type="file"
			id="level-json-tool-file"
			accept=".level,.json"
			multiple
		/>
		<button class="button" @click="run">Convert</button>
	</ToolTemplate>
</template>
