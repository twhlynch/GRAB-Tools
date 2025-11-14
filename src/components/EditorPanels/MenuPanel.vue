<script>
import encoding from '@/assets/tools/encoding';
import video from '@/assets/tools/video';
import image from '@/assets/tools/image';
import levelNodes from '@/assets/tools/nodes';
import monochrome from '@/assets/tools/monochrome';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import group from '@/assets/tools/group';
import obj from '@/assets/tools/obj';
import { useConfigStore } from '@/stores/config';
import { VERSION } from '@/config';

export default {
	data() {
		return {
			menu: {
				File: {
					Load: {
						New: { func: this.load_new_level },
						'Level File': {
							func: this.open_level_file,
							file: true,
						},
						'JSON File': {
							func: this.open_json_file,
							file: true,
						},
						Template: { func: this.load_template },
						'Cheat Sheet': { func: this.open_cheat_sheet },
					},
					Save: {
						Level: { func: this.save_level },
						JSON: { func: this.save_json },
						glTF: { func: this.save_gltf },
					},
				},
				Insert: {
					Level: {
						Level: {
							func: this.insert_level,
							file: true,
						},
						JSON: {
							func: this.insert_json,
							file: true,
						},
						Nodes: {
							func: this.insert_nodes,
							file: true,
						},
					},
					Node: {
						Static: { func: this.insert_static },
						Animated: { func: this.insert_animated },
						Colored: { func: this.insert_colored },
						Sign: { func: this.insert_sign },
						Start: { func: this.insert_start },
						Finish: { func: this.insert_finish },
						Gravity: { func: this.insert_gravity },
						Particle: { func: this.insert_particle },
						Trigger: { func: this.insert_trigger },
						Sound: { func: this.insert_sound },
						'Colored Lava': { func: this.insert_colored_lava },
						'Ambience Trigger': {
							func: this.insert_ambience_trigger,
						},
						'Animation Trigger': {
							func: this.insert_animation_trigger,
						},
						'Sound Trigger': { func: this.insert_sound_trigger },
						'Sublevel Trigger': {
							func: this.insert_sublevel_trigger,
						},
					},
					Media: {
						Image: {
							func: this.insert_image,
							file: true,
						},
						Video: {
							func: this.insert_video,
							file: true,
						},
						'Point Cloud': {
							func: this.insert_model,
							file: true,
						},
						Text: { func: this.insert_text },
					},
				},
				Settings: {
					Login: {
						href: `https://auth.oculus.com/sso/?organization_id=264907536624075&redirect_uri=https://grabvr.tools/editor`,
					},
					'Save Config': { func: this.save_config },
					'Edit Protobuf': { func: this.edit_protobuf },
				},
				Edit: {
					Functions: {
						Duplicate: { func: this.duplicate_level },
						Monochrome: { func: this.monochrome_level },
						'Unlock All': { func: this.unlock_all },
						'Lock All': { func: this.lock_all },
						Pixelate: { func: this.pixelate_effect },
						'Ungroup All': { func: this.ungroup_all },
					},
					Randomize: {
						Materials: { func: this.randomize_materials },
						Shapes: { func: this.randomize_shapes },
						Positions: { func: this.randomize_positions },
						Rotations: { func: this.randomize_rotations },
						Scales: { func: this.randomize_scales },
						Colors: { func: this.randomize_colors },
					},
					Ambience: {
						Sliders: { func: this.ambience_sliders },
						Min: { func: this.ambience_min },
						Max: { func: this.ambience_max },
						Random: { func: this.ambience_random },
						Default: { func: this.ambience_default },
						Templates: { func: this.ambience_templates },
					},
					Convert: { func: this.open_convert_menu },
					Group: { func: this.group_level },
					Ungroup: { func: this.ungroup_level },
					Mirror: {
						X: { func: this.mirror_x },
						Y: { func: this.mirror_y },
						Z: { func: this.mirror_z },
					},
				},
				View: {
					Teleport: {
						Start: { func: this.teleport_start },
						Finish: { func: this.teleport_finish },
						'Full View': { func: this.teleport_full },
						Origin: { func: this.teleport_origin },
					},
					Toggle: {
						'Huge Far': { func: this.toggle_huge_far },
						Groups: { func: this.toggle_groups },
						'Animation paths': { func: this.toggle_animations },
						Triggers: { func: this.toggle_triggers },
						Sound: { func: this.toggle_sound },
						'Trigger connections': {
							func: this.toggle_trigger_connections,
						},
						Fog: { func: this.toggle_fog },
						Skybox: { func: this.toggle_sky },
					},
					'Copy Camera': { func: this.copy_camera_state },
				},
				Help: {
					Tutorial: { href: 'https://youtube.com/@dotindex' },
					Discord: { href: 'http://discord.grabvr.tools' },
					'Clear Storage': { func: this.clear_storage },
					Keybinds: {
						// TODO: add small key hints to buttons
						'WASD: movement': { href: '#' },
						'EQ: up/down': { href: '#' },
						'Shift: speed': { href: '#' },
						'Right: orbit': { href: '#' },
						'Left: pan': { href: '#' },
						'Scroll: zoom': { href: '#' },
						'Q: transform space': { href: '#' },
						'E: scale': { href: '#' },
						'R: rotate': { href: '#' },
						'T: translate': { href: '#' },
						'C: clone': { href: '#' },
						'X: delete': { href: '#' },
						'G: group': { href: '#' },
					},
					[`v${this.$config.VERSION}`]: {
						href: 'https://github.com/twhlynch/GRAB-Tools',
					},
				},
			},
		};
	},
	components: {},
	emits: ['modifier', 'function', 'viewport', 'popup'],
	methods: {
		load_new_level() {
			this.$emit('modifier', (_) => {
				return encoding.createLevel();
			});
		},
		async open_level_file(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const json = await encoding.decodeLevel(file);

			this.$emit('modifier', (_) => {
				return json;
			});
		},
		async open_json_file(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const json = JSON.parse(await file.text());

			this.$emit('modifier', (_) => {
				return json;
			});
		},
		save_level() {
			this.$emit('function', async (json) => {
				const level = await encoding.encodeLevel(json);
				encoding.downloadLevel(level);
			});
		},
		save_json() {
			this.$emit('function', (json) => {
				encoding.downloadJSON(json);
			});
		},
		save_gltf() {
			this.$emit('viewport', (scope) => {
				const exporter = new GLTFExporter();
				exporter.parse(
					scope.scene,
					(gltf) => {
						let blob = new Blob([JSON.stringify(gltf)], {
							type: 'text/json',
						});
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(blob);
						link.download =
							Date.now().toString().slice(0, -3) + '.gltf';
						link.click();
					},
					(err) => {
						window.toast(err, 'error');
					},
					{},
				);
			});
		},
		async insert_level(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const new_json = await encoding.decodeLevel(file);

			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(new_json.levelNodes);
				return json;
			});
		},
		async insert_json(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const new_json = JSON.parse(await file.text());

			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(new_json.levelNodes);
				return json;
			});
		},
		async insert_nodes(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const new_json = JSON.parse(await file.text());

			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(new_json);
				return json;
			});
		},
		async insert_image(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const group = await image.image(file, 30, 30, 'cubes', 'plane');

			this.$emit('modifier', (json) => {
				json.levelNodes.push(group);
				return json;
			});
		},
		async insert_video(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const level_nodes = await video.video(file, 30, 30);

			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(level_nodes);
				return json;
			});
		},
		async insert_model(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const level_nodes = await obj.obj(file, 'particles');

			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(level_nodes);
				return json;
			});
		},
		insert_node_wrapper(func) {
			this.$emit('modifier', (json) => {
				json.levelNodes.push(func());
				return json;
			});
		},
		insert_static() {
			const node = levelNodes.levelNodeStatic();
			delete node.levelNodeStatic.color1;
			delete node.levelNodeStatic.color2;
			this.$emit('modifier', (json) => {
				json.levelNodes.push(node);
				return json;
			});
		},
		insert_animated() {
			const node = levelNodes.levelNodeStatic();
			const animation = levelNodes.animation();
			animation.frames.push(levelNodes.frame());
			const frame = levelNodes.frame();
			frame.time = 1;
			frame.position.y = 1;
			animation.frames.push(frame);
			node.animations.push(animation);
			this.$emit('modifier', (json) => {
				json.levelNodes.push(node);
				return json;
			});
		},
		insert_colored() {
			const node = levelNodes.levelNodeStatic();
			node.levelNodeStatic.material = 8;
			this.$emit('modifier', (json) => {
				json.levelNodes.push(node);
				return json;
			});
		},
		insert_sign() {
			this.insert_node_wrapper(levelNodes.levelNodeSign);
		},
		insert_start() {
			this.insert_node_wrapper(levelNodes.levelNodeStart);
		},
		insert_finish() {
			this.insert_node_wrapper(levelNodes.levelNodeFinish);
		},
		insert_gravity() {
			this.insert_node_wrapper(levelNodes.levelNodeGravity);
		},
		insert_particle() {
			this.insert_node_wrapper(levelNodes.levelNodeParticleEmitter);
		},
		insert_trigger() {
			this.insert_node_wrapper(levelNodes.levelNodeTrigger);
		},
		insert_sound() {
			this.insert_node_wrapper(levelNodes.levelNodeSound);
		},
		insert_colored_lava() {
			const node = levelNodes.levelNodeStatic();
			node.levelNodeStatic.material = 3;
			node.levelNodeStatic.color1.r = 1;
			node.levelNodeStatic.color2.b = 1;
			this.$emit('modifier', (json) => {
				json.levelNodes.push(node);
				return json;
			});
		},
		insert_ambience_trigger() {
			const trigger = levelNodes.levelNodeTrigger();
			trigger.levelNodeTrigger.triggerSources.push(
				levelNodes.triggerSourceBasic(),
			);
			trigger.levelNodeTrigger.triggerTargets.push(
				levelNodes.triggerTargetAmbience(),
			);
			this.$emit('modifier', (json) => {
				json.levelNodes.push(trigger);
				return json;
			});
		},
		insert_animation_trigger() {
			const trigger = levelNodes.levelNodeTrigger();
			trigger.levelNodeTrigger.triggerSources.push(
				levelNodes.triggerSourceBasic(),
			);
			trigger.levelNodeTrigger.triggerTargets.push(
				levelNodes.triggerTargetAnimation(),
			);
			this.$emit('modifier', (json) => {
				json.levelNodes.push(trigger);
				return json;
			});
		},
		insert_sound_trigger() {
			const trigger = levelNodes.levelNodeTrigger();
			trigger.levelNodeTrigger.triggerSources.push(
				levelNodes.triggerSourceBasic(),
			);
			trigger.levelNodeTrigger.triggerTargets.push(
				levelNodes.triggerTargetSound(),
			);
			this.$emit('modifier', (json) => {
				json.levelNodes.push(trigger);
				return json;
			});
		},
		insert_sublevel_trigger() {
			const trigger = levelNodes.levelNodeTrigger();
			trigger.levelNodeTrigger.triggerSources.push(
				levelNodes.triggerSourceBasic(),
			);
			trigger.levelNodeTrigger.triggerTargets.push(
				levelNodes.triggerTargetSubLevel(),
			);
			this.$emit('modifier', (json) => {
				json.levelNodes.push(trigger);
				return json;
			});
		},
		teleport_start() {
			this.$emit('viewport', (scope) => {
				scope.teleport_start();
			});
		},
		teleport_finish() {
			this.$emit('viewport', (scope) => {
				scope.teleport_finish();
			});
		},
		teleport_origin() {
			this.$emit('viewport', (scope) => {
				scope.teleport_origin();
			});
		},
		teleport_full() {
			this.$emit('viewport', (scope) => {
				scope.teleport_full();
			});
		},
		unlock_all() {
			this.$emit('modifier', (json) => {
				json.levelNodes.forEach((node) => {
					levelNodes.traverse_node(node, (n) => {
						n.isLocked = false;
					});
				});
				return json;
			});
		},
		lock_all() {
			this.$emit('modifier', (json) => {
				json.levelNodes.forEach((node) => {
					levelNodes.traverse_node(node, (n) => {
						n.isLocked = true;
					});
				});
				return json;
			});
		},
		group_level() {
			this.$emit('modifier', (json) => {
				json.levelNodes = [group.groupNodes(json.levelNodes)];
				return json;
			});
		},
		duplicate_level() {
			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.concat(json.levelNodes);
				return json;
			});
		},
		monochrome_level() {
			this.$emit('modifier', (json) => {
				json.levelNodes = monochrome.monochrome(json.levelNodes);
				return json;
			});
		},
		toggle_huge_far() {
			this.$emit('viewport', (scope) => {
				scope.huge_far = !scope.huge_far;
				scope.camera.far = scope.huge_far ? 4000000 : 10000;
			});
		},
		toggle_triggers() {
			this.$emit('viewport', (scope) => {
				scope.show_triggers = !scope.show_triggers;
				scope.level.nodes.levelNodeTrigger.forEach((node) => {
					node.visible = scope.show_triggers;
				});
			});
		},
		toggle_sound() {
			this.$emit('viewport', (scope) => {
				scope.show_sound = !scope.show_sound;
				scope.level.nodes.levelNodeSound.forEach((node) => {
					node.visible = scope.show_sound;
				});
			});
		},
		toggle_fog() {
			this.$emit('viewport', (scope) => {
				// FIXME: not staying set
				scope.show_fog = !scope.show_fog;
				scope.level.nodes.all.forEach((node) => {
					if (node.material?.uniforms?.fogEnabled) {
						node.material.uniforms.fogEnabled.value =
							scope.show_fog;
					}
				});
			});
		},
		toggle_sky() {
			this.$emit('viewport', (scope) => {
				scope.toggle_sky();
			});
		},
		save_config() {
			this.$emit('viewport', (scope) => {
				scope.save_config();
			});
		},
		clear_storage() {
			const configStore = useConfigStore();
			configStore.$reset();
		},
	},
	mounted() {
		const buttons = document.querySelectorAll('.menu-btn');
		buttons.forEach((button) => {
			const file_input = button.querySelector('input[type="file"]');
			if (file_input) {
				button.onclick = () => {
					file_input.click();
				};
			}
		});
	},
};
</script>

