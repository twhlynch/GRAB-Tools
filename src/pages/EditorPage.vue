<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useConfigStore } from '@/stores/config';

import encoding from '@/assets/tools/encoding';
import { user_info_request } from '@/requests/UserInfoRequest';
import { download_level_request } from '@/requests/DownloadLevelRequest';
import { level_details_request } from '@/requests/LevelDetailsRequest';

import MenuPanel from '@/components/EditorPanels/MenuPanel.vue';
import ViewportPanel from '@/components/EditorPanels/ViewportPanel.vue';
import ResizableRowPanel from '@/components/EditorPanels/ResizableRowPanel.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import JsonPanel from '@/components/EditorPanels/JsonPanel.vue';
import TerminalPanel from '@/components/EditorPanels/TerminalPanel.vue';
import PopupPanel from '@/components/EditorPanels/PopupPanel.vue';
import StatisticsPanel from '@/components/EditorPanels/StatisticsPanel.vue';
import TemplatesPanel from '@/components/EditorPanels/TemplatesPanel.vue';
import ProtobufPanel from '@/components/EditorPanels/ProtobufPanel.vue';

export default {
	components: {
		MenuPanel,
		ViewportPanel,
		ResizableRowPanel,
		ResizableColPanel,
		JsonPanel,
		TerminalPanel,
		PopupPanel,
		StatisticsPanel,
		TemplatesPanel,
		ProtobufPanel,
	},
	data() {
		return {
			popup_props: {
				inputs: undefined,
				func: undefined,
			},
			show_protobuf_panel: false,
		};
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
		...mapState(useConfigStore, ['default_level']),
	},
	mounted() {
		this.$refs.side_panel.size((window.innerHeight / 4) * 3);
		this.$refs.main_panel.size((window.innerWidth / 3) * 2);
		this.$refs.left_panel.size(0);
		this.open_starting_level();
	},
	methods: {
		async can_download_level(level_id) {
			if (!this.is_logged_in) {
				window.toast('Login to download your levels', 'warning');
				return false;
			}

			const user_id = level_id.split(':')[0];

			const user_info = await user_info_request(user_id);
			if (user_info === null) return false;

			if (this.user_name !== user_info.user_name) {
				window.toast(
					'You can only download your own levels',
					'warning',
				);
				return false;
			}

			return true;
		},
		async download_level(level_id) {
			let [user_id, map_id, iteration] = level_id.split(':');

			const details = await level_details_request(level_id);
			if (!details) return null;

			iteration = iteration || details.iteration;
			const download_id = [user_id, map_id, iteration].join(':');

			const level = await download_level_request(download_id);
			return level;
		},
		async open_starting_level() {
			const params = new URLSearchParams(window.location.search);
			const level_id = params.get('level');

			if (level_id && (await this.can_download_level(level_id))) {
				const level = await this.download_level(level_id);
				if (level) {
					const blob = new Blob([level], {
						type: 'application/octet-stream',
					});
					this.json = await encoding.decodeLevel(blob);
				}
			} else {
				this.json = this.default_level
					? encoding.deepClone(this.default_level)
					: encoding.createLevel();
			}

			this.set_json(this.json);
		},
		set_json(json, skip = []) {
			this.json = json;
			if (!skip.includes('json_panel'))
				this.$refs.json_panel.set_json(this.json);
			if (!skip.includes('viewport_panel'))
				this.$refs.viewport_panel.set_json(this.json);
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
		set_popup(inputs, func) {
			this.popup_props.inputs = inputs;
			this.popup_props.func = func;
		},
		scope(func) {
			func(this);
		},
		resize_left() {
			this.$refs.left_panel.size();
		},
		set_protobuf(protobuf) {
			window.toast('protobuf');
			console.log(protobuf);
			encoding.set_protobuf(protobuf);
		},
		open_protobuf() {
			this.$refs.protobuf_panel.set(encoding.get_protobuf());
			this.show_protobuf_panel = true;
		},
		close_protobuf() {
			this.show_protobuf_panel = false;
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
			@popup="set_popup"
			@scope="scope"
		/>
		<ResizableRowPanel
			class="main-panel"
			:ref="'main_panel'"
			@resize="resize_left"
		>
			<template #first>
				<ResizableRowPanel class="left-panel" ref="left_panel">
					<template #first>
						<TemplatesPanel @modifier="run_modifier" />
					</template>
					<template #second>
						<ViewportPanel
							class="view-panel"
							:ref="'viewport_panel'"
							@changed="viewport_changed"
							@modifier="run_modifier"
							@scope="scope"
						/>
					</template>
				</ResizableRowPanel>
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
		<footer>
			<StatisticsPanel ref="statistics" />
		</footer>
		<PopupPanel :inputs="popup_props.inputs" :func="popup_props.func" />
		<ProtobufPanel
			class="protobuf-panel"
			v-show="show_protobuf_panel"
			@set="set_protobuf"
			@close="close_protobuf"
			ref="protobuf_panel"
		/>
	</main>
</template>

<style>
html:has(#editor) {
	background-color: #1e1e1e;
	overscroll-behavior: none;
}
#editor * {
	/* outline: 0.1px solid #0f05; */
}
</style>
<style scoped>
.protobuf-panel {
	width: 80%;
	height: 80%;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
#editor {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
}
footer {
	height: 1.2rem;
	font-size: 0.8rem;
	background-color: #1e1e1e;
}
.main-panel {
	height: calc(100% - 3rem - 1rem);
}
.side-panel {
	height: 100%;
}
.view-panel {
	height: 100%;
}
.left-panel {
	height: 100%;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
