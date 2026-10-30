<script lang="ts">
import { ungroupNode } from '@/common/group';
import { isLevelNodeObject, LevelNodeObject } from '@/common/levelNodes';
import {
	copy_object_id,
	deepClone,
	format_type,
	materials,
	object_contains,
	shapes,
} from '@/common/utils';
import {
	add_animation_paths,
	add_gasm_connection,
	add_gasm_connections,
	add_group_bounds,
	add_trigger_connection,
	add_trigger_connections,
	update_animation_paths_transforms,
	update_animation_paths_visibility,
	update_connection_positions,
	update_gasm_connections_visibility,
	update_group_bound_visibility,
	update_group_bounds_color,
	update_relevant_group_bounds,
	update_trigger_connections_visibility,
} from '@/common/visuals';
import AnimationPanel from '@/components/EditorPanels/AnimationPanel.vue';
import ContextMenu from '@/components/EditorPanels/ContextMenu.vue';
import GASMPanel from '@/components/EditorPanels/GASMPanel.vue';
import JsonPanel from '@/components/EditorPanels/JsonPanel.vue';
import KeyHint from '@/components/EditorPanels/KeyHint.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import { FreeControls } from '@/editor/FreeControls';
import GizmoControls, {
	TransformControlsEvent,
	TransformMode,
	TransformSpace,
} from '@/editor/GizmoControls';
import { levelData, LevelLoader } from '@/editor/LevelLoader';
import { Tool } from '@/editor/Tool';
import CursorIcon from '@/icons/CursorIcon.vue';
import KeyboardIcon from '@/icons/KeyboardIcon.vue';
import OneSidedScaleIcon from '@/icons/OneSidedScaleIcon.vue';
import RotateIcon from '@/icons/RotateIcon.vue';
import ScaleIcon from '@/icons/ScaleIcon.vue';
import SpaceIcon from '@/icons/SpaceIcon.vue';
import TranslateIcon from '@/icons/TranslateIcon.vue';
import EditorPage from '@/pages/EditorPage.vue';
import { useConfigStore } from '@/stores/config';
import { play_sound } from '@/tools/sfxr';
import { create_connection, PropertyType } from '@grab-tools/lib/common/connections';
import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import { animation } from '@grab-tools/lib/generated/helpers';
import {
	isLevelNodeCrumbling,
	isLevelNodeFinish,
	isLevelNodeGASM,
	isLevelNodeGroup,
	isLevelNodeLight,
	isLevelNodeSign,
	isLevelNodeSound,
	isLevelNodeStart,
	isLevelNodeStatic,
	isLevelNodeTrigger,
	levelNodeData,
	LevelNodeKey,
	levelNodeMetadata,
	LevelNodeWith,
	triggerSourceWithBasic,
	triggerSourceWithBlockNames,
	triggerTargetWithAmbience,
	triggerTargetWithAnimation,
	triggerTargetWithLight,
	triggerTargetWithSound,
	triggerTargetWithSubLevel,
} from '@grab-tools/lib/generated/nodes';
import {
	Level,
	LevelNode,
	LevelNodeCrumbling,
	LevelNodeGASM,
	LevelNodeGroup,
	LevelNodeMaterial,
	LevelNodeShape,
	LevelNodeSound,
	LevelNodeStatic,
	LevelNodeTrigger,
} from '@grab-tools/lib/generated/proto';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { defineComponent, markRaw, Raw } from 'vue';
import type { Menu } from './menu';

