<script>
import audio from '@/assets/tools/audio';
import car from '@/assets/tools/car';
import encoding from '@/assets/tools/encoding';
import group from '@/assets/tools/group';
import gun from '@/assets/tools/gun';
import image from '@/assets/tools/image';
import monochrome from '@/assets/tools/monochrome';
import obj from '@/assets/tools/obj';
import signs from '@/assets/tools/signs';
import svg from '@/assets/tools/svg';
import video from '@/assets/tools/video';
import { useConfigStore } from '@/stores/config';
import { mapActions, mapState } from 'pinia';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

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
						Default: {
							func: this.load_default_level,
						},
						Template: { func: this.open_templates },
						'Cheat Sheet': { func: this.open_cheat_sheet },
					},
					Save: {
						Level: { func: this.save_level },
						JSON: { func: this.save_json },
						glTF: { func: this.save_gltf },
						'Set Default': {
							func: this.set_default_level,
						},
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
						Crumbling: { func: this.insert_crumbling },
						Sign: { func: this.insert_sign },
						Start: { func: this.insert_start },
						Finish: { func: this.insert_finish },
						Gravity: { func: this.insert_gravity },
						Particle: { func: this.insert_particle },
						Trigger: { func: this.insert_trigger },
						Sound: { func: this.insert_sound },
						Code: { func: this.insert_gasm },
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
						},
						Video: {
							func: this.insert_video,
						},
						'Point Cloud': {
							func: this.insert_model,
						},
						Text: { func: this.insert_text },
						SVG: { func: this.insert_svg },
						'Audio (SFX2GL)': { func: this.insert_audio },
					},
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
						Min: { func: this.ambience_min },
						Max: { func: this.ambience_max },
						Random: { func: this.ambience_random },
						Default: { func: this.ambience_default },
					},
					Convert: {
						Material: { func: this.open_material_convert_menu },
						Shape: { func: this.open_shape_convert_menu },
					},
					Group: { func: this.group_level },
					Mirror: {
						X: { func: this.mirror_x },
						Y: { func: this.mirror_y },
						Z: { func: this.mirror_z },
					},
					Programs: {
						'Make Gun (unfinished)': { func: this.make_gun },
						'Make Car (unfinished)': { func: this.make_car },
					},
				},
				Select: {
					All: {
						func: this.select_all,
					},
					Shape: {
						...Object.fromEntries(
							Array.from(
								{
									length:
										Object.entries(encoding.shapes())
											.length -
										encoding.shapes()
											.__END_OF_SPECIAL_PARTS__ -
										1,
								},
								(_, i) => {
									return [
										this.format_type(
											encoding.shapes()[1000 + i],
										),
										{
											func: () => {
												this.select_by_shape(1000 + i);
											},
										},
									];
								},
							),
						),
					},
					Material: {
						...Object.fromEntries(
							Array.from(
								{
									length: Object.entries(encoding.materials())
										.length,
								},
								(_, i) => {
									return [
										this.format_type(
											encoding.materials()[i],
										),
										{
											func: () => {
												this.select_by_material(i);
											},
											num: i,
										},
									];
								},
							).filter(
								(item) =>
									item[1].num !==
									encoding.materials().TRIGGER,
							),
						),
					},
					Type: {
						...Object.fromEntries(
							Array.from(
								{
									length: encoding.load().COD.Level.LevelNode
										.oneofs.content.oneof.length,
								},
								(_, i) => {
									return [
										encoding.load().COD.Level.LevelNode
											.oneofs.content.oneof[i],
										{
											func: () => {
												this.select_by_type(
													encoding.load().COD.Level
														.LevelNode.oneofs
														.content.oneof[i],
												);
											},
										},
									];
								},
							),
						),
					},
					Color: {
						func: this.select_by_color,
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
						'Code connections': {
							func: this.toggle_gasm_connections,
						},
						Fog: { func: this.toggle_fog },
						Skybox: { func: this.toggle_sky },
						'Key Hints': { func: this.toggle_key_hints },
					},
					'Copy Camera': { func: this.copy_camera_state },
				},
				Settings: {
					Login: {
						href: `https://auth.oculus.com/sso/?organization_id=264907536624075&redirect_uri=${this.$config.PAGE_URL}editor`,
					},
					'Save Config': { func: this.save_config },
					'Edit Protobuf': { func: this.edit_protobuf },
					Controls: {
						'Fly Speed': {
							func: this.set_fly_speed,
						},
						'Vim Mode': {
							func: this.toggle_vim_mode,
						},
					},
					Experimental: {
						'Toggle Shadows': {
							func: this.toggle_shadows,
						},
					},
				},
				Help: {
					Tutorial: { href: 'https://youtube.com/@dotindex' },
					Discord: { href: this.$config.DISCORD_URL },
					'Clear Storage': { func: this.clear_storage },
					'Show Keybinds': {
						func: this.show_keybinds,
					},
					Credit: {
						Slin: { href: 'https://slin.dev' },
						EBSpark: { href: 'https://ebspark.github.io/' },
						TheTrueFax: { href: 'https://thetruefax.github.io/' },
					},
					[`v${this.$config.VERSION}`]: {
						href: this.$config.REPO_URL,
					},
				},
			},
		};
	},
	components: {},
	emits: ['modifier', 'function', 'viewport', 'popup', 'scope'],
	methods: {
		select_by_material(material) {
			this.$emit('viewport', (scope) => {
				scope.select_by_material(material);
			});
		},
		select_by_shape(shape) {
			this.$emit('viewport', (scope) => {
				scope.select_by_shape(shape);
			});
		},
		select_by_type(type) {
			this.$emit('viewport', (scope) => {
				scope.select_by_type(type);
			});
		},
		select_by_color() {
			this.$emit('viewport', (scope) => {
				scope.select_by_color();
			});
		},
		mirror_x() {
			this.$emit('viewport', (scope) => {
				scope.mirror_x();
			});
		},
		mirror_y() {
			this.$emit('viewport', (scope) => {
				scope.mirror_y();
			});
		},
		mirror_z() {
			this.$emit('viewport', (scope) => {
				scope.mirror_z();
			});
		},
		select_all() {
			this.$emit('viewport', (scope) => {
				scope.select_all();
			});
		},
		format_type(type) {
			// FIXME: duplicate
			return type
				.split('_')
				.map(
					(word) =>
						word.charAt(0).toUpperCase() +
						word.toLowerCase().slice(1),
				)
				.join(' ');
		},
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
			if (!json) return;

			this.$emit('modifier', (_) => {
				return json;
			});
		},
		async open_json_file(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const json = encoding.json_parse(await file.text());
			if (!json) return;

			this.$emit('modifier', (_) => {
				return json;
			});
		},
		save_level() {
			this.$emit('function', async (json) => {
				const level = await encoding.encodeLevel(json);
				if (!level) {
					window.toast('Invalid level data', 'error');
					return;
				}
				encoding.downloadLevel(level);
			});
		},
		save_json() {
			this.$emit('function', (json) => {
				encoding.downloadJSON(json);
			});
		},
		set_default_level() {
			this.$emit('function', (json) => {
				const configStore = useConfigStore();
				configStore.default_level = encoding.deepClone(json);
			});
		},
		load_default_level() {
			this.$emit('modifier', (_) => {
				const configStore = useConfigStore();
				return configStore.default_level
					? encoding.deepClone(configStore.default_level)
					: encoding.createLevel();
			});
		},
		open_templates() {
			this.$emit('scope', (scope) => {
				scope.$refs.left_panel.size(
					Math.min(
						350,
						scope.$refs.left_panel.$el.getBoundingClientRect()
							.width / 2,
					),
				);
			});
		},
		open_cheat_sheet() {
			this.$emit('modifier', (_) => {
				const modded_shapes = [
					null,
					...Object.values(encoding.shapes()),
					encoding.shapes().__END_OF_SPECIAL_PARTS__ + 1,
					encoding.shapes().__END_OF_SPECIAL_PARTS__ + 2,
					encoding.shapes().__END_OF_SPECIAL_PARTS__ + 3,
				];
				const modded_materials = [
					null,
					...Object.values(encoding.materials()),
					...Array.from(
						{
							length:
								Object.values(encoding.materials()).length * 2 -
								1 -
								1,
						},
						(_, i) =>
							i -
							Object.values(encoding.materials()).length +
							1 +
							1,
					),
				];

				const nodes = [];

				for (let i in modded_shapes) {
					for (let j in modded_materials) {
						const node = encoding.levelNodeStatic();
						const data = node.levelNodeStatic;
						data.shape = modded_shapes[i];
						data.material = modded_materials[j];
						data.position = { x: Number(i), z: Number(j) };
						data.color1 = { r: 1, g: 1, b: 1 };
						data.color2 = { r: 1, g: 1, b: 1 };
						data.isNeon = true;
						data.isTransparent = true;
						nodes.push(node);
					}
				}
				const level = encoding.createLevel(
					nodes,
					'The Cheat Sheet',
					`All possible types for v${this.$config.FORMAT_VERSION} All objects are neon and transparent`,
					'.index',
				);

				return level;
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
						err.message = 'Failed glTF export: ' + err.message;
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
			const json = await encoding.decodeLevel(file);
			this.insert_selection_nodes(json?.levelNodes);
		},
		async insert_json(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const json = encoding.json_parse(await file.text());
			this.insert_selection_nodes(json?.levelNodes);
		},
		insert_selection_nodes(nodes) {
			if (!nodes) return;
			this.$emit('viewport', (scope) => {
				this.$emit('modifier', (json) => {
					const node_list =
						scope.editing_parent.userData?.node?.levelNodeGroup
							?.childNodes ?? (json.levelNodes ??= []);
					node_list.push(...nodes);
					return json;
				});
			});
		},
		async insert_nodes(e) {
			const files = Array.from(e.target.files);
			if (!files.length) return;

			const file = files[0];
			const json = encoding.json_parse(await file.text());
			this.insert_selection_nodes(json?.levelNodes ?? json);
		},
		insert_audio() {
			this.$emit(
				'popup',
				[
					{
						type: 'number',
						text: 'Pitch samples (40)',
					},
					{
						type: 'file',
						accept: 'audio/*',
					},
				],
				async (samples, files) => {
					if (!files.length) {
						window.toast('No audio file chosen', 'error');
						return;
					}

					samples = parseInt(samples) || 40;

					const file = files[0];

					const node = await audio.audio(file, samples);
					if (!node) return;

					this.insert_selection_nodes([node]);
				},
			);
		},
		insert_image() {
			this.$emit(
				'popup',
				[
					{
						type: 'number',
						text: 'width (50)',
					},
					{
						type: 'number',
						text: 'height (50)',
					},
					{
						type: 'option',
						options: ['cubes', 'particles'],
					},
					{
						type: 'option',
						options: ['plane', 'sphere'],
					},
					{
						type: 'file',
						accept: 'image/*',
					},
				],
				async (width, height, mode, shape, files) => {
					if (!files.length) {
						window.toast('No image file chosen', 'error');
						return;
					}

					const file = files[0];
					width = parseInt(width) || 50;
					height = parseInt(height.value) || 50;

					const node = await image.image(
						file,
						width,
						height,
						mode,
						shape,
					);

					this.insert_selection_nodes([node]);
				},
			);
		},
		insert_video() {
			this.$emit(
				'popup',
				[
					{
						type: 'number',
						text: 'width (40)',
					},
					{
						type: 'number',
						text: 'height (30)',
					},
					{
						type: 'file',
						accept: '.mp4',
					},
				],
				async (width, height, files) => {
					if (!files.length) {
						window.toast('No video file chosen', 'error');
						return;
					}

					const file = files[0];
					width = parseInt(width) || 40;
					height = parseInt(height.value) || 30;

					const { remove, message } = window.toast(
						'Video progress: 0%',
						'message',
						true,
					);
					const nodes = await video.video(
						file,
						width,
						height,
						(progress) => {
							message.value = `Video progress: ${Math.ceil(
								progress,
							)}%`;
						},
					);
					remove();

					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_model() {
			this.$emit(
				'popup',
				[
					{
						type: 'option',
						options: ['particles', 'spheres'],
					},
					{
						type: 'file',
						accept: '.obj',
					},
				],
				async (mode, files) => {
					if (!files.length) {
						window.toast('No file chosen', 'error');
						return;
					}

					const file = files[0];
					const nodes = await obj.obj(file, mode);

					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_text() {
			this.$emit(
				'popup',
				[
					{
						type: 'textarea',
						text: 'text',
					},
					{
						type: 'option',
						options: ['simple', 'animated'],
					},
				],
				async (text, mode) => {
					const nodes = signs.signs(text, mode === 'animated');
					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_svg() {
			this.$emit(
				'popup',
				[
					{
						type: 'number',
						text: 'detail (600)',
					},
					{
						type: 'file',
						accept: '.svg',
					},
				],
				async (detail, files) => {
					if (!files.length) {
						window.toast('No file chosen', 'error');
						return;
					}

					const file = files[0];
					detail = parseInt(detail) || 600;

					const nodes = await svg.svg(file, detail);
					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_static() {
			const node = encoding.levelNodeStatic();
			delete node.levelNodeStatic.color1;
			delete node.levelNodeStatic.color2;
			this.insert_selection_nodes([node]);
		},
		insert_crumbling() {
			const node = encoding.levelNodeCrumbling();
			this.insert_selection_nodes([node]);
		},
		insert_animated() {
			const node = encoding.levelNodeStatic();
			const animation = encoding.animation();
			animation.frames.push(encoding.frame());
			const frame = encoding.frame();
			frame.time = 1;
			frame.position.y = 1;
			animation.frames.push(frame);
			node.animations.push(animation);
			this.insert_selection_nodes([node]);
		},
		insert_colored() {
			const node = encoding.levelNodeStatic();
			node.levelNodeStatic.material = 8;
			this.insert_selection_nodes([node]);
		},
		insert_sign() {
			this.insert_selection_nodes([encoding.levelNodeSign()]);
		},
		insert_start() {
			this.insert_selection_nodes([encoding.levelNodeStart()]);
		},
		insert_finish() {
			this.insert_selection_nodes([encoding.levelNodeFinish()]);
		},
		insert_gravity() {
			this.insert_selection_nodes([encoding.levelNodeGravity()]);
		},
		insert_particle() {
			this.insert_selection_nodes([encoding.levelNodeParticleEmitter()]);
		},
		insert_trigger() {
			this.insert_selection_nodes([encoding.levelNodeTrigger()]);
		},
		insert_sound() {
			this.insert_selection_nodes([encoding.levelNodeSound()]);
		},
		insert_gasm() {
			this.insert_selection_nodes([encoding.levelNodeGASM()]);
		},
		insert_colored_lava() {
			const node = encoding.levelNodeStatic();
			node.levelNodeStatic.material = 3;
			node.levelNodeStatic.color1.r = 1;
			node.levelNodeStatic.color2.b = 1;
			this.insert_selection_nodes([node]);
		},
		insert_ambience_trigger() {
			const node = encoding.levelNodeTrigger();
			node.levelNodeTrigger.triggerSources.push(
				encoding.triggerSourceBasic(),
			);
			node.levelNodeTrigger.triggerTargets.push(
				encoding.triggerTargetAmbience(),
			);
			this.insert_selection_nodes([node]);
		},
		insert_animation_trigger() {
			const node = encoding.levelNodeTrigger();
			node.levelNodeTrigger.triggerSources.push(
				encoding.triggerSourceBasic(),
			);
			node.levelNodeTrigger.triggerTargets.push(
				encoding.triggerTargetAnimation(),
			);
			this.insert_selection_nodes([node]);
		},
		insert_sound_trigger() {
			const node = encoding.levelNodeTrigger();
			node.levelNodeTrigger.triggerSources.push(
				encoding.triggerSourceBasic(),
			);
			node.levelNodeTrigger.triggerTargets.push(
				encoding.triggerTargetSound(),
			);
			this.insert_selection_nodes([node]);
		},
		insert_sublevel_trigger() {
			const node = encoding.levelNodeTrigger();
			node.levelNodeTrigger.triggerSources.push(
				encoding.triggerSourceBasic(),
			);
			node.levelNodeTrigger.triggerTargets.push(
				encoding.triggerTargetSubLevel(),
			);
			this.insert_selection_nodes([node]);
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
			this.modify_selectable_nodes((node) => {
				node.isLocked = false;
			});
		},
		lock_all() {
			this.modify_selectable_nodes((node) => {
				node.isLocked = true;
			});
		},
		pixelate_effect() {
			this.set_selectable_nodes((nodes) => {
				if (!nodes?.length) return;

				const node = group.groupNodes([...nodes]);
				nodes.length = 0;
				nodes.push(node);

				node.levelNodeGroup.position = {
					x: 900000,
					y: 900000,
					z: 900000,
				};
				const animation = encoding.animation();
				animation.frames.push(encoding.frame());
				animation.frames[0].position = {
					x: -900000,
					y: -900000,
					z: -900000,
				};
				node.animations.push(animation);
			});
		},
		open_material_convert_menu() {
			const materials = Object.values(encoding.materials()).filter(
				(m) => m !== encoding.materials().TRIGGER,
			);
			this.$emit(
				'popup',
				[
					{
						type: 'option',
						options: ['from', ...materials],
					},
					{
						type: 'option',
						options: ['to', ...materials],
					},
				],
				async (from, to) => {
					if (from === 'from' || to === 'to') {
						window.toast('Nothing selected', 'error');
						return;
					}

					from = parseInt(from);
					to = parseInt(to);

					this.modify_selectable_nodes((node) => {
						const data = encoding.node_data(node);
						if (
							node.levelNodeStatic &&
							(data.material ?? 0) === from
						)
							data.material = to;
					});
				},
			);
		},
		open_shape_convert_menu() {
			this.$emit(
				'popup',
				[
					{
						type: 'option',
						options: [
							'from',
							...Object.values(encoding.shapes()).slice(
								encoding.shapes().__END_OF_SPECIAL_PARTS__ + 1,
							),
						],
					},
					{
						type: 'option',
						options: [
							'to',
							...Object.values(encoding.shapes()).slice(
								encoding.shapes().__END_OF_SPECIAL_PARTS__ + 1,
							),
						],
					},
				],
				async (from, to) => {
					if (from === 'from' || to === 'to') {
						window.toast('Nothing selected', 'error');
						return;
					}

					from = parseInt(from);
					to = parseInt(to);

					this.modify_selectable_nodes((node) => {
						const data = encoding.node_data(node);
						if (data.shape === from) data.shape = to;
					});
				},
			);
		},
		toggle_vim_mode() {
			this.set_vim(!this.vim_enabled);
		},
		set_fly_speed() {
			this.$emit('viewport', (scope) => {
				if (!scope.controls.movementSpeed) {
					window.toast('Must be using free move controls', 'warning');
					return;
				}
				this.$emit(
					'popup',
					[
						{
							type: 'range',
							min: 1,
							value: scope.controls.movementSpeed,
							max: 100,
						},
					],
					async (value) => {
						this.$emit('viewport', (scope) => {
							scope.controls.movementSpeed = value;
						});
					},
				);
			});
		},
		make_gun() {
			this.set_selectable_nodes(async (nodes) => {
				await gun.makeGun(nodes);
			});
		},
		make_car() {
			this.set_selectable_nodes(async (nodes) => {
				await car.makeCar(nodes);
			});
		},
		group_level() {
			this.set_selectable_nodes((nodes) => {
				const node = group.groupNodes([...nodes]);
				nodes.length = 0;
				nodes.push(node);
			});
		},
		ungroup_all() {
			this.set_selectable_nodes((nodes) => {
				group.recursiveUngroup(nodes);
			});
		},
		duplicate_level() {
			this.set_selectable_nodes((nodes) => {
				nodes.push(...encoding.deepClone(nodes));
			});
		},
		monochrome_level() {
			this.set_selectable_nodes((nodes) => {
				monochrome.monochrome(nodes);
			});
		},
		randomize_materials() {
			this.modify_selectable_nodes((node) => {
				if (node.levelNodeStatic) {
					node.levelNodeStatic.material = encoding.random_material();
				}
			});
		},
		randomize_shapes() {
			this.modify_selectable_nodes((node) => {
				const data = encoding.node_data(node);
				if (data.shape) {
					data.shape = encoding.random_shape();
				}
			});
		},
		randomize_positions() {
			this.modify_selectable_nodes((node) => {
				const data = encoding.node_data(node);
				data.position.x = Math.random() - 0.5 + (data.position?.x ?? 0);
				data.position.y = Math.random() - 0.5 + (data.position?.y ?? 0);
				data.position.z = Math.random() - 0.5 + (data.position?.z ?? 0);
			});
		},
		randomize_rotations() {
			this.modify_selectable_nodes((node) => {
				const data = encoding.node_data(node);
				if (data.rotation) {
					const quat = new THREE.Quaternion(
						Math.random(),
						Math.random(),
						Math.random(),
						Math.random(),
					);
					quat.normalize();
					data.rotation.x = quat.x;
					data.rotation.y = quat.y;
					data.rotation.z = quat.z;
					data.rotation.w = quat.w;
				}
			});
		},
		randomize_scales() {
			this.modify_selectable_nodes((node) => {
				const data = encoding.node_data(node);
				if (data.scale && typeof data.scale === 'object') {
					data.scale.x = Math.random() - 0.5 + (data.scale?.x ?? 0);
					data.scale.y = Math.random() - 0.5 + (data.scale?.y ?? 0);
					data.scale.z = Math.random() - 0.5 + (data.scale?.z ?? 0);
				}
				if (data.scale && typeof data.scale === 'number') {
					data.scale = Math.random() - 0.5 + data.scale;
				}
				if (data.radius) {
					data.radius = Math.random() - 0.5 + data.radius;
				}
			});
		},
		randomize_colors() {
			this.modify_selectable_nodes((node) => {
				const data = encoding.node_data(node);
				if (data.color1) {
					data.color1.r = Math.random();
					data.color1.g = Math.random();
					data.color1.b = Math.random();
				}
				if (data.color2) {
					data.color2.r = Math.random();
					data.color2.g = Math.random();
					data.color2.b = Math.random();
				}
			});
		},
		modify_selectable_nodes(func) {
			this.$emit('viewport', (scope) => {
				this.$emit('modifier', (json) => {
					const node_list =
						scope.editing_parent.userData?.node?.levelNodeGroup
							?.childNodes ?? (json.levelNodes ??= []);
					node_list.forEach((node) => {
						encoding.traverse_node(node, func);
					});
					return json;
				});
			});
		},
		set_selectable_nodes(func) {
			this.$emit('viewport', (scope) => {
				this.$emit('modifier', async (json) => {
					const node_list =
						scope.editing_parent.userData?.node?.levelNodeGroup
							?.childNodes ?? (json.levelNodes ??= []);
					await func(node_list);
					console.log(json);
					return json;
				});
			});
		},
		ambience_min() {
			this.$emit('modifier', (json) => {
				json.ambienceSettings = encoding.ambienceSettings({});
				return json;
			});
		},
		ambience_max() {
			this.$emit('modifier', (json) => {
				json.ambienceSettings = encoding.ambienceSettings(
					{ r: 1, g: 1, b: 1 },
					{ r: 1, g: 1, b: 1 },
					360,
					360,
					100,
					1,
				);
				return json;
			});
		},
		ambience_random() {
			const random_float = () => {
				return 2000 * Math.random() - 1000;
			};
			this.$emit('modifier', (json) => {
				json.ambienceSettings = encoding.ambienceSettings(
					{
						r: random_float(),
						g: random_float(),
						b: random_float(),
					},
					{
						r: random_float(),
						g: random_float(),
						b: random_float(),
					},
					random_float(),
					random_float(),
					random_float(),
					random_float(),
				);
				return json;
			});
		},
		ambience_default() {
			this.$emit('modifier', (json) => {
				json.ambienceSettings = encoding.ambienceSettings();
				return json;
			});
		},
		toggle_huge_far() {
			this.$emit('viewport', (scope) => {
				scope.huge_far = !scope.huge_far;
				scope.camera.far = scope.huge_far ? 4000000 : 10000;
				scope.camera.updateProjectionMatrix();
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
		toggle_trigger_connections() {
			this.$emit('viewport', (scope) => {
				scope.toggle_trigger_connections();
			});
		},
		toggle_gasm_connections() {
			this.$emit('viewport', (scope) => {
				scope.toggle_gasm_connections();
			});
		},
		toggle_groups() {
			this.$emit('viewport', (scope) => {
				scope.toggle_groups();
			});
		},
		toggle_animations() {
			this.$emit('viewport', (scope) => {
				scope.toggle_animations();
			});
		},
		toggle_shadows() {
			this.$emit('viewport', (scope) => {
				scope.toggle_shadows();
			});
		},
		save_config() {
			this.$emit('viewport', (scope) => {
				scope.save_config();
			});
		},
		copy_camera_state() {
			this.$emit('viewport', (scope) => {
				scope.copy_camera_state();
			});
		},
		clear_storage() {
			const configStore = useConfigStore();
			configStore.$reset();
		},
		show_keybinds() {
			this.$emit('viewport', (scope) => {
				scope.show_keybinds = true;
			});
		},
		toggle_key_hints() {
			this.$emit('viewport', (scope) => {
				scope.show_key_hints = !scope.show_key_hints;
			});
		},
		edit_protobuf() {
			this.$emit('scope', (scope) => {
				scope.open_protobuf();
			});
		},
		...mapActions(useConfigStore, ['set_vim']),
	},
	computed: {
		...mapState(useConfigStore, ['vim_enabled']),
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
							:id="'menu-' + category + button"
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
										!data.file && data.func && data.func();
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
									:id="
										'menu-' + category + button + sub_button
									"
								>
									<a
										class="menu-btn"
										v-if="sub_data.href"
										:href="sub_data.href"
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
													sub_data.func &&
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
				<div class="credits">
					<span>GRAB Tools</span
					><span>by <a href="https://twhlynch.me">twhlynch</a></span>
				</div>
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

.credits {
	margin-left: auto;
	display: flex;
	flex-direction: column;
	font-size: 0.8rem;

	a {
		color: #5b5f84;
	}
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