<template>
	<section>
		<nav class="menu">
			<ul class="menu-list">
				<li
					v-for="[category, buttons] of Object.entries(menu)"
					:key="category"
				>
					<button class="menu-btn">{{ category }}</button>
					<ul class="menu-dropdown">
						<li
							v-for="[button, data] of Object.entries(buttons)"
							:key="category + button"
						>
							<a
								class="menu-btn"
								v-if="data.href"
								:href="data.href"
								>{{ button }}</a
							>
							<button
								:class="
									'menu-btn' +
									(data.hasOwnProperty('func') && !data.func
										? ' unimplemented'
										: '')
								"
								v-else
								@click="
									() => {
										!data.file && data.func();
									}
								"
							>
								{{ button
								}}<input
									v-if="data.file"
									type="file"
									@change="data.func"
								/>
							</button>
							<ul
								class="menu-dropdown"
								v-if="
									!data.hasOwnProperty('func') && !data.href
								"
							>
								<li
									v-for="[
										sub_button,
										sub_data,
									] of Object.entries(data)"
									:key="category + button + sub_button"
								>
									<a
										class="menu-btn"
										v-if="sub_data.href"
										:href="data.href"
										>{{ sub_button }}</a
									>
									<button
										:class="
											'menu-btn' +
											(!sub_data.func
												? ' unimplemented'
												: '')
										"
										v-else
										@click="
											() => {
												!sub_data.file &&
													sub_data.func();
											}
										"
									>
										{{ sub_button
										}}<input
											v-if="sub_data.file"
											type="file"
											@change="sub_data.func"
										/>
									</button>
								</li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
		</nav>
	</section>