export default defineComponent({
	components: {
		CursorIcon,
		KeyboardIcon,
		TranslateIcon,
		RotateIcon,
		ScaleIcon,
		SpaceIcon,
		OneSidedScaleIcon,
		ContextMenu,
		JsonPanel,
		GASMPanel,
		AnimationPanel,
		ResizableColPanel,
		KeyHint,
	},
	emits: {
		changed: () => true,
		modifier: (_: (json: Level) => Level) => true,
		scope: (_: (scope: never) => void) => true,
		undo: () => true,
		redo: () => true,
	},
	data() {
		return {
			zoom_to_cursor: true,
			free_movement: false,
			dragging: false,
			huge_far: false,
			show_groups: true,
			show_animations: true,
			show_triggers: true,
			show_sound: true,
			show_light: true,
			show_trigger_connections: true,
			show_gasm_connections: true,
			show_fog: true,
			show_sky: true,
			transform_mode: 'translate' as string as 'one_sided' | TransformMode,
			transform_space: 'local' as string as TransformSpace,
			contextmenu: undefined as Menu | undefined,
			contextmenu_position: { x: 0, y: 0 },
			is_animating: true,
			show_mini_editor: false,
			show_gasm_editor: false,
			show_keybinds: true,
			show_key_hints: true,
			show_shadows: false,
			group_depth: 0,
			active_tool: null as Tool | null,
			hold: {
				timeout: undefined as ReturnType<typeof setTimeout> | undefined,
				x: 0,
				y: 0,
			},
			mousedown_pos: null as { x: number; y: number } | null,
			deferred_context_menu: null as { x: number; y: number; menu: Menu } | null,
			is_touch_interaction: false,
			mouseup_fired: false,
			right_click_dragged: false,
			level: markRaw(levelData()),
			editing_json: undefined as Raw<LevelNodeObject> | undefined,
			editing_gasm: undefined as Raw<LevelNodeObject<LevelNodeGASM>> | undefined,
			editing_parent: undefined as
				Raw<LevelNodeObject<LevelNodeGroup> | THREE.Scene> | undefined,
			renderer: undefined as unknown as Raw<THREE.WebGLRenderer>,
			clock: undefined as unknown as Raw<THREE.Clock>,
			scene: undefined as unknown as Raw<THREE.Scene>,
			camera: undefined as unknown as Raw<THREE.PerspectiveCamera>,
			controls: undefined as unknown as Raw<OrbitControls | FreeControls>,
			gizmo: undefined as unknown as Raw<GizmoControls>,
			trigger_connection_material: undefined as THREE.LineBasicMaterial | undefined,
			gasm_connection_material: undefined as THREE.LineBasicMaterial | undefined,
			remove_events: undefined as (() => void) | undefined,
		};
	},
	mounted() {
		window._levelLoader ??= new LevelLoader();

		const configStore = useConfigStore();
		const config = configStore.editor_config;
		if (config) {
			Object.entries(config).forEach((entry) => {
				this[entry[0] as keyof typeof config] = entry[1];
			});
		}

		if (!this.setup_renderer()) return;

		this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
			e.preventDefault();
			window.toast('WebGL context lost, reload recommended', 'error');
		});
		this.renderer.domElement.addEventListener('webglcontextrestored', () => {
			window.toast('WebGL context restored', 'info');
		});

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === this.refs().viewport) {
					const { width, height } = entry.contentRect;
					this.resize(width, height);
					break;
				}
			}
		});
		observer.observe(this.refs().viewport);

		const keydown = this.keydown.bind(this);
		const keyup = this.keyup.bind(this);
		window.addEventListener('keydown', keydown);
		window.addEventListener('keyup', keyup);
		this.remove_events = () => {
			window.removeEventListener('keydown', keydown);
			window.removeEventListener('keyup', keyup);
		};
		// await this.set_json(this.json); // ???

		const resize = this.refs().resize;
		resize.size((resize.$el as HTMLElement).getBoundingClientRect().bottom - 30 - 5);

		this.load_camera_state();
	},
	unmounted() {
		this.remove_events?.();
	},
	methods: {
		refs() {
			return this.$refs as {
				resize: InstanceType<typeof ResizableColPanel>;
				viewport: HTMLElement;
				contextmenu: InstanceType<typeof ContextMenu> | undefined;
				gasm_editor: InstanceType<typeof GASMPanel>;
				mini_editor: InstanceType<typeof JsonPanel>;
				animation_panel: InstanceType<typeof AnimationPanel>;
			};
		},
		update_node_shader(object: THREE.Object3D | undefined, position = true, light = true) {
			if (!object || !isLevelNodeObject(object)) return;

			if (position && object.material?.uniforms.worldMatrix) {
				object.material.uniforms.worldMatrix = {
					value: new THREE.Matrix4().copy(object.matrixWorld),
				};
				const normalMatrix = new THREE.Matrix3();
				normalMatrix.getNormalMatrix(object.matrixWorld);

				object.material.uniforms.frozenNormalMatrix = {
					value: normalMatrix,
				};
			}

			if (light && object.material?.uniforms.worldNormalMatrix) {
				const normalMatrix = new THREE.Matrix3();
				normalMatrix.getNormalMatrix(object.matrixWorld);

				object.material.uniforms.worldNormalMatrix = {
					value: normalMatrix,
				};
			}

			if (object.children.length) {
				object.children.forEach((child) => this.update_node_shader(child, position, light));
			}
		},
		setup_renderer() {
			// renderer
			try {
				this.renderer = markRaw(
					new THREE.WebGLRenderer({
						antialias: true,
						preserveDrawingBuffer: true,
					}),
				);
			} catch (e) {
				if (e instanceof Error) {
					e.message = 'Browser failed to create WebGL context: ' + e.message;
					window.panic(e);
				}
				return false;
			}

			THREE.ColorManagement.enabled = true;
			this.renderer.setSize(
				this.refs().viewport.clientWidth,
				this.refs().viewport.clientHeight,
			);
			this.renderer.outputColorSpace = THREE.SRGBColorSpace;
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setClearColor(
				// new THREE.Color(143.0 / 255.0, 182.0 / 255.0, 221.0 / 255.0),
				// new THREE.Color(28 / 255.0, 28 / 255.0, 36 / 255.0),
				new THREE.Color(3 / 255.0, 3 / 255.0, 3 / 255.0),
				1.0,
			);
			this.renderer.setAnimationLoop(this.animation.bind(this));
			this.refs().viewport.appendChild(this.renderer.domElement);
			this.renderer.domElement.tabIndex = 0;
			// scene
			this.clock = markRaw(new THREE.Clock());
			this.scene = markRaw(new THREE.Scene());
			this.camera = markRaw(
				new THREE.PerspectiveCamera(
					70,
					this.refs().viewport.clientWidth / this.refs().viewport.clientHeight,
					0.1,
					this.huge_far ? 4000000 : 10000,
				),
			);
			this.camera.position.set(0, 10, 10);
			// controls
			this.controls = markRaw(new OrbitControls(this.camera, this.renderer.domElement));
			this.controls.zoomToCursor = this.zoom_to_cursor;
			this.controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
			// editing
			this.gizmo = markRaw(
				new GizmoControls(
					this.camera,
					this.renderer.domElement,
					this.scene,
					this.moving_event.bind(this),
					this.edit_event.bind(this),
				),
			);
			this.set_transform_mode(this.transform_mode);
			this.gizmo.set_space(this.transform_space);
			this.renderer.domElement.addEventListener('click', this.select_event.bind(this));
			this.renderer.domElement.addEventListener('dragover', (e) => {
				e.preventDefault();
			});

			return true;
		},
		reset_node_positions() {
			this.level.meta.time = 0;
			this.level.nodes.animated.forEach((node) => {
				node.userData.currentFrameIndex = 0;
				node.quaternion.copy(node.initialRotation);
				node.position.copy(node.initialPosition);
				node.updateMatrixWorld(true);
				this.update_node_shader(node);
			});
		},
		moving_event(_: TransformControlsEvent<'change'>) {
			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				update_animation_paths_transforms(object);
				update_relevant_group_bounds(object);
			});
			this.update_connection_positions(this.gizmo.selection);
		},
		edit_event(e: TransformControlsEvent<'dragging-changed'>) {
			(this.controls as OrbitControls).enabled = !e.value;
			if (e.value) return;
			this.dragging = true;

			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				update_relevant_group_bounds(object);
			});

			this.update_connection_positions(this.gizmo.selection);
			this.changed();
		},
		cast_for_node(x: number, y: number): LevelNodeObject | undefined {
			const canvasSize = this.renderer.domElement.getBoundingClientRect();
			const mouse = new THREE.Vector2(
				((x - canvasSize.left) / canvasSize.width) * 2 - 1,
				-((y - canvasSize.top) / canvasSize.height) * 2 + 1,
			);
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, this.camera);
			const individualObjects = this.level.nodes.all.filter(
				(node) => !node.userData.isGroup && node.visible,
			);
			const intersects = raycaster.intersectObjects<LevelNodeObject>(individualObjects, true);
			const parent = this.editing_parent ?? this.level.scene;
			let intersect: LevelNodeObject | undefined = undefined;
			if (intersects[0] && object_contains(parent, intersects[0].object)) {
				intersect = intersects[0].object;
				while (intersect.parent !== parent) {
					intersect = intersect.parent as LevelNodeObject;
				}
			}
			return intersect;
		},
		select_event(e: MouseEvent) {
			if (this.mousedown_pos) {
				const dx = e.clientX - this.mousedown_pos.x;
				const dy = e.clientY - this.mousedown_pos.y;
				this.mousedown_pos = null;
				if (dx * dx + dy * dy > 9) return;
			}

			if (this.free_movement) return;
			if (this.active_tool?.on_click?.(e)) return;

			const intersect = this.cast_for_node(e.clientX, e.clientY);
			if (intersect) {
				if (!this.gizmo.includes(intersect)) {
					if (!e.shiftKey) {
						this.gizmo.clear();
					}

					if (this.is_animating) this.reset_node_positions();
					this.gizmo.add(intersect);
					this.is_animating = false;
				} else {
					if (e.shiftKey) {
						this.gizmo.remove(intersect);

						if (this.gizmo.empty()) {
							this.is_animating = this.refs().animation_panel.playing;
						}
					}
				}
			} else {
				if (!this.dragging) {
					this.gizmo.clear();
					this.is_animating = this.refs().animation_panel.playing;
				}
			}
			this.dragging = false;
		},
		async set_json(json: Level | undefined) {
			if (!json) return;

			const selected_nodes = this.gizmo.selection.map((o) => o.userData.node).filter(Boolean);

			this.gizmo.clear();
			this.scene.remove(this.level.scene);
			this.level.scene.traverse((obj) => {
				if (obj instanceof THREE.Mesh) {
					if (obj.geometry) (obj.geometry as THREE.BufferGeometry).dispose();
					if (obj.material) {
						if (Array.isArray(obj.material)) {
							obj.material.forEach((m) => (m as THREE.Material).dispose());
						} else (obj.material as THREE.Material).dispose();
					}
				}
				// if (obj.texture) obj.texture.dispose();
				obj.children.length = 0;
			});
			window._levelLoader!.config({
				sky: this.show_sky,
				lights: true,
				text: true,
				triggers: this.show_triggers,
				sound: this.show_sound,
				light: this.show_light,
				sublevels: true,
				static: false,
				fog: this.show_fog,
				GASM: true,
			});
			this.level = markRaw(await window._levelLoader!.load(json));
			this.add_hitboxes();
			add_trigger_connections(this.level, this.show_trigger_connections);
			add_gasm_connections(this.level, this.show_gasm_connections);
			add_animation_paths(this.level, this.show_animations);
			add_group_bounds(this.level, this.show_groups);

			if (this.show_shadows) this.update_shadows();
			this.scene.add(this.level.scene);
			this.enter_specific_group(this.level.scene);
			for (const node of selected_nodes) {
				const obj = this.level.nodes.all.find((o) => o.userData.node === node);
				if (obj) this.gizmo.add(obj);
			}
			this.$emit('scope', (scope: InstanceType<typeof EditorPage>) => {
				scope.refs().statistics.set_level(this.level);
			});
			this.refs().animation_panel.set_level(this.level);
			console.log(this.level);
			console.log(json);
		},
		configure_shadow_camera() {
			const sun = this.level.sun;
			if (!sun) return;

			sun.castShadow = this.show_shadows;

			const bbox = new THREE.Box3();
			this.level.nodes.all.forEach((obj) => bbox.expandByObject(obj));
			const center = bbox.getCenter(new THREE.Vector3());
			const size = bbox.getSize(new THREE.Vector3());

			const margin = 0.1;
			const maxDim = Math.max(size.x, size.y, size.z);
			const halfSize = maxDim * 0.5 * (1 + margin);

			sun.shadow.camera.left = -halfSize;
			sun.shadow.camera.right = halfSize;
			sun.shadow.camera.top = halfSize;
			sun.shadow.camera.bottom = -halfSize;

			sun.shadow.camera.near = 0.1;
			sun.shadow.camera.far = size.length() * 2;

			const sunDirection = sun.userData.direction.clone();
			const distance = size.length();
			sun.position.copy(sunDirection.multiplyScalar(-distance));
			sun.target.position.copy(center);

			sun.shadow.mapSize.width = 10000;
			sun.shadow.mapSize.height = 10000;

			sun.shadow.camera.updateProjectionMatrix();
		},
		toggle_shadows() {
			this.show_shadows = !this.show_shadows;
			this.update_shadows();
		},
		update_shadows() {
			this.renderer.shadowMap.enabled = this.show_shadows;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			const shadow_nodes = [
				...this.level.nodes.levelNodeStatic,
				...this.level.nodes.levelNodeCrumbling,
				...this.level.nodes.levelNodeSign,
			];

			shadow_nodes.forEach((object) => {
				object.castShadow = this.show_shadows;
				object.receiveShadow = this.show_shadows;
			});

			this.configure_shadow_camera();
		},
		add_hitboxes() {
			const geometry = new THREE.BoxGeometry();
			const material = new THREE.MeshBasicMaterial({
				color: 0x000000,
				transparent: true,
				opacity: 0.1,
			});
			this.level.nodes.all
				.filter((o) => !o.userData.isGroup && !o.isMesh)
				.forEach((object) => {
					const hitbox = new THREE.Mesh(geometry, material);
					object.add(hitbox);
				});
		},
		changed() {
			this.level.level.complexity = this.level.complexity;
			this.level.level.formatVersion = this.$config.FORMAT_VERSION;
			this.refs().animation_panel.set_level(this.level);
			this.$emit('changed');
		},
		modifier(func: (json: Level) => Level) {
			this.$emit('modifier', func);
		},
		resize(width: number, height: number) {
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();

			this.renderer.setSize(width, height);
			this.renderer.render(this.scene, this.camera);
		},
		set_time(time: number) {
			this.level.meta.time = 0;
			this.level.nodes.animated.forEach((node) => {
				node.userData.currentFrameIndex = 0;
			});
			this.level.update(time);
		},
		animation() {
			const delta = this.clock.getDelta();
			if (this.is_animating) {
				this.level.update(delta);
				this.update_connection_positions(this.level.nodes.animated);
				this.level.nodes.animated.forEach((object) => {
					this.update_node_shader(object, false, true);
				});
			}
			this.refs().animation_panel.set_time(this.level.meta.time);
			this.controls.update(delta);
			this.renderer.render(this.scene, this.camera);
		},
		zoomToCursorChange(e: Event) {
			if (!e.target || !(this.controls instanceof OrbitControls)) return;

			const checked = (e.target as HTMLInputElement).checked;
			this.controls.zoomToCursor = this.zoom_to_cursor = checked;
		},
		toggleControls(e: Event) {
			this.controls.dispose();
			this.free_movement = (e.target as HTMLInputElement).checked;

			if ((e.target as HTMLInputElement).checked) {
				// FIXME: burh
				const direction = new THREE.Vector3();
				this.camera.getWorldDirection(direction);
				const yaw = Math.atan2(direction.x, direction.z);
				const pitch = Math.asin(-direction.y);
				this.controls = markRaw(new FreeControls(this.camera, this.renderer.domElement));
				this.controls.eulerVector.set(pitch, yaw, 0);
				this.gizmo.clear();
			} else {
				const direction = new THREE.Vector3();
				this.camera.getWorldDirection(direction);
				const look_at = new THREE.Vector3().addVectors(
					this.camera.position,
					direction.multiplyScalar(1),
				);
				this.controls = markRaw(new OrbitControls(this.camera, this.renderer.domElement));
				this.controls.zoomToCursor = this.zoom_to_cursor;
				this.controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
				this.controls.target.copy(look_at);
			}
		},
		mousedown(e: MouseEvent) {
			this.deferred_context_menu = null;
			this.mouseup_fired = false;
			this.right_click_dragged = false;
			if (e.target === this.renderer.domElement) {
				this.mousedown_pos = { x: e.clientX, y: e.clientY };
			}
			if (this.active_tool?.on_mouse_down?.(e)) return;

			if (
				e.target !== this.refs().contextmenu?.$el &&
				!this.refs().contextmenu?.$el?.contains(e.target)
			) {
				this.contextmenu = undefined;
			}
			if (e.target === this.renderer.domElement) {
				if (this.controls instanceof FreeControls) {
					this.controls.isMouseActive = true;
				}
				this.show_keybinds = false;
			}
		},
		mouseup(e: MouseEvent) {
			if (e.button === 2) {
				this.mouseup_fired = true;
				if (this.deferred_context_menu) {
					// macos: rightmousedown fired before mouseup
					const dx = e.clientX - this.deferred_context_menu.x;
					const dy = e.clientY - this.deferred_context_menu.y;
					if (dx * dx + dy * dy <= 9) {
						this.contextmenu = this.deferred_context_menu.menu;
						this.contextmenu_position.x = this.deferred_context_menu.x;
						this.contextmenu_position.y = this.deferred_context_menu.y;
					}
					this.deferred_context_menu = null;
				} else if (this.mousedown_pos) {
					// windows/linux: rightmousedown not fired yet
					const dx = e.clientX - this.mousedown_pos.x;
					const dy = e.clientY - this.mousedown_pos.y;
					this.right_click_dragged = dx * dx + dy * dy > 9;
				}
				this.mousedown_pos = null;
			}

			if (this.active_tool?.on_mouse_up?.(e)) return;

			(this.controls as FreeControls).isMouseActive = false;
		},
		set_transform_mode(mode: 'one_sided' | TransformMode) {
			this.transform_mode = mode;
			if (mode === 'one_sided') {
				this.gizmo.set_mode('scale');
				this.gizmo.set_one_sided(true);
			} else {
				this.gizmo.set_mode(mode);
				this.gizmo.set_one_sided(false);
			}
		},
		transform_mode_event(e: Event) {
			if (!e.target) return;
			const target = e.target as HTMLInputElement;
			const mode = target.id.split('-')[1] as 'one_sided' | TransformMode;
			this.set_transform_mode(mode);
			target.checked = true;
		},
		toggle_transform_space(_?: MouseEvent) {
			this.gizmo.set_space(this.gizmo.get_space() === 'local' ? 'world' : 'local');
			this.transform_space = this.gizmo.get_space();
		},
		select_nodes(nodes: THREE.Object3D[]) {
			if (this.free_movement) return;
			this.is_animating = false;
			this.gizmo.clear();
			nodes
				.filter((obj) => obj.parent === this.editing_parent)
				.forEach((obj) => this.gizmo.add(obj));
		},
		select_by_material(material: LevelNodeMaterial) {
			this.select_nodes(this.level.nodes.material[material] ?? []);
		},
		select_by_shape(shape: LevelNodeShape) {
			this.select_nodes(this.level.nodes.shape[shape] ?? []);
		},
		select_by_type(type: LevelNodeKey) {
			this.select_nodes(this.level.nodes[type]);
		},
		select_by_color() {
			if (this.gizmo.empty()) return;
			const target = this.gizmo.selection[0]!;
			const target_node = target.userData.node.levelNodeStatic;
			if (!target_node) return;
			const node_color = target_node.color1 ?? { r: 1, g: 1, b: 1 };

			const selection = this.level.nodes.all.filter((object) => {
				const node = object.userData.node.levelNodeStatic;
				if (!node) return false;
				const color = node.color1 ?? { r: 1, g: 1, b: 1 };

				return (
					node.material === target_node.material &&
					(color.r ?? 0) === (node_color.r ?? 0) &&
					(color.g ?? 0) === (node_color.g ?? 0) &&
					(color.b ?? 0) === (node_color.b ?? 0)
				);
			});
			this.select_nodes(selection);
		},
		select_all() {
			this.select_nodes(this.level.nodes.all);
		},
		copy_camera_state() {
			let camera_state = `&camera_position=`;
			camera_state += `${this.camera.position.x},${this.camera.position.y},${this.camera.position.z}`;
			camera_state += `&camera_rotation=`;
			camera_state += `${this.camera.rotation.x},${this.camera.rotation.y},${this.camera.rotation.z}`;
			if (this.controls instanceof OrbitControls) {
				camera_state += `&control_target=`;
				camera_state += `${this.controls.target.x},${this.controls.target.y},${this.controls.target.z}`;
			}

			void navigator.clipboard.writeText(camera_state);
		},
		load_camera_state() {
			const params = new URLSearchParams(window.location.search);
			const camera_position = params.get('camera_position');
			const camera_rotation = params.get('camera_rotation');
			const control_target = params.get('control_target');
			if (camera_position) {
				const position = camera_position.split(',').map((pos) => parseFloat(pos));
				this.camera.position.set(position[0]!, position[1]!, position[2]!);
			}
			if (camera_rotation) {
				const rotation = camera_rotation.split(',').map((rot) => parseFloat(rot));
				this.camera.rotation.set(rotation[0]!, rotation[1]!, rotation[2]!);
			}
			if (control_target && this.controls instanceof OrbitControls) {
				const target = control_target.split(',').map((pos) => parseFloat(pos));
				this.controls.target.set(target[0]!, target[1]!, target[2]!);
				this.camera.lookAt(target[0]!, target[1]!, target[2]!);
			}
		},
		save_config() {
			const config = {
				zoom_to_cursor: this.zoom_to_cursor,
				free_movement: this.free_movement,
				huge_far: this.huge_far,
				show_groups: this.show_groups,
				show_animations: this.show_animations,
				show_triggers: this.show_triggers,
				show_sound: this.show_sound,
				show_light: this.show_light,
				show_trigger_connections: this.show_trigger_connections,
				show_gasm_connections: this.show_gasm_connections,
				show_fog: this.show_fog,
				show_sky: this.show_sky,
				show_key_hints: this.show_key_hints,
			};
			const configStore = useConfigStore();
			configStore.editor_config = config;
		},
		toggle_sky() {
			this.show_sky = !this.show_sky;
			const sky = this.level.scene.children.find((obj) => obj.userData.isSky);
			if (sky) sky.visible = this.show_sky;
		},
		toggle_trigger_connections() {
			this.show_trigger_connections = !this.show_trigger_connections;
			this.level.nodes.levelNodeTrigger.forEach((object) => {
				update_trigger_connections_visibility(object, this.show_trigger_connections);
			});
			this.update_connection_positions();
		},
		toggle_gasm_connections() {
			this.show_gasm_connections = !this.show_gasm_connections;
			this.level.nodes.levelNodeGASM.forEach((object) => {
				update_gasm_connections_visibility(object, this.show_gasm_connections);
			});
			this.update_connection_positions();
		},
		toggle_groups() {
			this.show_groups = !this.show_groups;
			this.level.nodes.levelNodeGroup.forEach((object) => {
				update_group_bound_visibility(object, this.show_groups);
			});
		},
		toggle_animations() {
			this.show_animations = !this.show_animations;
			this.level.nodes.animated.forEach((object) => {
				update_animation_paths_visibility(object, this.show_animations);
			});
		},
		update_connection_positions(related_objects: LevelNodeObject[] | undefined = undefined) {
			related_objects ??= [
				...(this.show_trigger_connections ? this.level.nodes.levelNodeTrigger : []),
				...(this.show_gasm_connections ? this.level.nodes.levelNodeGASM : []),
			];
			update_connection_positions(related_objects);
		},
		modify_selection(func: (nodes: LevelNode[]) => LevelNode[]) {
			this.modifier((json) => {
				const node_list = this.get_editing_nodes(json);

				const new_list = func(node_list);

				node_list.length = 0;
				node_list.push(...new_list);

				return json;
			});
		},
		clone_selection() {
			this.modify_selection((node_list) => [
				...node_list,
				...this.gizmo.selection.map((object) => {
					return deepClone(object.userData.node);
				}),
			]);
		},
		activate_tool(tool: Tool) {
			if (this.active_tool) this.deactivate_tool();
			if (tool.activate(this)) this.active_tool = markRaw(tool);
		},
		deactivate_tool() {
			if (this.active_tool) {
				this.active_tool.deactivate?.();
				this.active_tool = null;
			}
		},
		delete_selection() {
			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) => !this.gizmo.selection.find((o) => n === o.userData.node),
				),
			]);
		},
		group_selection() {
			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) => !this.gizmo.selection.find((o) => n === o.userData.node),
				),
				levelNodeGroupFrom({
					childNodes: this.gizmo.selection.map((o) => o.userData.node),
				}),
			]);
		},
		ungroup_selection() {
			if (this.gizmo.selection.length !== 1) return;
			const object = this.gizmo.selection[0]!;
			const node = object.userData.node;
			if (!isLevelNodeGroup(node)) return;

			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) => !this.gizmo.selection.find((o) => n === o.userData.node),
				),
				...ungroupNode(node),
			]);
		},
		insert_nodes(nodes: LevelNode[]) {
			this.modify_selection((node_list) => [...node_list, ...nodes]);
		},
		insert_nodes_at_mouse(nodes: LevelNode[], { x, y }: { x: number; y: number }) {
			if (!(this.controls instanceof OrbitControls)) return;

			const distance = this.camera.position.distanceTo(this.controls.target);
			const mouse = new THREE.Vector2();
			const canvasSize = this.renderer.domElement.getBoundingClientRect();
			mouse.x = ((x - canvasSize.left) / canvasSize.width) * 2 - 1;
			mouse.y = -(((y - canvasSize.top) / canvasSize.height) * 2) + 1;

			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, this.camera);
			const position = new THREE.Vector3();
			position
				.copy(raycaster.ray.direction)
				.multiplyScalar(distance)
				.add(this.camera.position);

			nodes.forEach((node) => {
				levelNodeData(node).position = { ...position };
			});

			this.insert_nodes(nodes);
		},
		keyup(e: KeyboardEvent) {
			if (this.active_tool?.on_key_up?.(e)) return;

			switch (e.code) {
				case 'ShiftLeft':
					this.gizmo.set_snapping(false);
					break;

				default:
					break;
			}
		},
		keydown(e: KeyboardEvent) {
			if (this.active_tool?.on_key_down?.(e)) return;

			if (e.target === this.renderer.domElement) {
				switch (e.code) {
					case 'ShiftLeft':
						this.gizmo.set_snapping(true);
						break;

					case 'KeyQ':
						this.toggle_transform_space();
						break;

					case 'KeyE':
						this.set_transform_mode('scale');
						break;

					case 'KeyF':
						this.set_transform_mode('one_sided');
						break;

					case 'KeyR':
						this.set_transform_mode('rotate');
						break;

					case 'KeyT':
						this.set_transform_mode('translate');
						break;

					case 'KeyC':
						this.clone_selection();
						break;

					case 'KeyX':
						this.delete_selection();
						break;

					case 'KeyG':
						if (e.shiftKey) {
							this.ungroup_selection();
						} else {
							this.group_selection();
						}
						break;

					case 'ArrowUp':
						this.enter_group();
						break;

					case 'ArrowDown':
						this.exit_group();
						break;

					case 'KeyZ':
						if (e.ctrlKey || e.metaKey) {
							e.preventDefault();
							if (e.shiftKey) {
								this.$emit('redo');
							} else {
								this.$emit('undo');
							}
						}
						break;

					default:
						break;
				}
			}

			switch (e.code) {
				case 'Escape':
					if (this.active_tool) {
						this.deactivate_tool();
						e.preventDefault();
						return;
					}
					if (this.show_mini_editor) this.close_mini_editor();
					else if (this.show_gasm_editor) this.close_gasm_editor();
					else if (this.contextmenu) this.contextmenu = undefined;
					else if (!this.gizmo.empty()) this.gizmo.clear();
					this.is_animating = this.refs().animation_panel.playing;
					break;

				default:
					break;
			}
		},
		play(object: LevelNodeObject<LevelNodeSound>) {
			const params = object.userData.node.levelNodeSound.parameters ?? {};
			play_sound(params);
		},
		enter_group() {
			if (this.gizmo.selection.length !== 1) return;
			const group = this.gizmo.selection[0]!;
			if (!isLevelNodeObject(group, 'levelNodeGroup')) return;
			this.enter_specific_group(group);
		},
		exit_group() {
			if (this.editing_parent === this.level.scene || !this.editing_parent?.parent) return;
			this.enter_specific_group(
				this.editing_parent.parent as LevelNodeObject<LevelNodeGroup>,
			);
		},
		enter_specific_group(object: LevelNodeObject<LevelNodeGroup> | THREE.Scene) {
			this.gizmo.clear();

			if (isLevelNodeObject(this.editing_parent, 'levelNodeGroup')) {
				update_group_bounds_color(this.editing_parent, false);
			}
			this.editing_parent = markRaw(object);
			if (isLevelNodeObject(this.editing_parent, 'levelNodeGroup')) {
				update_group_bounds_color(this.editing_parent, true);
			}

			this.group_depth = 0;
			let parent = this.editing_parent;
			while (parent !== this.level.scene) {
				this.group_depth++;
				parent = parent.parent as LevelNodeObject<LevelNodeGroup> | THREE.Scene;
			}
		},
		close_gasm_editor() {
			if (this.show_gasm_editor) this.refs().gasm_editor.save();
			this.show_gasm_editor = false;
		},
		get_editing_nodes(level: Level) {
			return this.editing_parent && !(this.editing_parent instanceof THREE.Scene)
				? (this.editing_parent.userData.node.levelNodeGroup.childNodes ??= [])
				: (level.levelNodes ??= []);
		},
		save_gasm_code(new_json: LevelNodeWith<LevelNodeGASM>) {
			const id = this.editing_gasm?.userData.id;
			if (!id) {
				window.toast('Failed to write node', 'error');
				return;
			}
			this.modifier((json) => {
				console.log(json);
				const node_list = this.get_editing_nodes(json);
				const index = node_list.findIndex(
					(n) => n === this.level.nodes.all[id - 1]?.userData.node,
				);
				if (index !== -1) {
					node_list[index] = new_json;
				}
				return json;
			});
		},
		close_mini_editor() {
			if (this.show_mini_editor) this.mini_editor_changed(this.refs().mini_editor.json);
			this.show_mini_editor = false;
		},
		add_standalone_code_connection(
			object: LevelNodeObject<LevelNodeGASM>,
			type: PropertyType,
			name: string,
		) {
			const object_node = object.userData.node;
			create_connection(object_node, undefined, 0, type, name);
			this.changed();
		},
		add_code_connection(
			object: LevelNodeObject<LevelNodeGASM>,
			target: LevelNodeObject,
			type: PropertyType,
		) {
			const object_node = object.userData.node;
			const target_node = target.userData.node;
			const id = target.userData.id;
			const is_new = create_connection(object_node, target_node, id, type);
			if (is_new) add_gasm_connection(object, target, this.show_gasm_connections);

			this.changed();
		},
		add_animation_target(object: LevelNodeObject, target_object?: LevelNodeObject) {
			if (!isLevelNodeObject(object) || !isLevelNodeTrigger(object.userData.node)) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerTargets ??= [];
			const target = triggerTargetWithAnimation();
			const id = target_object?.userData.id ?? 0;
			target.triggerTargetAnimation.objectID = id;
			trigger.triggerTargets.push(target);
			if (target_object) {
				add_trigger_connection(
					object as LevelNodeObject<LevelNodeTrigger>,
					target_object,
					this.show_trigger_connections,
				);
			}
			this.changed();
		},
		add_sublevel_target(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerTargets ??= [];
			trigger.triggerTargets.push(triggerTargetWithSubLevel());
			this.changed();
		},
		add_ambience_target(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerTargets ??= [];
			trigger.triggerTargets.push(triggerTargetWithAmbience());
			this.changed();
		},
		add_sound_target(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerTargets ??= [];
			trigger.triggerTargets.push(triggerTargetWithSound());
			this.changed();
		},
		add_light_target(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerTargets ??= [];
			trigger.triggerTargets.push(triggerTargetWithLight());
			this.changed();
		},
		add_trigger_source(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerSources ??= [];
			trigger.triggerSources.push(triggerSourceWithBasic());
			this.changed();
		},
		add_trigger_blocks_source(object: LevelNodeObject) {
			if (!object.userData.node.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			trigger.triggerSources ??= [];
			trigger.triggerSources.push(triggerSourceWithBlockNames());
			this.changed();
		},
		add_animation(object: LevelNodeObject) {
			const node = object.userData.node;
			(node.animations ??= []).push(animation());
			this.changed();
		},
		edit_object_json(object: LevelNodeObject) {
			this.show_mini_editor = true;
			this.editing_json = markRaw(object);
			this.refs().mini_editor.set_json(object.userData.node);
		},
		edit_gasm_code(object: LevelNodeObject<LevelNodeGASM>) {
			this.show_gasm_editor = true;
			this.editing_gasm = markRaw(object);
			this.refs().gasm_editor.set_json(object.userData.node);
		},
		mini_editor_changed(new_node: LevelNode) {
			const id = this.editing_json?.userData.id;
			if (!id) {
				window.toast('Failed to write node', 'error');
				return;
			}
			this.modifier((json) => {
				console.log(json);
				const node_list = this.get_editing_nodes(json);
				const index = node_list.findIndex(
					(n) => n === this.level.nodes.all[id - 1]?.userData.node,
				);
				if (index !== -1) {
					node_list[index] = new_node;
				}
				return json;
			});
		},
		set_material(material: LevelNodeMaterial) {
			this.gizmo.selection.forEach((object) => {
				const node = levelNodeData(object.userData.node);
				if (
					isLevelNodeStatic(object.userData.node) ||
					isLevelNodeCrumbling(object.userData.node)
				) {
					(node as LevelNodeStatic | LevelNodeCrumbling).material = material;
				}
			});
			this.modifier((json) => json);
		},
		set_shape(shape: LevelNodeShape) {
			this.gizmo.selection.forEach((object) => {
				const node = levelNodeData(object.userData.node);
				if (
					isLevelNodeStatic(object.userData.node) ||
					isLevelNodeCrumbling(object.userData.node) ||
					isLevelNodeTrigger(object.userData.node)
				) {
					(node as LevelNodeStatic | LevelNodeCrumbling | LevelNodeTrigger).shape = shape;
				}
			});
			this.modifier((json) => json);
		},
		build_context_menu(x: number, y: number) {
			if (this.controls instanceof FreeControls) return;

			const clicked_object = this.cast_for_node(x, y);
			if (!clicked_object) {
				return {
					'Insert Node': {
						...Object.fromEntries(
							levelNodeMetadata
								.filter(
									(metadata) =>
										!['LobbyTerminal', 'Group'].includes(metadata.scope),
								)
								.map((metadata) => [
									metadata.scope,
									{
										func: () => {
											this.insert_nodes_at_mouse([metadata.with()], { x, y });
										},
									},
								]),
						),
					},
				} satisfies Menu;
			}

			const clicked_node = clicked_object.userData.node;

			const selection = this.gizmo.selection;
			if (!selection.length || !selection[0]) return;

			const single_selection = selection.length === 1;
			const selected_object = selection[0];
			const selected_node = selected_object.userData.node;

			const selected_is_trigger = isLevelNodeTrigger(selected_node);
			const selected_is_gasm = isLevelNodeGASM(selected_node);
			const selected_is_sound = isLevelNodeSound(selected_node);
			const selected_is_group = isLevelNodeGroup(selected_node);

			const clicked_is_gasm = isLevelNodeGASM(clicked_node);
			const clicked_is_trigger = isLevelNodeTrigger(clicked_node);
			const clicked_is_light = isLevelNodeLight(clicked_node);
			const clicked_is_group = isLevelNodeGroup(clicked_node);
			const clicked_is_static = isLevelNodeStatic(clicked_node);
			const clicked_is_crumbling = isLevelNodeCrumbling(clicked_node);
			const clicked_is_start = isLevelNodeStart(clicked_node);
			const clicked_is_finish = isLevelNodeFinish(clicked_node);
			const clicked_is_sign = isLevelNodeSign(clicked_node);

			const clicked_is_selected = this.gizmo.includes(clicked_object);

			const clicked_has_shape =
				clicked_is_static || clicked_is_crumbling || clicked_is_trigger;
			const clicked_has_material = clicked_is_static;
			const clicked_has_color =
				clicked_is_static &&
				(clicked_node.levelNodeStatic.material === LevelNodeMaterial.DEFAULT_COLORED ||
					clicked_node.levelNodeStatic.material === LevelNodeMaterial.LAVA);

			const clicked_can_target = !clicked_is_start && !clicked_is_finish;
			const clicked_can_animate = !clicked_is_start && !clicked_is_finish;

			const can_group = !selection.some((object) => {
				return (
					isLevelNodeStart(object.userData.node) ||
					isLevelNodeFinish(object.userData.node)
				);
			});
			const can_clone = !selection.some((object) => {
				return isLevelNodeFinish(object.userData.node);
			});

			const menu: Menu = {
				...(clicked_is_selected && {
					'Edit JSON': {
						func: () => {
							this.edit_object_json(clicked_object);
						},
					},
					...(clicked_is_gasm && {
						'Edit Code': {
							func: () => {
								this.edit_gasm_code(
									clicked_object as LevelNodeObject<LevelNodeGASM>,
								);
							},
						},
					}),
					Delete: {
						func: this.delete_selection.bind(this),
					},
					...(can_clone && {
						Clone: {
							func: this.clone_selection.bind(this),
						},
					}),
					...(can_group && {
						Group: {
							func: this.group_selection.bind(this),
						},
					}),
					...(single_selection &&
						selected_is_group && {
							Ungroup: {
								func: this.ungroup_selection.bind(this),
							},
						}),
					...(clicked_has_shape && {
						Shape: {
							...Object.fromEntries(
								Array.from(
									{
										length:
											Object.entries(shapes()).length -
											shapes().__END_OF_SPECIAL_PARTS__ -
											1,
									},
									(_, i) => {
										return [
											format_type(shapes()[1000 + i]!),
											{
												func: () => {
													this.set_shape(1000 + i);
												},
											},
										];
									},
								),
							),
						},
					}),
					...(clicked_has_material && {
						Material: {
							...Object.fromEntries(
								Array.from(
									{
										length: Object.entries(materials()).length,
									},
									(_, i) => {
										return [
											format_type(materials()[i]!),
											{
												func: () => {
													this.set_material(i);
												},
												num: i,
											},
										] as [string, { func: () => void; num: number }];
									},
								).filter((item) => item[1].num !== LevelNodeMaterial.TRIGGER),
							),
						},
					}),
					...(clicked_can_animate && {
						'Add Animation': {
							func: () => {
								this.add_animation(clicked_object);
							},
						},
					}),
					...(selected_is_sound && {
						Play: {
							func: () => {
								this.play(selected_object as LevelNodeObject<LevelNodeSound>);
							},
						},
					}),
					...(clicked_is_trigger && {
						'Add Target': {
							Animation: {
								func: () => {
									this.add_animation_target(clicked_object);
								},
							},
							SubLevel: {
								func: () => {
									this.add_sublevel_target(clicked_object);
								},
							},
							Ambience: {
								func: () => {
									this.add_ambience_target(clicked_object);
								},
							},
							Sound: {
								func: () => {
									this.add_sound_target(clicked_object);
								},
							},
							Light: {
								func: () => {
									this.add_light_target(clicked_object);
								},
							},
						},
						'Add Source': {
							Basic: {
								func: () => {
									this.add_trigger_source(clicked_object);
								},
							},
							Blocks: {
								func: () => {
									this.add_trigger_blocks_source(clicked_object);
								},
							},
						},
					}),
				}),
				...(single_selection &&
					selected_is_trigger &&
					clicked_can_target && {
						'Add as Target': {
							func: () => {
								this.add_animation_target(selected_object, clicked_object);
							},
						},
					}),
				...(single_selection &&
					selected_is_gasm &&
					clicked_can_target && {
						'Add as Connection': {
							Position: {
								func: () => {
									this.add_code_connection(
										selected_object as LevelNodeObject<LevelNodeGASM>,
										clicked_object,
										'position',
									);
								},
							},
							Rotation: {
								func: () => {
									this.add_code_connection(
										selected_object as LevelNodeObject<LevelNodeGASM>,
										clicked_object,
										'rotation',
									);
								},
							},
							Scale: {
								func: () => {
									this.add_code_connection(
										selected_object as LevelNodeObject<LevelNodeGASM>,
										clicked_object,
										'scale',
									);
								},
							},
							...(clicked_is_sign && {
								Sign: {
									func: () => {
										this.add_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											clicked_object,
											'sign',
										);
									},
								},
							}),
							...(clicked_has_color && {
								Color: {
									func: () => {
										this.add_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											clicked_object,
											'color',
										);
									},
								},
							}),
							...(clicked_is_trigger && {
								Active: {
									func: () => {
										this.add_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											clicked_object,
											'triggerActive',
										);
									},
								},
							}),
							...(clicked_is_light && {
								Light: {
									func: () => {
										this.add_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											clicked_object,
											'light',
										);
									},
								},
							}),
							...(clicked_is_group && {
								Physics: {
									func: () => {
										this.add_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											clicked_object,
											'physics',
										);
									},
								},
							}),
							...(clicked_is_selected && {
								Player: {
									func: () => {
										this.add_standalone_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											'player',
											'Player',
										);
									},
								},
								'Player Vars': {
									func: () => {
										this.add_standalone_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											'playerVariables',
											'Player',
										);
									},
								},
								'Lobby Vars': {
									func: () => {
										this.add_standalone_code_connection(
											selected_object as LevelNodeObject<LevelNodeGASM>,
											'lobbyVariables',
											'Lobby',
										);
									},
								},
							}),
						},
					}),
				...(clicked_is_selected && {
					[`Copy ID (${clicked_object.userData.id})`]: {
						func: () => {
							copy_object_id(clicked_object);
						},
					},
				}),
			};

			if (Object.keys(menu).length === 0) return;
			return menu;
		},
		open_context_menu(x: number, y: number, e: MouseEvent) {
			if (e.target !== this.renderer.domElement) return;
			this.contextmenu_position.x = x;
			this.contextmenu_position.y = y;
			this.contextmenu = undefined;
			const menu = this.build_context_menu(x, y);
			if (menu) this.contextmenu = menu;
		},
		close_context_menu() {
			this.contextmenu = undefined;
		},
		teleport_start() {
			if (this.level.nodes.defaultSpawn) {
				const position = new THREE.Vector3();
				this.level.nodes.defaultSpawn.getWorldPosition(position);
				this.camera.position.set(position.x, position.y + 1, position.z + 1);
				if (this.controls instanceof OrbitControls) {
					this.controls.target.set(position.x, position.y, position.z);
				}
				this.camera.lookAt(position.x, position.y, position.z);
			}
		},
		teleport_finish() {
			if (this.level.nodes.levelNodeFinish.length) {
				const position = new THREE.Vector3();
				this.level.nodes.levelNodeFinish[0]!.getWorldPosition(position);
				this.camera.position.set(position.x, position.y + 1, position.z + 1);
				if (this.controls instanceof OrbitControls) {
					this.controls.target.set(position.x, position.y, position.z);
				}
				this.camera.lookAt(position.x, position.y, position.z);
			}
		},
		teleport_origin() {
			this.camera.position.set(0, 1, 1);
			if (this.controls instanceof OrbitControls) {
				this.controls.target.set(0, 0, 0);
			}
			this.camera.lookAt(0, 0, 0);
		},
		teleport_full() {
			const min = new THREE.Vector3(Infinity, Infinity, Infinity);
			const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

			this.level.nodes.all.forEach((node) => {
				min.min(node.position);
				max.max(node.position);
				if (isNaN(node.position.z)) console.log(node);
			});

			if (min.x === Infinity) {
				window.toast('No nodes found', 'warning');
				return;
			}

			const center = new THREE.Vector3().addVectors(max, min).divideScalar(2);
			const size = new THREE.Vector3().subVectors(max, min);

			const view_position = center.clone();

			if (size.x > size.z) {
				view_position.z += size.x;
				view_position.y = size.x;
			} else {
				view_position.x += size.z;
				view_position.y = size.z;
			}

			this.camera.position.copy(view_position);
			if (this.controls instanceof OrbitControls) {
				this.controls.target.copy(center);
			}
			this.camera.lookAt(center);
		},
		mirror_x() {
			this.modifier((json) => {
				const node_list = this.get_editing_nodes(json);

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = levelNodeData(node);

						const x = -object.initialPosition.x;
						object.position.x = x;
						object.initialPosition.x = x;
						(data.position ??= {}).x = x;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.x) {
											frame.position.x = -frame.position.x;
										}
									});
								}
							});
						}
					});

				return json;
			});
		},
		mirror_y() {
			this.modifier((json) => {
				const node_list = this.get_editing_nodes(json);

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = levelNodeData(node);

						const y = -object.initialPosition.y;
						object.position.y = y;
						object.initialPosition.y = y;
						(data.position ??= {}).y = y;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.y) {
											frame.position.y = -frame.position.y;
										}
									});
								}
							});
						}
					});

				return json;
			});
		},
		mirror_z() {
			this.modifier((json) => {
				const node_list = this.get_editing_nodes(json);

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = levelNodeData(node);

						const z = -object.initialPosition.z;
						object.position.z = z;
						object.initialPosition.z = z;
						(data.position ??= {}).z = z;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.z) {
											frame.position.z = -frame.position.z;
										}
									});
								}
							});
						}
					});

				return json;
			});
		},
		pointerdown(e: PointerEvent) {
			if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

			this.is_touch_interaction = true;
			this.hold.x = e.clientX;
			this.hold.y = e.clientY;

			clearTimeout(this.hold.timeout);

			this.hold.timeout = setTimeout(() => {
				if (this.is_touch_interaction) {
					this.is_touch_interaction = false;
					this.contextmenu = undefined;
					this.contextmenu_position.x = this.hold.x;
					this.contextmenu_position.y = this.hold.y;
					const menu = this.build_context_menu(this.hold.x, this.hold.y);
					if (menu) this.contextmenu = menu;
				}
			}, 600);
		},
		pointerup(e: PointerEvent) {
			if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
			this.is_touch_interaction = false;
			clearTimeout(this.hold.timeout);
		},
		pointercancel(_: PointerEvent) {
			this.is_touch_interaction = false;
			clearTimeout(this.hold.timeout);
		},
		pointermove(e: PointerEvent) {
			if (this.active_tool?.on_mouse_move?.(e)) return;

			const dx = Math.abs(e.clientX - this.hold.x);
			const dy = Math.abs(e.clientY - this.hold.y);

			if (dx > 10 || dy > 10) {
				clearTimeout(this.hold.timeout);
			}
		},
		rightmousedown(e: MouseEvent) {
			if (this.active_tool?.on_contextmenu?.(e)) return;
			e.preventDefault();
			this.contextmenu = undefined;
			const menu = this.build_context_menu(e.clientX, e.clientY);
			if (this.is_touch_interaction) {
				this.is_touch_interaction = false;
				clearTimeout(this.hold.timeout);
				if (menu) {
					this.contextmenu = menu;
					this.contextmenu_position.x = e.clientX;
					this.contextmenu_position.y = e.clientY;
				}
			} else if (this.mouseup_fired) {
				// windows/linux: mouseup already fired
				if (!this.right_click_dragged && menu) {
					this.contextmenu = menu;
					this.contextmenu_position.x = e.clientX;
					this.contextmenu_position.y = e.clientY;
				}
				this.mouseup_fired = false;
			} else if (menu) {
				// macos: mouseup not fired yet
				this.deferred_context_menu = {
					x: e.clientX,
					y: e.clientY,
					menu,
				};
			}
		},
		run_in_scope(func: (scope: never) => void) {
			func(this as never);
		},
	},
});
</script>

