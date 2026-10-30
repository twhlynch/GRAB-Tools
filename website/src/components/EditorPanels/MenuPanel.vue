<script lang="ts">
import { recursiveUngroup } from '@/common/group';
import {
	ambienceSettings,
	createLevel,
	decodeLevel,
	downloadJSON,
	downloadLevel,
	encodeLevel,
} from '@/common/levels';
import {
	deepClone,
	json_parse,
	materials,
	random_ambience,
	random_material,
	random_shape,
	shapes,
	traverse_node,
} from '@/common/utils';
import { FreeControls } from '@/editor/FreeControls';
import { material_menu, shape_menu, type_menu } from '@/editor/menuUtils';
import EditorPage from '@/pages/EditorPage.vue';
import { useConfigStore } from '@/stores/config';
import audio from '@/tools/audio';
import BrushTool from '@/tools/brush';
import car from '@/tools/car';
import gun from '@/tools/gun';
import { generate_pixel_art } from '@/tools/image';
import midi from '@/tools/midi';
import { monochrome } from '@/tools/monochrome';
import { obj } from '@/tools/obj';
import signs from '@/tools/signs';
import svg from '@/tools/svg';
import video from '@/tools/video';
import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import { animation, animationFrame } from '@grab-tools/lib/generated/helpers';
import {
	isLevelNodeStatic,
	levelNodeData,
	levelNodeHasKey,
	LevelNodeKey,
	levelNodeWithCrumbling,
	levelNodeWithFinish,
	levelNodeWithGASM,
	levelNodeWithGravity,
	levelNodeWithLight,
	levelNodeWithParticleEmitter,
	levelNodeWithSign,
	levelNodeWithSound,
	levelNodeWithStart,
	levelNodeWithStatic,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithAmbience,
	triggerTargetWithAnimation,
	triggerTargetWithLight,
	triggerTargetWithSound,
	triggerTargetWithSubLevel,
} from '@grab-tools/lib/generated/nodes';
import {
	Level,
	LevelNode,
	LevelNodeMaterial,
	LevelNodeShape,
} from '@grab-tools/lib/generated/proto';
import { mapActions, mapState } from 'pinia';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { defineComponent } from 'vue';
import DropDown from './DropDown.vue';
import { Input, InputResults } from './inputs';
import { Menu } from './menu';
import ViewportPanel from './ViewportPanel.vue';

