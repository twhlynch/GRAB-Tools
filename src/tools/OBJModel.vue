<script>
import {
	createLevel,
	downloadLevel,
	encodeLevel,
} from '@/assets/encoding/levels';
import { obj } from '@/assets/tools/obj';
import ToolTemplate from '@/tools/ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'obj-model-tool';

			const allFiles = Array.from(getByID(`${toolID}-file`).files);
			if (!allFiles.length) {
				window.toast('No file chosen', 'error');
				return;
			}

			const objFile = allFiles.find((f) => f.name.endsWith('.obj'));
			const mtlFile = allFiles.find((f) => f.name.endsWith('.mtl'));
			const mode = getByID(`${toolID}-mode`).value;

			if (!objFile) {
				window.toast('No .obj file selected', 'error');
				return;
			}

			let nodes = await obj(objFile, mode, mtlFile);

			const level = createLevel(
				nodes,
				'3D Model',
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
		<template #title>3D Model</template>
		<template #info>Import a .obj 3D models into grab.</template>
		<input
			id="obj-model-tool-file"
			type="file"
			accept=".obj,.mtl"
			multiple
		/>
		<select id="obj-model-tool-mode">
			<option value="triangles" selected>triangles</option>
			<option value="particles">particles</option>
			<option value="spheres">spheres</option>
		</select>
		<button id="obj-model-tool-btn" class="button" @click="run">
			Process
		</button>
	</ToolTemplate>
</template>
