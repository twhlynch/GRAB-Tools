<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

import encoding from '@/assets/tools/encoding';

import MenuPanel from '@/components/EditorPanels/MenuPanel.vue';
import ViewportPanel from '@/components/EditorPanels/ViewportPanel.vue';
import ResizableRowPanel from '@/components/EditorPanels/ResizableRowPanel.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import JsonPanel from '@/components/EditorPanels/JsonPanel.vue';
import TerminalPanel from '@/components/EditorPanels/TerminalPanel.vue';

export default {
	components: {
		MenuPanel,
		ViewportPanel,
		ResizableRowPanel,
		ResizableColPanel,
		JsonPanel,
		TerminalPanel,
	},
	data() {
		return {};
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
	},
	mounted() {
		this.json = encoding.createLevel();
		this.set_json(this.json);
		this.$refs.side_panel.size((window.innerHeight / 4) * 3);
		this.$refs.main_panel.size((window.innerWidth / 3) * 2);
	},
	methods: {
		set_json(json, skip = []) {
			this.json = json;
			if (!skip.includes('json_panel'))
				this.$refs.json_panel.set_json(this.json);
			if (!skip.includes('viewport_panel'))
				this.$refs.viewport_panel.set_json(this.json);
			window.toast('changed');
		},
		json_changed(json) {
			this.set_json(json, ['json_panel']);
		},
		viewport_changed() {
			this.set_json(this.json, ['viewport_panel']);
		},
		run_modifier(func) {
			this.set_json(func(this.json));
		},
		run_function(func) {
			func(this.json);
		},
		run_viewport(func) {
			func(this.$refs.viewport_panel);
		},
	},
	created() {
		document.title = 'JSON Editor | GRAB Tools';
	},
};
</script>

<template>
	<main id="editor">
		<MenuPanel
			@modifier="run_modifier"
			@function="run_function"
			@viewport="run_viewport"
		/>
		<ResizableRowPanel class="main-panel" :ref="'main_panel'">
			<template #first>
				<ViewportPanel
					:ref="'viewport_panel'"
					@changed="viewport_changed"
				/>
			</template>
			<template #second>
				<ResizableColPanel class="side-panel" :ref="'side_panel'">
					<template #first>
						<JsonPanel
							:ref="'json_panel'"
							@changed="json_changed"
						/>
					</template>
					<template #second>
						<TerminalPanel @command="run_modifier" />
					</template>
				</ResizableColPanel>
			</template>
		</ResizableRowPanel>
	</main>
</template>

<style>
html:has(#editor) {
	background-color: #1e1e1e;
}
#editor * {
	/* outline: 0.1px solid #0f05; */
}
</style>
<style scoped>
#editor {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
}
.main-panel {
	height: calc(100% - 3rem);
}
.side-panel {
	height: 100%;
}
</style>
