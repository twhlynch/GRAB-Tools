<script>
import {
	createLevel,
	decodeLevel,
	downloadLevel,
	encodeLevel,
} from '@/common/levels';
import { compile } from '@/tools/compiler';
import ToolTemplate from './ToolTemplate.vue';

export default {
	components: {
		ToolTemplate,
	},
	methods: {
		showQuestMultiSelect() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'level-compiler-tool';
			getByID(`${toolID}-quest-multi-select`).style.display = 'flex';
		},
		async compile() {
			const getByID = (id) => document.getElementById(id);
			const toolID = 'level-compiler-tool';

			const files = Array.from(getByID(`${toolID}-file`).files);
			for (let i = 0; i < 10; i++) {
				const elem = getByID(`${toolID}-file${i}`);
				if (elem.files.length) files.push(elem.files[0]);
			}

			if (!files.length) return;

			const creators = getByID(`${toolID}-creators`).value || '';
			const description = getByID(`${toolID}-description`).value || '';
			const title = getByID(`${toolID}-title`).value || '';
			const checkpoints = parseInt(
				getByID(`${toolID}-checkpoints`).value || '0',
			);
			const group = getByID(`${toolID}-group`).checked;
			const spacing = parseInt(getByID(`${toolID}-spacing`).value || '0');

			const nodes = await Promise.all(
				files.map(async (file) => {
					const level = await decodeLevel(file);
					return level.levelNodes ?? [];
				}),
			);

			const result = compile(nodes, { group, spacing });

			const level = createLevel(
				result,
				title,
				description,
				creators,
				checkpoints,
			);

			const encoded = await encodeLevel(level);
			downloadLevel(encoded);
		},
	},
};
</script>

<template>
	<ToolTemplate>
		<template #title>Level Compiler</template>
		<template #info>
			Select multiple level files and combine them into one file. Each
			level will be grouped.
		</template>
		<button class="button-sml" @click="showQuestMultiSelect">
			Click me if you are on quest and can't select multiple files
		</button>
		<input id="level-compiler-tool-title" type="text" placeholder="Title" />
		<textarea
			id="level-compiler-tool-description"
			maxlength="300"
			placeholder="Description"
		></textarea>
		<input
			id="level-compiler-tool-creators"
			type="text"
			placeholder="Creators"
			maxlength="80"
		/>
		<input
			id="level-compiler-tool-checkpoints"
			type="number"
			placeholder="Checkpoints"
		/>
		<label>
			Group:
			<input
				id="level-compiler-tool-group"
				type="checkbox"
				checked="true"
			/>
		</label>
		<input
			id="level-compiler-tool-spacing"
			type="number"
			placeholder="Spacing"
		/>
		<input
			id="level-compiler-tool-file"
			type="file"
			accept=".level"
			multiple
		/>
		<div id="level-compiler-tool-quest-multi-select">
			<input
				v-for="i in 10"
				:id="'level-compiler-tool-file' + (i - 1)"
				:key="i"
				type="file"
				accept=".level"
			/>
		</div>
		<button id="level-compiler-tool-btn" class="button" @click="compile">
			Compile
		</button>
	</ToolTemplate>
</template>

<style scoped>
#level-compiler-tool-quest-multi-select {
	display: none;
	flex-direction: column;
	width: 100%;
	gap: 5px;
}
</style>
