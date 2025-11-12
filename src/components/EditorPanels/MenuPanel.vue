<script>
import encoding from '@/assets/tools/encoding';
import video from '@/assets/tools/video';
import image from '@/assets/tools/image';

export default {
	data() {
		return {
			menu: {
				File: {
					New: {
						Empty: { func: this.load_new_level },
						Template: { func: this.load_template },
					},
					Open: {
						'Level File': {
							func: this.open_level_file,
							file: true,
						},
						'JSON File': {
							func: this.open_json_file,
							file: true,
						},
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
						func: this.insert_level,
						file: true,
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
					'Modded Node': {
						'Neon & Transparent': {
							func: this.insert_neon_transparent,
						},
						'Scalable Start': { func: this.insert_scalable_start },
						'Scalable Finish': {
							func: this.insert_scalable_finish,
						},
						'High Gravity': { func: this.insert_high_gravity },
						'Break Times': { func: this.insert_modded_crumbling },
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
					'Low Res': { func: this.toggle_low_res },
					Teleport: {
						Start: { func: this.teleport_start },
						Finish: { func: this.teleport_finish },
						'Full View': { func: this.teleport_full },
						Origin: { func: this.teleport_origin },
					},
					'Huge Far': { func: this.toggle_huge_far },
					'Toggle Groups': { func: this.toggle_groups },
					'Toggle Animations': { func: this.toggle_animations },
					'Toggle Triggers': { func: this.toggle_triggers },
					'Toggle Fog': { func: this.toggle_fog },
					'Copy Camera': { func: this.copy_camera_state },
				},
				Help: {
					Tutorial: { href: 'https://youtube.com/@dotindex' },
					Discord: { href: 'http://discord.grabvr.tools' },
					'Clear Storage': { func: this.clear_storage },
				},
			},
		};
	},
	components: {},
	emits: ['modifier', 'function', 'viewport'],
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
								class="menu-btn"
								v-else
								@click="
									() => {
										!data.file && data.func;
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
										class="menu-btn"
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