<template>
	<ResizableColPanel ref="resize">
		<template #first>
			<section
				:ref="'viewport'"
				class="viewport"
				@mousedown="mousedown"
				@mouseup="mouseup"
				@contextmenu="rightmousedown"
				@pointerdown="pointerdown"
				@pointerup="pointerup"
				@pointercancel="pointercancel"
				@pointermove="pointermove"
			>
				<ContextMenu
					v-if="contextmenu"
					:ref="'contextmenu'"
					:menu="contextmenu"
					:style="`top: ${contextmenu_position.y}px; left: ${contextmenu_position.x}px;`"
					@close="close_context_menu"
				/>
				<GASMPanel
					v-show="show_gasm_editor"
					ref="gasm_editor"
					class="gasm-editor"
					@set="save_gasm_code"
				/>
				<button
					v-show="show_gasm_editor"
					class="close-gasm-editor"
					@click="close_gasm_editor"
				>
					Save
				</button>
				<JsonPanel
					v-show="show_mini_editor"
					ref="mini_editor"
					:mini="true"
					class="mini-editor"
				/>
				<button
					v-show="show_mini_editor"
					class="close-mini-editor"
					@click="close_mini_editor"
				>
					Save
				</button>
				<div v-show="group_depth" class="group-depth">
					<span>Depth: {{ group_depth }}</span>
				</div>
				<div v-show="active_tool" class="tool-indicator">
					<span>
						{{ active_tool?.name }} active
						<KeyHint :bind="'Esc'" />
					</span>
				</div>
				<div class="modes">
					<div>
						<label for="modes-translate">
							<TranslateIcon />
							<KeyHint v-show="show_key_hints" :bind="'T'" />
						</label>
						<input
							id="modes-translate"
							type="checkbox"
							:checked="transform_mode === 'translate'"
							@click="transform_mode_event"
						/>
					</div>
					<div>
						<label for="modes-rotate">
							<RotateIcon />
							<KeyHint v-show="show_key_hints" :bind="'R'" />
						</label>
						<input
							id="modes-rotate"
							type="checkbox"
							:checked="transform_mode === 'rotate'"
							@click="transform_mode_event"
						/>
					</div>
					<div>
						<label for="modes-scale">
							<ScaleIcon />
							<KeyHint v-show="show_key_hints" :bind="'E'" />
						</label>
						<input
							id="modes-scale"
							type="checkbox"
							:checked="transform_mode === 'scale'"
							@click="transform_mode_event"
						/>
					</div>
					<div>
						<label for="modes-one_sided">
							<OneSidedScaleIcon />
							<KeyHint v-show="show_key_hints" :bind="'F'" />
						</label>
						<input
							id="modes-one_sided"
							type="checkbox"
							:checked="transform_mode === 'one_sided'"
							@click="transform_mode_event"
						/>
					</div>
					<div>
						<label for="space">
							<SpaceIcon />
							<KeyHint v-show="show_key_hints" :bind="'Q'" />
						</label>
						<input
							id="space"
							type="checkbox"
							:checked="transform_space === 'world'"
							@click="toggle_transform_space"
						/>
					</div>
				</div>
				<div class="controls">
					<div>
						<label for="controls-mouse-zoom" title="toggle zoom to cursor position">
							<CursorIcon />
						</label>
						<input
							id="controls-mouse-zoom"
							type="checkbox"
							:checked="zoom_to_cursor"
							@change="zoomToCursorChange"
						/>
					</div>
					<div>
						<label for="controls-wasd" title="toggle keyboard movement controls">
							<KeyboardIcon />
						</label>
						<input
							id="controls-wasd"
							type="checkbox"
							:checked="free_movement"
							@change="toggleControls"
						/>
					</div>
				</div>
				<transition name="slide-up">
					<div v-if="show_keybinds" class="hints">
						<div><KeyHint :bind="'Scroll'" />Zoom</div>
						<div><KeyHint :bind="'Shift'" />Multi select</div>
						<div><KeyHint :bind="'Left'" />Pan & Select</div>
						<div><KeyHint :bind="'Right'" />Orbit</div>
						<div><KeyHint :bind="'Shift'" />Sprint</div>
						<div><KeyHint :bind="'WASD'" />Move</div>
						<div><KeyHint :bind="'EQ'" />Up & Down</div>
						<div><KeyHint :bind="'Up'" />Enter Group</div>
						<div><KeyHint :bind="'Down'" />Exit Group</div>
						<div><KeyHint :bind="'↑ G'" />Ungroup</div>
						<div><KeyHint :bind="'G'" />Group</div>
						<div><KeyHint :bind="'C'" />Clone</div>
						<div><KeyHint :bind="'X'" />Delete</div>
					</div>
				</transition>
			</section>
		</template>
		<template #second>
			<AnimationPanel ref="animation_panel" @scope="run_in_scope" />
		</template>
	</ResizableColPanel>