</template>

<style scoped>
section {
	width: 100%;
	height: 3rem;
	z-index: 900;
}

a {
	text-decoration: none;
}

input[type='file'] {
	display: none;
}

.menu {
	box-sizing: border-box;
	height: 100%;
	background-color: #1e1e1e;
}

.menu-list {
	height: 100%;
	list-style: none;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 6px;
	padding-inline: 6px;
	margin: 0;
}
.menu-list > li {
	> .menu-btn:hover {
		background-color: #3e3e3e;
	}
}
.menu-btn {
	background-color: #2e2e2e;
	color: white;
	padding: 6px 16px;
	border: none;
	cursor: pointer;
	font-size: 0.8rem;
	font-family: var(--font-family-default);
}
.menu-dropdown .menu-btn {
	border-radius: 0;
}
.menu-btn:hover,
.menu-btn:has(+ .menu-dropdown:hover) {
	background-color: #2e2e2e;
}

.menu-dropdown li > .menu-btn {
	border-right: 1px solid var(--border-color);
	border-left: 1px solid var(--border-color);
	border-bottom: 0.2px solid var(--border-color);
	border-top: 0.2px solid var(--border-color);
}
.menu-dropdown li:last-child > .menu-btn {
	border-bottom: 1px solid var(--border-color);
}
.menu-dropdown li:first-child > .menu-btn {
	border-top: 1px solid var(--border-color);
	margin-bottom: -1px;
}

