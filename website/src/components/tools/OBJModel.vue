<script lang="ts">
import { createLevel, downloadLevel, encodeLevel } from '@/common/levels';
import { obj } from '@/tools/obj';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		async run() {
			const fileInput = this.$refs.file as HTMLInputElement;
			const modeInput = this.$refs.mode as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'misuse');
				return;
			}

			const objFile = files.find((f) => f.name.endsWith('.obj'));
			const mtlFile = files.find((f) => f.name.endsWith('.mtl'));
			const mode = modeInput.value as 'triangles' | 'particles' | 'spheres';

			if (!objFile) {
				window.toast('No .obj file selected', 'misuse');
				return;
			}

			const nodes = await obj(objFile, mode, mtlFile);

			const level = createLevel(nodes, '3D Model', 'Generated with GRAB Tools', [
				'.index',
				'GRAB Tools',
			]);

			const encoded = encodeLevel(level);
			if (!encoded) return;

			downloadLevel(encoded);
		},
	},
});
</script>

<template>
	<ToolTemplate :name="'3D Model'" :details="'Import a .obj 3D models into grab.'">
		<input ref="file" type="file" accept=".obj,.mtl" multiple />
		<select ref="mode">
			<option value="triangles" selected>triangles</option>
			<option value="particles">particles</option>
			<option value="spheres">spheres</option>
		</select>
		<button class="button" @click="run">Process</button>
	</ToolTemplate>
</template>
