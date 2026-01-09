<script>
import encoding from '@/assets/tools/encoding.js';
import compiler from '@/assets/tools/compiler.js';
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

			let creators = getByID(`${toolID}-creators`).value || '';
			let description = getByID(`${toolID}-description`).value || '';
			let title = getByID(`${toolID}-title`).value || '';
			let checkpoints = parseInt(
				getByID(`${toolID}-checkpoints`).value || '0',
			);

			const groups = await Promise.all(
				files.map(async (file) => await encoding.decodeLevel(file)),
			);

			let compiledNodes = compiler.compile(groups.filter(Boolean));

			const obj = encoding.createLevel(
				compiledNodes,
				title,
				description,
				creators,
				checkpoints,
			);

			const encoded = await encoding.encodeLevel(obj);
			encoding.downloadLevel(encoded);
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
		<input type="text" id="level-compiler-tool-title" placeholder="Title" />
		<textarea
			id="level-compiler-tool-description"
			maxlength="300"
			placeholder="Description"
		></textarea>
		<input
			type="text"
			id="level-compiler-tool-creators"
			placeholder="Creators"
			maxlength="80"
		/>
		<input
			type="number"
			id="level-compiler-tool-checkpoints"
			placeholder="Checkpoints"
		/>
		<input
			type="file"
			id="level-compiler-tool-file"
			accept=".level"
			multiple
		/>
		<div id="level-compiler-tool-quest-multi-select">
			<input
				v-for="i in 10"
				type="file"
				:key="i"
				:id="'level-compiler-tool-file' + (i - 1)"
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
