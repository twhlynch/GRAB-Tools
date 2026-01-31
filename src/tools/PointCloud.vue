<script>
import {
	createLevel,
	downloadLevel,
	encodeLevel,
} from '@/assets/encoding/levels';
import obj from '@/assets/tools/obj';
import ToolTemplate from '@/tools/ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'point-cloud-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			if (!files.length) {
				window.toast('No file chosen', 'error');
				return;
			}

			const file = files[0];
			const mode = getByID(`${toolID}-mode`).value;

			let nodes = await obj.obj(file, mode);

			const level = createLevel(
				nodes,
				'Point Cloud',
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
		<template #title>Point Cloud</template>
		<template #info>Convert .obj 3D models into grab levels.</template>
		<input type="file" id="point-cloud-tool-file" accept=".obj" />
		<select id="point-cloud-tool-mode">
			<option value="particles" selected>particles</option>
			<option value="spheres">spheres</option>
		</select>
		<button class="button" id="point-cloud-tool-btn" @click="run">
			Process
		</button>
	</ToolTemplate>
</template>
