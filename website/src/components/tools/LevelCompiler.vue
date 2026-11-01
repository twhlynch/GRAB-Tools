<script lang="ts">
import { createLevel, decodeLevel, downloadLevel, encodeLevel } from '@/common/levels';
import { compile } from '@/tools/compiler';
import { defineComponent } from 'vue';
import ToolTemplate from './ToolTemplate.vue';

export default defineComponent({
	components: {
		ToolTemplate,
	},
	methods: {
		showMultiSelect() {
			const multiSelectElement = this.$refs.multiselect as HTMLInputElement;
			multiSelectElement.style.display = 'flex';
		},
		async compile() {
			const titleInput = this.$refs.title as HTMLInputElement;
			const descriptionInput = this.$refs.description as HTMLInputElement;
			const creatorsInput = this.$refs.creators as HTMLInputElement;
			const checkpointsInput = this.$refs.checkpoints as HTMLInputElement;
			const groupInput = this.$refs.group as HTMLInputElement;
			const spacingInput = this.$refs.spacing as HTMLInputElement;
			const fileInput = this.$refs.file as HTMLInputElement;

			const files = Array.from(fileInput.files ?? []);
			for (let i = 0; i < 10; i++) {
				const fileInputI = this.$refs[`file${i}`] as HTMLInputElement;
				if (fileInputI.files?.[0]) files.push(fileInputI.files[0]);
			}

			if (!files.length) {
				window.toast('No files chosen', 'misuse');
				return;
			}

			const creators = creatorsInput.value || '';
			const description = descriptionInput.value || '';
			const title = titleInput.value || '';
			const checkpoints = parseInt(checkpointsInput.value) || 0;
			const group = groupInput.checked;
			const spacing = parseInt(spacingInput.value) || 0;

			const nodes = await Promise.all(
				files.map(async (file) => {
					const level = await decodeLevel(file);
					return level?.levelNodes ?? [];
				}),
			);

			const result = compile(nodes, { group, spacing });

			const level = createLevel(result, title, description, creators, checkpoints);

			const encoded = encodeLevel(level);
			if (!encoded) return;

			downloadLevel(encoded);
		},
	},
});
</script>

<template>
	<ToolTemplate
		:name="'Level Compiler'"
		:details="'Select multiple level files and combine them into one file. Each level will be grouped.'"
	>
		<button class="button-sml" @click="showMultiSelect">
			Click me if you can't select multiple files
		</button>
		<input ref="title" type="text" placeholder="Title" />
		<textarea ref="description" maxlength="300" placeholder="Description"></textarea>
		<input ref="creators" type="text" placeholder="Creators" maxlength="80" />
		<input ref="checkpoints" type="number" placeholder="Checkpoints" />
		<label>
			Group:
			<input ref="group" type="checkbox" checked="true" />
		</label>
		<input ref="spacing" type="number" placeholder="Spacing" />
		<input ref="file" type="file" accept=".level" multiple />
		<div id="quest-multiselect" ref="multiselect">
			<input v-for="i in 10" :ref="'file' + (i - 1)" :key="i" type="file" accept=".level" />
		</div>
		<button class="button" @click="compile">Compile</button>
	</ToolTemplate>
</template>

<style scoped>
#quest-multiselect {
	display: none;
	flex-direction: column;
	width: 100%;
	gap: 5px;
}
</style>