</template>

<style scoped>
.controls,
.modes {
	& > div:has(input:checked) > label span {
		color: var(--text-color-accent);
	}
}
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(20px);
}

.slide-up-leave-from,
.slide-up-enter-to {
	opacity: 1;
	transform: translateY(0);
}

.mini-editor,
.gasm-editor {
	position: absolute;
	z-index: 1;
}
.close-mini-editor,
.close-gasm-editor {
	position: absolute;
	z-index: 1;
	top: 0.5rem;
	right: 0.5rem;
	background-color: var(--red);
	border-radius: 0.5rem;
	cursor: pointer;
	padding: 0.5rem 0.8rem;
	color: white;
}
.viewport,
canvas {
	width: 100%;
	height: 100%;
	outline: none;
	-webkit-user-select: none;
	user-select: none;
}
.viewport {
	position: relative;
}
.group-depth {
	position: absolute;
	left: 50%;
	top: 0.5rem;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
}
.controls,
.modes {
	position: absolute;
	right: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	* {
		cursor: pointer;
	}

	label {
		padding: 0.3rem;
		display: flex;
		position: relative;

		&:hover > i {
			display: block !important; /* to override v-show */
		}
	}

	> div {
		background-color: #141415;
		border-radius: 0.5rem;

		&:hover {
			background-color: #242425;
		}
	}

	input {
		display: none;
	}
}
.modes {
	top: 0.5rem;
}
.controls {
	bottom: 0.5rem;
}
.hints {
	position: absolute;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	top: 0.5rem;
	left: 0.5rem;
	pointer-events: none;

	div {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	i {
		position: static;
	}
}

.tool-indicator {
	position: absolute;
	left: 50%;
	top: 0.5rem;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	padding: 0.25rem 1rem;
	font-size: 0.85rem;
	z-index: 2;
	pointer-events: none;
	background-color: #141415;
	border-radius: 0.5rem;

	.key-hint {
		right: -0.5rem;
		left: unset;
	}
}
</style>