.menu-dropdown {
	display: none;
	padding: 0;
	padding-top: 5px;
	margin: 0;
	list-style: none;
	position: absolute;
	z-index: 2;
	min-width: 160px;
	white-space: nowrap;
}

.menu-dropdown .menu-btn {
	background-color: #1e1e1e;
	color: white;
	text-align: left;
	padding: 8px 16px;
	display: block;
	width: 100%;
	border: none;

	&.unimplemented {
		color: #3e3e3e;
	}
}

.menu-dropdown .menu-dropdown {
	margin-left: 100%;
	padding-left: 2px;
}
.menu-dropdown .menu-dropdown::before {
	content: ' ';
	position: absolute;
	z-index: -1;
	top: -50px; /* -30 */
	left: -6px; /* -2 */
	/* height: 20px; */
	bottom: 50px;
	border: 35px solid transparent; /* 5 */
}

.menu-btn:hover + .menu-dropdown,
.menu-dropdown:hover {
	display: block;
}

.menu-btn:focus {
	outline: none;
}

.menu-dropdown .menu-btn:hover {
	background-color: #2e2e2e;
}

.menu-btn:not(.menu-list > li > ul > li > .menu-btn):not(
		.menu-list > li > .menu-btn
	) {
	transform: translateY(-100%) translateY(-4.5px) translateX(-1px);
}
.menu-btn:has(+ ul)::after {
	content: '>';
	font-family: var(--font-family-alt);
}
.menu-list > li > .menu-btn::after {
	content: none;
}
.menu-btn::after {
	position: absolute;
	width: 10px;
	left: 88%;
}
</style>