export default defineComponent({
	components: {
		DropDown,
	},
	emits: {
		modifier: (_: (level: Level) => Level | Promise<Level>) => true,
		function: (_: (level: Level) => void | Promise<void>) => true,
		viewport: (_: (_: never) => void) => true,
		popup: <const Options extends readonly Input[]>(
			_inputs: Options,
			_func: (...data: InputResults<Options>) => void | Promise<void>,
		) => true,
		scope: (_: (_: never) => void) => true,
	},
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
						Default: { func: this.load_default_level },
						Template: { func: this.open_templates },
						'My Levels': { func: this.open_my_levels },
						'Cheat Sheet': { func: this.open_cheat_sheet },
					},
					Save: {
						Level: { func: this.save_level },
						JSON: { func: this.save_json },
						glTF: { func: this.save_gltf },
						'Set Default': { func: this.set_default_level },
					},
				} as unknown as Menu,
				Insert: {
					Level: {
						Level: { func: this.insert_level, file: true },
						JSON: { func: this.insert_json, file: true },
						Nodes: { func: this.insert_nodes, file: true },
						Diff: { func: this.diff_level, file: true },
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
						Trigger: {
							Default: { func: this.insert_trigger },
							Ambience: { func: this.insert_ambience_trigger },
							Animation: { func: this.insert_animation_trigger },
							Sound: { func: this.insert_sound_trigger },
							Light: { func: this.insert_light_trigger },
							Sublevel: { func: this.insert_sublevel_trigger },
						},
						Sound: { func: this.insert_sound },
						Light: { func: this.insert_light },
						Code: { func: this.insert_gasm },
						'Colored Lava': { func: this.insert_colored_lava },
					},
					Media: {
						Image: { func: this.insert_image },
						Video: { func: this.insert_video },
						Model: { func: this.insert_model },
						Text: { func: this.insert_text },
						SVG: { func: this.insert_svg },
						MIDI: { func: this.insert_midi },
						// 'Audio (SFX2GL)': { func: this.insert_audio },
					},
				} as unknown as Menu,
				Edit: {
					Tools: {
						Brush: { func: this.activate_brush },
					},
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
						'Modded Sliders': {
							func: () => this.ambience_sliders?.(true),
						},
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
					// Programs: {
					// 	'Make Gun (unfinished)': { func: this.make_gun },
					// 	'Make Car (unfinished)': { func: this.make_car },
					// },
				} as unknown as Menu,
				Select: {
					All: { func: this.select_all },
					Shape: shape_menu(this.select_by_shape as (shape: LevelNodeShape) => void),
					Material: material_menu(
						this.select_by_material as (material: LevelNodeMaterial) => void,
					),
					Type: type_menu(this.select_by_type as (type: LevelNodeKey) => void, [
						'levelNodeLobbyTerminal',
					]),
					Color: { func: this.select_by_color },
				} as unknown as Menu,
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
						Light: { func: this.toggle_light },
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
				} as unknown as Menu,
				Settings: {
					Login: {
						href: `https://auth.oculus.com/sso/?organization_id=264907536624075&redirect_uri=${this.$config.PAGE_URL}editor`,
					},
					'Save Config': { func: this.save_config },
					'Edit Protobuf': { func: this.edit_protobuf },
					Controls: {
						'Fly Speed': { func: this.set_fly_speed },
						'Vim Mode': { func: this.toggle_vim_mode },
					},
					Experimental: {
						'Toggle Shadows': { func: this.toggle_shadows },
					},
				} as unknown as Menu,
				Help: {
					Tutorial: { href: 'https://youtube.com/@dotindex' },
					Discord: { href: this.$config.DISCORD_URL },
					'Clear Storage': { func: this.clear_storage },
					'Show Keybinds': { func: this.show_keybinds },
					Credit: {
						Slin: { href: 'https://slin.dev' },
						EBSpark: { href: 'https://ebspark.github.io' },
						TheTrueFax: { href: 'https://thetruefax.github.io' },
						Vestria: { href: 'https://github.com/vestriaaa' },
						MerelyMiserable: { href: 'https://merely.is-a.dev' },
					},
					[`v${this.$config.VERSION}`]: {
						href: this.$config.REPO_URL,
					},
				} as unknown as Menu,
			} satisfies Record<string, Menu>,
		};
	},
	computed: {
		...mapState(useConfigStore, ['vim_enabled']),
	},
	mounted() {
		const buttons = document.querySelectorAll<HTMLButtonElement>('.menu-btn');
		buttons.forEach((button) => {
			const file_input = button.querySelector<HTMLInputElement>('input[type="file"]');
			if (file_input) {
				button.onclick = () => {
					file_input.click();
				};
			}
		});
	},
	methods: {
		scope(func: (scope: InstanceType<typeof EditorPage>) => void) {
			this.$emit('scope', func);
		},
		viewport(func: (scope: InstanceType<typeof ViewportPanel>) => void | Promise<void>) {
			this.$emit('viewport', func);
		},
		modifier(func: (level: Level) => Level | Promise<Level>) {
			this.$emit('modifier', func);
		},
		function(func: (level: Level) => void | Promise<void>) {
			this.$emit('function', func);
		},
		popup<const Options extends readonly Input[]>(
			inputs: Options,
			func: (...data: InputResults<Options>) => void | Promise<void>,
		) {
			// @ts-expect-error emit doesnt work with generics
			this.$emit('popup', inputs, func);
		},
		select_by_material(material: LevelNodeMaterial) {
			this.viewport((scope) => {
				scope.select_by_material(material);
			});
		},
		select_by_shape(shape: LevelNodeShape) {
			this.viewport((scope) => {
				scope.select_by_shape(shape);
			});
		},
		select_by_type(type: LevelNodeKey) {
			this.viewport((scope) => {
				scope.select_by_type(type);
			});
		},
		select_by_color() {
			this.viewport((scope) => {
				scope.select_by_color();
			});
		},
		mirror_x() {
			this.viewport((scope) => {
				scope.mirror_x();
			});
		},
		mirror_y() {
			this.viewport((scope) => {
				scope.mirror_y();
			});
		},
		mirror_z() {
			this.viewport((scope) => {
				scope.mirror_z();
			});
		},
		select_all() {
			this.viewport((scope) => {
				scope.select_all();
			});
		},
		load_new_level() {
			this.modifier((_) => {
				return createLevel();
			});
		},
		async open_level_file(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = await decodeLevel(file);
			if (!json) return;

			this.modifier((_) => {
				return json;
			});
		},
		async open_json_file(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = json_parse(await file.text());
			if (!json) return;

			this.modifier((_) => {
				return json;
			});
		},
		save_level() {
			this.function((json) => {
				const level = encodeLevel(json);
				if (!level) {
					window.toast('Invalid level data', 'error');
					return;
				}
				downloadLevel(level);
			});
		},
		save_json() {
			this.function((json) => {
				downloadJSON(json);
			});
		},
		set_default_level() {
			this.function((json) => {
				const configStore = useConfigStore();
				configStore.default_level = deepClone(json);
			});
		},
		load_default_level() {
			this.modifier((_) => {
				const configStore = useConfigStore();
				return configStore.default_level
					? deepClone(configStore.default_level)
					: createLevel();
			});
		},
		open_templates() {
			this.scope((scope) => {
				scope
					.refs()
					.left_panel.size(
						Math.min(
							350,
							scope.refs().left_panel.$el.getBoundingClientRect().width / 2,
						),
					);
			});
		},
		open_my_levels() {
			this.scope((scope) => {
				scope.open_my_levels();
			});
		},
		open_cheat_sheet() {
			this.modifier((_) => {
				const modded_shapes = [
					null,
					...Object.values(shapes()),
					shapes().__END_OF_SPECIAL_PARTS__ + 1,
					shapes().__END_OF_SPECIAL_PARTS__ + 2,
					shapes().__END_OF_SPECIAL_PARTS__ + 3,
				];
				const modded_materials = [
					null,
					...Object.values(materials()),
					...Array.from(
						{
							length: Object.values(materials()).length * 2 - 1 - 1,
						},
						(__, i) => i - Object.values(materials()).length + 1 + 1,
					),
				];

				const nodes = [];

				for (const [i, shape] of modded_shapes.entries()) {
					for (const [j, material] of modded_materials.entries()) {
						const node = levelNodeWithStatic();
						const data = node.levelNodeStatic;
						data.shape = shape as LevelNodeShape;
						data.material = material as LevelNodeMaterial;
						data.position = { x: Number(i), z: Number(j) };
						data.color1 = { r: 1, g: 1, b: 1 };
						data.color2 = { r: 1, g: 1, b: 1 };
						data.isNeon = true;
						data.isTransparent = true;
						nodes.push(node);
					}
				}
				const level = createLevel(
					nodes,
					'The Cheat Sheet',
					`All possible types for v${this.$config.FORMAT_VERSION} All objects are neon and transparent`,
					'.index',
				);

				return level;
			});
		},
		save_gltf() {
			this.viewport((scope) => {
				const exporter = new GLTFExporter();
				exporter.parse(
					scope.scene,
					(gltf) => {
						const blob = new Blob([JSON.stringify(gltf)], {
							type: 'text/json',
						});
						const link = document.createElement('a');
						link.href = window.URL.createObjectURL(blob);
						link.download = Date.now().toString().slice(0, -3) + '.gltf';
						link.click();
					},
					(err) => {
						const error = new Error('Failed glTF export: ' + err.message, {
							cause: err,
						});
						window.toast(error, 'error');
					},
					{},
				);
			});
		},
		async insert_level(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = await decodeLevel(file);
			this.insert_selection_nodes(json?.levelNodes ?? []);
		},
		async diff_level(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = await decodeLevel(file);
			if (!json) return;

			this.modifier((level) => {
				const a_nodes = (level.levelNodes ??= []);
				const b_nodes = (json.levelNodes ??= []);

				const changes = [];

				for (const b of b_nodes) {
					if (a_nodes.find((a) => JSON.stringify(a) === JSON.stringify(b))) {
						continue;
					}
					changes.push(b);
				}

				level.levelNodes = changes;
				return level;
			});
		},
		async insert_json(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = json_parse<Level>(await file.text());
			this.insert_selection_nodes(json?.levelNodes ?? []);
		},
		insert_selection_nodes(nodes: LevelNode[]) {
			this.viewport((scope) => {
				this.modifier((json) => {
					const node_list = scope.get_editing_nodes(json);
					node_list.push(...nodes);
					return json;
				});
			});
		},
		activate_brush() {
			this.viewport((scope) => {
				scope.activate_tool(new BrushTool());
			});
		},
		async insert_nodes(e: Event) {
			const files = Array.from((e.target as HTMLInputElement).files ?? []);
			if (!files.length) return;

			const file = files[0]!;
			const json = json_parse<Level | LevelNode[]>(await file.text());
			this.insert_selection_nodes(Array.isArray(json) ? json : (json?.levelNodes ?? []));
		},
		insert_midi() {
			this.popup(
				[
					{
						type: 'file',
						accept: '.mid,.midi',
					},
					{
						type: 'option',
						options: [
							'Auto Instrument',
							'Sine (Classic)',
							'Saw (Classic)',
							'Square (Classic)',
						],
					},
					{
						type: 'checkbox',
						text: 'Start active: ',
						default: true,
					},
					{
						type: 'checkbox',
						text: 'Loop: ',
						default: true,
					},
					{
						type: 'number',
						text: 'Volume (0-100, default 30)',
					},
					{
						type: 'number',
						text: 'Speed multiplier (default 1)',
					},
				],
				(
					files: File[],
					instrument: string,
					start_active: boolean,
					loop: boolean,
					volume: string,
					speedIndex: string,
				) => {
					if (!files.length) {
						window.toast('No midi file chosen', 'error');
						return;
					}

					const parsedVolume = (parseInt(volume) || 30) / 100;
					const parsedSpeedIndex = 1 / (parseFloat(speedIndex) || 1);

					const file = files[0]!;

					this.viewport(async (scope) => {
						const max_id = scope.level.nodes.all.length;

						const nodes = await midi.midi(
							file,
							max_id,
							instrument,
							start_active,
							loop,
							parsedVolume,
							parsedSpeedIndex,
						);
						if (!nodes) return;

						this.insert_selection_nodes(nodes);
					});
				},
			);
		},
		insert_audio() {
			this.popup(
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

					const parsedSamples = parseInt(samples) || 40;

					const file = files[0]!;

					const node = await audio.audio(file, parsedSamples);
					if (!node) return;

					this.insert_selection_nodes([node]);
				},
			);
		},
		insert_image() {
			this.popup(
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
						type: 'checkbox',
						text: 'Optimise',
						default: true,
					},
					{
						type: 'file',
						accept: 'image/*',
					},
				],
				async (width, height, mode, shape, greedy, files) => {
					if (!files.length) {
						window.toast('No image file chosen', 'error');
						return;
					}

					const file = files[0]!;
					const parsedWidth = parseInt(width) || 50;
					const parsedHeight = parseInt(height) || 50;

					const node = await generate_pixel_art(
						file,
						parsedWidth,
						parsedHeight,
						mode,
						shape,
						greedy,
					);

					this.insert_selection_nodes([node]);
				},
			);
		},
		insert_video() {
			this.popup(
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
						type: 'option',
						options: ['animations', 'code'],
					},
					{
						type: 'file',
						accept: '.mp4',
					},
				],
				async (width, height, mode, files) => {
					if (!files.length) {
						window.toast('No video file chosen', 'error');
						return;
					}

					const file = files[0]!;
					const parsedWidth = parseInt(width) || 40;
					const parsedHeight = parseInt(height) || 30;

					const { remove, message } = window.toast(
						'Video progress: 0%',
						'message',
						true,
					)!;
					const nodes = await video.video(
						file,
						parsedWidth,
						parsedHeight,
						mode,
						(progress) => {
							message.value = `Video progress: ${Math.ceil(progress)}%`;
						},
					);
					remove();

					if (nodes) this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_model() {
			this.popup(
				[
					{
						type: 'option',
						options: ['triangles', 'particles', 'spheres'],
					},
					{
						type: 'file',
						accept: '.obj,.mtl',
						multiple: true,
					},
				],
				async (mode, files) => {
					if (!files.length) {
						window.toast('No file chosen', 'error');
						return;
					}

					const objFile = files.find((f) => f.name.endsWith('.obj'));
					const mtlFile = files.find((f) => f.name.endsWith('.mtl'));
					if (!objFile) {
						window.toast('No .obj file selected', 'error');
						return;
					}

					const nodes = await obj(objFile, mode, mtlFile);

					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_text() {
			this.popup(
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
				(text, mode) => {
					const nodes = signs.signs(text, mode === 'animated');
					this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_svg() {
			this.popup(
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

					const file = files[0]!;
					const parsedDetail = parseInt(detail) || 600;

					const nodes = await svg.svg(file, parsedDetail);
					if (nodes) this.insert_selection_nodes(nodes);
				},
			);
		},
		insert_static() {
			const node = levelNodeWithStatic();
			delete node.levelNodeStatic.color1;
			delete node.levelNodeStatic.color2;
			this.insert_selection_nodes([node]);
		},
		insert_crumbling() {
			const node = levelNodeWithCrumbling();
			this.insert_selection_nodes([node]);
		},
		insert_animated() {
			const node = levelNodeWithStatic();
			const anim = animation({
				frames: [animationFrame(), animationFrame({ time: 1, position: { y: 1 } })],
			});
			(node.animations ??= []).push(anim);
			this.insert_selection_nodes([node]);
		},
		insert_colored() {
			const node = levelNodeWithStatic();
			node.levelNodeStatic.material = 8;
			this.insert_selection_nodes([node]);
		},
		insert_sign() {
			this.insert_selection_nodes([levelNodeWithSign()]);
		},
		insert_start() {
			this.insert_selection_nodes([levelNodeWithStart()]);
		},
		insert_finish() {
			this.insert_selection_nodes([levelNodeWithFinish()]);
		},
		insert_gravity() {
			this.insert_selection_nodes([levelNodeWithGravity()]);
		},
		insert_particle() {
			this.insert_selection_nodes([levelNodeWithParticleEmitter()]);
		},
		insert_trigger() {
			this.insert_selection_nodes([levelNodeWithTrigger()]);
		},
		insert_sound() {
			this.insert_selection_nodes([levelNodeWithSound()]);
		},
		insert_light() {
			this.insert_selection_nodes([levelNodeWithLight()]);
		},
		insert_gasm() {
			this.insert_selection_nodes([levelNodeWithGASM()]);
		},
		insert_colored_lava() {
			const node = levelNodeWithStatic({
				material: 3,
				color1: { r: 1 },
				color2: { b: 1 },
			});
			this.insert_selection_nodes([node]);
		},
		insert_ambience_trigger() {
			this.insert_selection_nodes([
				levelNodeWithTrigger({
					triggerSources: [triggerSourceWithBasic()],
					triggerTargets: [triggerTargetWithAmbience()],
				}),
			]);
		},
		insert_animation_trigger() {
			this.insert_selection_nodes([
				levelNodeWithTrigger({
					triggerSources: [triggerSourceWithBasic()],
					triggerTargets: [triggerTargetWithAnimation()],
				}),
			]);
		},
		insert_sound_trigger() {
			this.insert_selection_nodes([
				levelNodeWithTrigger({
					triggerSources: [triggerSourceWithBasic()],
					triggerTargets: [triggerTargetWithSound()],
				}),
			]);
		},
		insert_light_trigger() {
			this.insert_selection_nodes([
				levelNodeWithTrigger({
					triggerSources: [triggerSourceWithBasic()],
					triggerTargets: [triggerTargetWithLight()],
				}),
			]);
		},
		insert_sublevel_trigger() {
			this.insert_selection_nodes([
				levelNodeWithTrigger({
					triggerSources: [triggerSourceWithBasic()],
					triggerTargets: [triggerTargetWithSubLevel()],
				}),
			]);
		},
		teleport_start() {
			this.viewport((scope) => {
				scope.teleport_start();
			});
		},
		teleport_finish() {
			this.viewport((scope) => {
				scope.teleport_finish();
			});
		},
		teleport_origin() {
			this.viewport((scope) => {
				scope.teleport_origin();
			});
		},
		teleport_full() {
			this.viewport((scope) => {
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
				if (!nodes.length) return;

				const node = levelNodeGroupFrom({ childNodes: [...nodes] });
				nodes.length = 0;
				nodes.push(node);

				node.levelNodeGroup.position = {
					x: 900000,
					y: 900000,
					z: 900000,
				};
				const anim = animation({
					frames: [
						animationFrame({
							position: { x: -900000, y: -900000, z: -900000 },
						}),
					],
				});
				(node.animations ??= []).push(anim);
			});
		},
		open_material_convert_menu() {
			const convertable_materials = Object.values(materials())
				.filter((m) => m !== materials().TRIGGER)
				.map(String);
			this.popup(
				[
					{
						type: 'option',
						options: ['from', ...convertable_materials],
					},
					{
						type: 'option',
						options: ['to', ...convertable_materials],
					},
				],
				(from, to) => {
					if (from === 'from' || to === 'to') {
						window.toast('Nothing selected', 'error');
						return;
					}

					const parsedFrom = parseInt(from);
					const parsedTo = parseInt(to);

					this.modify_selectable_nodes((node) => {
						if (!isLevelNodeStatic(node)) return;
						const data = levelNodeData(node);
						if ((data.material ?? 0) === parsedFrom) data.material = parsedTo;
					});
				},
			);
		},
		open_shape_convert_menu() {
			this.popup(
				[
					{
						type: 'option',
						options: [
							'from',
							...Object.values(shapes())
								.slice(shapes().__END_OF_SPECIAL_PARTS__ + 1)
								.map(String),
						],
					},
					{
						type: 'option',
						options: [
							'to',
							...Object.values(shapes())
								.slice(shapes().__END_OF_SPECIAL_PARTS__ + 1)
								.map(String),
						],
					},
				],
				(from, to) => {
					if (from === 'from' || to === 'to') {
						window.toast('Nothing selected', 'error');
						return;
					}

					const parsedFrom = parseInt(from);
					const parsedTo = parseInt(to);

					this.modify_selectable_nodes((node) => {
						const data = levelNodeData(node);
						if ('shape' in data && data.shape === parsedFrom) data.shape = parsedTo;
					});
				},
			);
		},
		toggle_vim_mode() {
			this.set_vim(!this.vim_enabled);
		},
		set_fly_speed() {
			this.viewport((scope) => {
				const controls = scope.controls;
				if (!(controls instanceof FreeControls)) {
					window.toast('Must be using free move controls', 'warning');
					return;
				}
				this.popup(
					[
						{
							type: 'range',
							min: 1,
							value: controls.movementSpeed,
							max: 100,
						},
					],
					(value) => {
						controls.movementSpeed = value;
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
				const node = levelNodeGroupFrom({ childNodes: [...nodes] });
				nodes.length = 0;
				nodes.push(node);
			});
		},
		ungroup_all() {
			this.set_selectable_nodes((nodes) => {
				recursiveUngroup(nodes);
			});
		},
		duplicate_level() {
			this.set_selectable_nodes((nodes) => {
				nodes.push(...deepClone(nodes));
			});
		},
		monochrome_level() {
			this.set_selectable_nodes((nodes) => {
				monochrome(nodes);
			});
		},
		randomize_materials() {
			this.modify_selectable_nodes((node) => {
				if (node.levelNodeStatic) {
					node.levelNodeStatic.material = random_material();
				}
			});
		},
		randomize_shapes() {
			this.modify_selectable_nodes((node) => {
				if (levelNodeHasKey(node, 'shape')) {
					const data = levelNodeData(node);
					data.shape = random_shape();
				}
			});
		},
		randomize_positions() {
			this.modify_selectable_nodes((node) => {
				const data = levelNodeData(node);
				data.position ??= {};
				data.position.x = Math.random() - 0.5 + (data.position.x ?? 0);
				data.position.y = Math.random() - 0.5 + (data.position.y ?? 0);
				data.position.z = Math.random() - 0.5 + (data.position.z ?? 0);
			});
		},
		randomize_rotations() {
			this.modify_selectable_nodes((node) => {
				if (levelNodeHasKey(node, 'rotation')) {
					const data = levelNodeData(node);
					const quat = new THREE.Quaternion(
						Math.random(),
						Math.random(),
						Math.random(),
						Math.random(),
					);
					quat.normalize();
					data.rotation ??= {};
					data.rotation.x = quat.x;
					data.rotation.y = quat.y;
					data.rotation.z = quat.z;
					data.rotation.w = quat.w;
				}
			});
		},
		randomize_scales() {
			this.modify_selectable_nodes((node) => {
				if (levelNodeHasKey(node, 'scale')) {
					const data = levelNodeData(node);
					if (typeof data.scale === 'object') {
						data.scale.x = Math.random() - 0.5 + (data.scale.x ?? 0);
						data.scale.y = Math.random() - 0.5 + (data.scale.y ?? 0);
						data.scale.z = Math.random() - 0.5 + (data.scale.z ?? 0);
					}
					if (typeof data.scale === 'number') {
						data.scale = Math.random() - 0.5 + data.scale;
					}
				}

				if (levelNodeHasKey(node, 'radius')) {
					const data = levelNodeData(node);
					data.radius = Math.random() - 0.5 + (data.radius ?? 0);
				}
			});
		},
		randomize_colors() {
			this.modify_selectable_nodes((node) => {
				if (!isLevelNodeStatic(node)) return;
				const data = levelNodeData(node);
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
		modify_selectable_nodes(func: (node: LevelNode) => void) {
			this.viewport((scope) => {
				this.modifier((json) => {
					const node_list = scope.get_editing_nodes(json);
					node_list.forEach((node) => {
						traverse_node(node, func);
					});
					return json;
				});
			});
		},
		set_selectable_nodes(func: (nodes: LevelNode[]) => void | Promise<void>) {
			this.viewport((scope) => {
				this.modifier(async (json) => {
					const node_list = scope.get_editing_nodes(json);
					await func(node_list);
					console.log(json);
					return json;
				});
			});
		},
		ambience_min() {
			this.modifier((json) => {
				json.ambienceSettings = ambienceSettings({});
				return json;
			});
		},
		ambience_max() {
			this.modifier((json) => {
				json.ambienceSettings = ambienceSettings(
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
			this.modifier((json) => {
				json.ambienceSettings = random_ambience();
				return json;
			});
		},
		ambience_default() {
			this.modifier((json) => {
				json.ambienceSettings = ambienceSettings();
				return json;
			});
		},
		ambience_sliders(modded = false) {
			this.modifier(async (json) => {
				const m_range = (name: string, min: number, max: number, value: number) => ({
					label: name,
					type: 'range',
					min: modded ? -1e10 : min,
					max: modded ? 1e10 : max,
					value: value,
					step: 0.001,
				});

				const amb = json.ambienceSettings ?? {};
				const hor = amb.skyHorizonColor ?? {};
				const zen = amb.skyZenithColor ?? {};

				return await new Promise((resolve) => {
					this.popup(
						[
							m_range('Fog Density', 0, 1, amb.fogDensity ?? 0),
							m_range('Sun Size', 0, 1, amb.sunSize ?? 0),
							m_range('Sun Altitude', -90, 90, amb.sunAltitude ?? 0),
							m_range('Sun Azimuth', 0, 360, amb.sunAzimuth ?? 0),
							m_range('Sky Horizon R', 0, 1, hor.r ?? 0),
							m_range('Sky Horizon G', 0, 1, hor.g ?? 0),
							m_range('Sky Horizon B', 0, 1, hor.b ?? 0),
							m_range('Sky Zenith R', 0, 1, zen.r ?? 0),
							m_range('Sky Zenith G', 0, 1, zen.g ?? 0),
							m_range('Sky Zenith B', 0, 1, zen.b ?? 0),
						],
						(
							fogDensity,
							sunSize,
							sunAltitude,
							sunAzimuth,
							skyHorizonR,
							skyHorizonG,
							skyHorizonB,
							skyZenithR,
							skyZenithG,
							skyZenithB,
						) => {
							json.ambienceSettings = ambienceSettings(
								{
									r: Number(skyHorizonR),
									g: Number(skyHorizonG),
									b: Number(skyHorizonB),
								},
								{
									r: Number(skyZenithR),
									g: Number(skyZenithG),
									b: Number(skyZenithB),
								},
								Number(sunAltitude),
								Number(sunAzimuth),
								Number(sunSize),
								Number(fogDensity),
							);

							resolve(json);
						},
					);
				});
			});
		},
		toggle_huge_far() {
			this.viewport((scope) => {
				scope.huge_far = !scope.huge_far;
				scope.camera.far = (scope.huge_far as boolean) ? 4000000 : 10000;
				scope.camera.updateProjectionMatrix();
			});
		},
		toggle_triggers() {
			this.viewport((scope) => {
				scope.show_triggers = !scope.show_triggers;
				scope.level.nodes.levelNodeTrigger.forEach((node) => {
					node.visible = scope.show_triggers;
				});
			});
		},
		toggle_sound() {
			this.viewport((scope) => {
				scope.show_sound = !scope.show_sound;
				scope.level.nodes.levelNodeSound.forEach((node) => {
					node.visible = scope.show_sound;
				});
			});
		},
		toggle_light() {
			this.viewport((scope) => {
				scope.show_light = !scope.show_light;
				scope.level.nodes.levelNodeLight.forEach((node) => {
					node.visible = scope.show_light;
				});
			});
		},
		toggle_fog() {
			this.viewport((scope) => {
				scope.show_fog = !scope.show_fog;
				scope.level.nodes.all.forEach((node) => {
					if (node.material?.uniforms?.fogEnabled) {
						node.material.uniforms.fogEnabled.value = Number(scope.show_fog);
					}
				});
			});
		},
		toggle_sky() {
			this.viewport((scope) => {
				scope.toggle_sky();
			});
		},
		toggle_trigger_connections() {
			this.viewport((scope) => {
				scope.toggle_trigger_connections();
			});
		},
		toggle_gasm_connections() {
			this.viewport((scope) => {
				scope.toggle_gasm_connections();
			});
		},
		toggle_groups() {
			this.viewport((scope) => {
				scope.toggle_groups();
			});
		},
		toggle_animations() {
			this.viewport((scope) => {
				scope.toggle_animations();
			});
		},
		toggle_shadows() {
			this.viewport((scope) => {
				scope.toggle_shadows();
			});
		},
		save_config() {
			this.viewport((scope) => {
				scope.save_config();
			});
		},
		copy_camera_state() {
			this.viewport((scope) => {
				scope.copy_camera_state();
			});
		},
		clear_storage() {
			const configStore = useConfigStore();
			configStore.$reset();
		},
		show_keybinds() {
			this.viewport((scope) => {
				scope.show_keybinds = true;
			});
		},
		toggle_key_hints() {
			this.viewport((scope) => {
				scope.show_key_hints = !scope.show_key_hints;
			});
		},
		edit_protobuf() {
			this.scope((scope) => {
				scope.open_protobuf();
			});
		},
		...mapActions(useConfigStore, ['set_vim']),
	},
});
</script>

<template>
	<section>
		<nav class="menu">
			<ul class="menu-list">
				<li v-for="[name, item] of Object.entries(menu)" :key="name">
					<button class="menu-btn">{{ name }}</button>
					<DropDown :menu="item" class="dropdown" />
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
		text-decoration: none;
		cursor: pointer;
	}
}
.menu {
	box-sizing: border-box;
	height: 100%;
	background-color: #1e1e1e;
}
.menu-list {
	height: 100%;
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0 6px;
	margin: 0;
	list-style: none;
}
.menu-list > li {
	position: relative;
	display: flex;
	align-items: center;
}
.menu-btn {
	width: 100%;
	display: block;
	padding: 8px 16px;

	background-color: #1e1e1e;
	color: white;
	font-size: 0.8rem;
	text-align: left;

	border: none;

	cursor: pointer;
}
.menu-list > li > .menu-btn {
	background-color: #2e2e2e;
}
.dropdown {
	padding-top: 4px;
}
</style>
