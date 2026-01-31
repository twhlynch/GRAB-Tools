<script>
import {
	createLevel,
	downloadLevel,
	encodeLevel,
} from '@/assets/encoding/levels';
import signs from '@/assets/tools/signs';
import ToolTemplate from '@/tools/ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'text-signs-tool';

			const text = getByID(`${toolID}-text`).value;
			const mode = getByID(`${toolID}-mode`).value;

			const level_nodes = signs.signs(text, mode === 'animated');

			const level = createLevel(
				level_nodes,
				'Signs',
				'Generated with GRAB Tools',
				['.index', 'GRAB Tools'],
			);

			const encoded = await encodeLevel(level);
			if (encoded === null) return;

			downloadLevel(encoded);
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Text to Signs</template>
		<template #info>
			Generate a list of signs or an animated playback of text.
		</template>
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
