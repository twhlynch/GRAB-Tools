<script lang="ts">
import { decodeLevel, downloadJSON, downloadLevel, encodeLevel } from '@/common/levels';
import { Level } from '@grab-tools/lib/generated/proto';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		run() {
			const fileInput = this.$refs.file as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			const file = files[0];
			if (!file) {
				window.toast('No file chosen', 'misuse');
				return;
			}

			async function json_to_level(f: File): Promise<void> {
				const json = JSON.parse(await f.text()) as Level;
				const level = encodeLevel(json);
				if (level) {
					downloadLevel(level, f.name.replace(/\.(json|level)/, ''));
				}
			}
			async function level_to_json(f: File): Promise<void> {
				const json = await decodeLevel(f);
				if (json) {
					downloadJSON(json, f.name.replace(/\.(json|level)/, ''));
				}
			}

			files
				.filter((f) => f.name.endsWith('.json'))
				.forEach((f) => {
					void json_to_level(f);
				});
			files
				.filter((f) => f.name.endsWith('.level'))
				.forEach((f) => {
					void level_to_json(f);
				});
		},
	},
});
</script>

<template>
	<ToolTemplate
		:name="'Level to JSON'"
		:details="'Convert a levels to readable JSON data and back.'"
	>
		<input ref="file" type="file" accept=".level,.json" multiple />
		<button class="button" @click="run">Convert</button>
	</ToolTemplate>
</template>
