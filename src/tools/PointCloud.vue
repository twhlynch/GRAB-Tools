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

			let nodes = await obj.obj(objFile, mode, mtlFile);

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
		<input
			type="file"
			id="point-cloud-tool-file"
			accept=".obj,.mtl"
			multiple
		/>
		<select id="point-cloud-tool-mode">
			<option value="particles" selected>particles</option>
			<option value="spheres">spheres</option>
			<option value="triangles">triangles</option>
		</select>
		<button class="button" id="point-cloud-tool-btn" @click="run">
			Process
		</button>
	</ToolTemplate>
</template>
