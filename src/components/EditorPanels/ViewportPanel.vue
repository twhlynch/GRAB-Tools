<script>
import { LevelLoader } from '../../../src/assets/LevelLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FreeControls } from '@/assets/FreeControls.js';
import encoding from '@/assets/tools/encoding.js';
import CursorIcon from '@/icons/CursorIcon.vue';
import KeyboardIcon from '@/icons/KeyboardIcon.vue';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { useConfigStore } from '@/stores/config.js';
import TranslateIcon from '@/icons/TranslateIcon.vue';
import RotateIcon from '@/icons/RotateIcon.vue';
import ScaleIcon from '@/icons/ScaleIcon.vue';
import SpaceIcon from '@/icons/SpaceIcon.vue';
import group from '@/assets/tools/group.js';
import ContextMenu from '@/components/EditorPanels/ContextMenu.vue';
import levelNodes from '@/assets/tools/nodes.js';
import JsonPanel from './JsonPanel.vue';

export default {
	data() {
		return {
			zoom_to_cursor: true,
			free_movement: false,
			editing: null,
			dragging: false,
			huge_far: false,
			show_groups: false, // TODO:
			show_animations: false,
			show_triggers: true,
			show_sound: true,
			show_trigger_connections: false,
			show_fog: true,
			show_sky: true,
			transform_mode: 'translate',
			transform_space: 'local',
			contextmenu: undefined,
			contextmenu_position: { x: 0, y: 0 },
			is_animating: true,
			show_mini_editor: false,
		};
	},
	components: {
		CursorIcon,
		KeyboardIcon,
		TranslateIcon,
		RotateIcon,
		ScaleIcon,
		SpaceIcon,
		ContextMenu,
		JsonPanel,
	},
	emits: ['changed', 'modifier'],
	async mounted() {
		if (!window._levelLoader) window._levelLoader = new LevelLoader();

		const configStore = useConfigStore();
		const config = configStore.editor_config;
		if (config) {
			Object.entries(config).forEach((entry) => {
				this[entry[0]] = entry[1];
			});
		}

		this.setup_renderer();
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === this.$refs.viewport) {
					const { width, height } = entry.contentRect;
					this.resize(width, height);
					break;
				}
			}
		});
		observer.observe(this.$refs.viewport);
		window.addEventListener('keydown', this.keydown);
		await this.set_json(this.json);
	},
	unmounted() {
		window.removeEventListener('keydown', this.keydown);
	},
	methods: {
		update_node_shader(object) {
			if (!object) return;

			if (object?.material?.uniforms?.worldMatrix) {
				object.material.uniforms.worldMatrix = {
					value: new THREE.Matrix4().copy(object.matrixWorld),
				};
			}

			let targetVector = new THREE.Vector3();
			let targetQuaternion = new THREE.Quaternion();
			let worldMatrix = new THREE.Matrix4();
			worldMatrix.compose(
				object.getWorldPosition(targetVector),
				object.getWorldQuaternion(targetQuaternion),
				object.getWorldScale(targetVector),
			);

			let normalMatrix = new THREE.Matrix3();
			normalMatrix.getNormalMatrix(worldMatrix);

			if (object?.material?.uniforms?.worldNormalMatrix) {
				object.material.uniforms.worldNormalMatrix = {
					value: normalMatrix,
				};
			}
		},
		setup_renderer() {
			// renderer
			THREE.ColorManagement.enabled = true;
			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				preserveDrawingBuffer: true,
			});
			this.renderer.setSize(
				this.$refs.viewport.clientWidth,
				this.$refs.viewport.clientHeight,
			);
			this.renderer.outputColorSpace = THREE.SRGBColorSpace;
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setClearColor(
				// new THREE.Color(143.0 / 255.0, 182.0 / 255.0, 221.0 / 255.0),
				new THREE.Color(28 / 255.0, 28 / 255.0, 36 / 255.0),
				1.0,
			);
			this.renderer.setAnimationLoop(this.animation);
			this.$refs.viewport.appendChild(this.renderer.domElement);
			// scene
			this.clock = new THREE.Clock();
			this.scene = new THREE.Scene();
			this.camera = new THREE.PerspectiveCamera(
				70,
				this.$refs.viewport.clientWidth /
					this.$refs.viewport.clientHeight,
				0.1,
				10000,
			);
			this.camera.position.set(0, 10, 10);
			// controls
			this.controls = new OrbitControls(
				this.camera,
				this.renderer.domElement,
			);
			this.controls.zoomToCursor = this.zoom_to_cursor;
			this.controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
			this.transform_controls = new TransformControls(
				this.camera,
				this.renderer.domElement,
			);
			// editing
			this.transform_controls.addEventListener(
				'change',
				this.selected_event,
			);
			this.transform_controls.addEventListener(
				'dragging-changed',
				this.edit_event,
			);
			this.renderer.domElement.addEventListener(
				'click',
				this.select_event,
			);
		},
		selected_event(e) {
			if (e.target.object) {
				if (this.editing?.uuid !== e.target.object.uuid) {
					this.is_animating = false;
					this.reset_node_positions();
				}
			} else if (this.editing) {
				this.is_animating = true;
			}
			this.editing = e.target.object;
			if (this.editing) {
				this.update_node_shader(this.editing);
				this.validate_node(this.editing);
				this.update_animation_path_position(this.editing);
				this.update_trigger_path_positions([this.editing]);
			}
		},
		reset_node_positions() {
			this.level.meta.time = 0;
			this.level.nodes.animated.forEach((node) => {
				node.userData.currentFrameIndex = 0;
				node.quaternion.copy(node.initialRotation);
				node.position.copy(node.initialPosition);
			});
		},
		validate_node(object) {
			const node = object?.userData?.node;
			const axis = this.transform_controls.axis;
			if (!node || !axis) return;
			const mode = this.transform_mode;
			const override_axis = axis.charAt(0).toLowerCase();

			if (node.levelNodeStart || node.levelNodeFinish) {
				if (mode === 'rotate') {
					object.quaternion.x = 0;
					object.quaternion.z = 0;
				} else if (mode === 'scale') {
					object.scale.z = object.scale[override_axis];
					object.scale.x = object.scale[override_axis];
					object.scale.y = 1;
				}
			}
			if (node.levelNodeSign) {
				if (node.levelNodeSign.hideModel) {
					if (mode === 'scale') {
						object.scale.x = object.scale[override_axis];
						object.scale.y = object.scale[override_axis];
						object.scale.z = object.scale[override_axis];
					}
				} else {
					if (mode === 'scale') {
						object.scale.x = 1;
						object.scale.y = 1;
						object.scale.z = 1;
					}
				}
			}
			if (node.levelNodeSound) {
				if (mode === 'scale') {
					object.scale.x = 1;
					object.scale.y = 1;
					object.scale.z = 1;
				} else if (mode === 'rotate') {
					object.quaternion.x = 0;
					object.quaternion.y = 0;
					object.quaternion.z = 0;
					object.quaternion.w = 1;
				}
			}
			object.quaternion.normalize();
		},
		edit_event(e) {
			this.controls.enabled = !e.value;
			if (e.value) return;
			if (!this.editing) return;
			this.dragging = true;
			this.validate_node(this.editing);
			const entries = Object.entries(this.editing.userData.node);
			const node = entries.find((e) => e[0].includes('levelNode'))[1];
			if (node.position) {
				node.position.x = this.editing.position.x;
				node.position.y = this.editing.position.y;
				node.position.z = this.editing.position.z;
			}
			if (node.scale && typeof node.scale === 'object') {
				node.scale.x = Math.abs(this.editing.scale.x);
				node.scale.y = Math.abs(this.editing.scale.y);
				node.scale.z = Math.abs(this.editing.scale.z);
			}
			if (node.scale && typeof node.scale === 'number') {
				node.scale = Math.abs(this.editing.scale.x);
			}
			if (node.radius) {
				node.radius = Math.abs(this.editing.scale.x) / 2;
			}
			if (node.rotation) {
				node.rotation.x = this.editing.quaternion.x;
				node.rotation.y = this.editing.quaternion.y;
				node.rotation.z = this.editing.quaternion.z;
				node.rotation.w = this.editing.quaternion.w;
			}
			this.editing.initialPosition.copy(this.editing.position);
			this.editing.initialRotation.copy(this.editing.quaternion);
			this.update_node_shader(this.editing);
			this.update_trigger_path_positions([this.editing]);
			this.changed();
		},
		cast_for_node(x, y) {
			if (!this.level) return;
			const canvasSize = this.renderer.domElement.getBoundingClientRect();
			const mouse = {
				x: ((x - canvasSize.left) / canvasSize.width) * 2 - 1,
				y: -((y - canvasSize.top) / canvasSize.height) * 2 + 1,
			};
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, this.camera);
			let individualObjects = this.level.nodes.all.filter(
				(node) => !node.isGroup && node.visible,
			);
			let intersects = raycaster.intersectObjects(
				individualObjects,
				true,
			);
			let intersect = undefined;
			if (intersects.length) {
				intersect = intersects[0].object;
				while (intersect.parent !== this.level.scene) {
					intersect = intersect.parent;
				}
			}
			return intersect;
		},
		select_event(e) {
			if (this.free_movement) return;
			const intersect = this.cast_for_node(e.clientX, e.clientY);
			if (intersect && intersect !== this.editing) {
				this.transform_controls.attach(intersect);
				this.scene.add(this.transform_controls);
			} else {
				if (!this.dragging) {
					this.transform_controls.detach();
				}
			}
			this.dragging = false;
		},
		async set_json(json) {
			if (!json) return;
			this.transform_controls.detach();
			if (this.level) {
				this.scene.remove(this.level.scene);
				this.level.scene.traverse((obj) => {
					if (obj.geometry) obj.geometry.dispose();
					if (obj.material) {
						if (Array.isArray(obj.material)) {
							obj.material.forEach((m) => m.dispose());
						} else obj.material.dispose();
					}
					if (obj.texture) obj.texture.dispose();
					if (obj.children) obj.children.length = 0;
				});
			}
			window._levelLoader.config({
				sky: this.show_sky,
				lights: true,
				text: true,
				triggers: this.show_triggers,
				sound: this.show_sound,
				sublevels: true,
				static: false,
				fog: this.show_fog,
			});
			this.level = await window._levelLoader.load(json, true);
			this.add_trigger_connections();
			this.add_animation_paths();
			this.scene.add(this.level.scene);
			console.log(this.level);
		},
		changed() {
			this.level.level.complexity = this.level.complexity;
			this.level.level.formatVersion = this.$config.FORMAT_VERSION;
			this.$emit('changed');
		},
		modifier(func) {
			this.$emit('modifier', func);
		},
		resize(width, height) {
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();

			this.renderer.setSize(width, height);
			this.renderer.render(this.scene, this.camera);
		},
		animation() {
			const delta = this.clock.getDelta();
			if (!this.level) return;

			if (this.is_animating) {
				this.level.update(delta);
				this.update_trigger_path_positions(this.level.nodes.animated);
			}
			this.controls.update(delta);
			this.renderer.render(this.scene, this.camera);
		},
		zoomToCursorChange(e) {
			this.controls.zoomToCursor = this.zoom_to_cursor = e.target.checked;
		},
		toggleControls(e) {
			this.controls.dispose();
			this.free_movement = e.target.checked;

			if (e.target.checked) {
				// FIXME: burh
				const direction = new THREE.Vector3();
				this.camera.getWorldDirection(direction);
				const yaw = Math.atan2(direction.x, direction.z);
				const pitch = Math.asin(-direction.y);
				this.controls = new FreeControls(
					this.camera,
					this.renderer.domElement,
				);
				this.controls.eulerVector.set(pitch, yaw, 0);
				this.transform_controls.detach();
			} else {
				const direction = new THREE.Vector3();
				this.camera.getWorldDirection(direction);
				const look_at = new THREE.Vector3().addVectors(
					this.camera.position,
					direction.multiplyScalar(1),
				);
				this.controls = new OrbitControls(
					this.camera,
					this.renderer.domElement,
				);
				this.controls.zoomToCursor = this.zoom_to_cursor;
				this.controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
				this.controls.target.copy(look_at);
			}
		},
		mousedown(e) {
			if (
				e.target !== this.$refs.contextmenu &&
				!this.$refs.contextmenu?.$el?.contains(e.target)
			) {
				this.contextmenu = undefined;
			}
			if (e.target === this.renderer.domElement) {
				this.controls.isMouseActive = true;
			}
		},
		mouseup(e) {
			this.controls.isMouseActive = false;
		},
		set_transform_mode(mode) {
			this.transform_mode = mode;
			this.transform_controls.setMode(this.transform_mode);
		},
		transform_mode_event(e) {
			const mode = e.target.id.split('-')[1];
			this.set_transform_mode(mode);
			e.target.checked = true;
		},
		toggle_transform_space(_) {
			this.transform_controls.setSpace(
				this.transform_controls.space === 'local' ? 'world' : 'local',
			);
			this.transform_space = this.transform_controls.space;
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
				show_trigger_connections: this.show_trigger_connections,
				show_fog: this.show_fog,
				show_sky: this.show_sky,
			};
			const configStore = useConfigStore();
			configStore.editor_config = config;
		},
		toggle_sky() {
			this.show_sky = !this.show_sky;
			const sky = this.level.scene.children.find((obj) => obj.isSky);
			if (sky) sky.visible = this.show_sky;
		},
		toggle_trigger_connections() {
			this.show_trigger_connections = !this.show_trigger_connections;
			this.update_connection_visibility();
			this.update_trigger_path_positions();
		},
		toggle_animations() {
			this.show_animations = !this.show_animations;
			this.update_animation_visibility();
		},
		update_animation_visibility() {
			this.level.nodes.animated.forEach((object) => {
				object.userData.animation_paths.forEach((path) => {
					path.visible = this.show_animations;
				});
			});
		},
		update_connection_visibility() {
			this.level.nodes.levelNodeTrigger.forEach((trigger) => {
				trigger.userData.trigger_paths.forEach((path) => {
					path.visible = this.show_trigger_connections;
				});
			});
		},
		add_trigger_connections() {
			if (this.level.nodes.levelNodeTrigger?.length) {
				this.level.nodes.levelNodeTrigger.forEach((object) => {
					const node = object.userData.node.levelNodeTrigger;
					const targets = node.triggerTargets;
					if (!targets) return;

					const ids = [];
					targets.forEach((target) => {
						const entries = Object.entries(target);
						const entry = entries.find((e) =>
							e[0].includes('triggerTarget'),
						);
						if (!entry) return;
						const connection = entry[1];
						const objectID = connection.objectID;
						if (objectID) ids.push(objectID);
					});
					ids.forEach((id) => {
						const target = this.level.nodes.all[id - 1];
						if (!target) return;
						this.add_trigger_path(object, target);
					});
				});
			}
		},
		add_animation_paths() {
			if (this.level.nodes?.animated?.length) {
				this.level.nodes.animated.forEach((object) => {
					this.add_animation_path(object);
				});
			}
		},
		add_animation_path(object) {
			const path_material = new THREE.LineBasicMaterial({
				color: 0x0000ff,
			});
			const points_material = new THREE.PointsMaterial({
				color: 0x0000ff,
				size: 3,
				sizeAttenuation: false,
			});

			const position = new THREE.Vector3();
			object.getWorldPosition(position);

			const points = object.userData.node.animations[0].frames.map(
				(frame) =>
					new THREE.Vector3(
						frame.position?.x ?? 0,
						frame.position?.y ?? 0,
						frame.position?.z ?? 0,
					),
			);

			const line_geometry = new THREE.BufferGeometry().setFromPoints(
				points,
			);
			const path_line = new THREE.Line(line_geometry, path_material);
			const points_line = new THREE.Points(
				line_geometry,
				points_material,
			);
			const path_group = new THREE.Group();
			path_group.add(path_line);
			path_group.add(points_line);

			path_group.visible = this.show_animations;
			(object.userData.animation_paths ??= []).push(path_group);
			path_group.userData.object = object;

			(object.userData.relevant_animation_paths ??= []).push(path_group);

			object.parent.add(path_group);

			this.update_animation_path_position(object);
		},
		object_contains(object, child) {
			let current = child.parent;
			while (current) {
				if (current === object) return true;
				current = current.parent;
			}
			return false;
		},
		update_animation_path_position(object) {
			object?.userData?.relevant_animation_paths?.forEach((path) => {
				path.position.copy(path.userData.object.position);
				path.quaternion.copy(path.userData.object.quaternion);
			});
		},
		update_trigger_path_positions(related_objects = undefined) {
			if (!this.show_trigger_connections) return;

			if (related_objects === undefined)
				related_objects = this.level.nodes?.levelNodeTrigger ?? [];

			const lines = [];
			related_objects.forEach((obj) => {
				if (obj.userData?.relevant_connections?.length) {
					obj.userData?.relevant_connections.forEach((line) => {
						lines.push(line);
					});
				}
			});

			const unique_lines = [...new Set(lines)];
			unique_lines.forEach((line) => {
				const path_target = line.userData.object;
				const path_trigger = line.userData.trigger;

				const trigger_position = new THREE.Vector3();
				path_trigger.getWorldPosition(trigger_position);
				const position = new THREE.Vector3();
				path_target.getWorldPosition(position);

				const points = [trigger_position, position];
				line.geometry = new THREE.BufferGeometry().setFromPoints(
					points,
				);
			});
		},
		add_trigger_path(trigger, object) {
			const path_material = new THREE.LineBasicMaterial({
				color: 0xff8800,
			});

			const trigger_position = new THREE.Vector3();
			trigger.getWorldPosition(trigger_position);

			const position = new THREE.Vector3();
			object.getWorldPosition(position);
			const points = [trigger_position, position];

			const line_geometry = new THREE.BufferGeometry().setFromPoints(
				points,
			);
			const line = new THREE.Line(line_geometry, path_material);
			line.visible = this.show_trigger_connections;
			line.userData.trigger = trigger;
			line.userData.object = object;
			(trigger.userData.trigger_paths ??= []).push(line);
			if (!trigger.userData.relevant_connections) {
				trigger.userData.relevant_connections = [];
			}
			trigger.userData.relevant_connections.push(line);
			let current = object;
			while (current?.userData?.node) {
				if (!current.userData.relevant_connections) {
					current.userData.relevant_connections = [];
				}
				current.userData.relevant_connections.push(line);
				current = current.parent;
			}
			current = trigger;
			while (current?.userData?.node) {
				if (!current.userData.relevant_connections) {
					current.userData.relevant_connections = [];
				}
				current.userData.relevant_connections.push(line);
				current = current.parent;
			}

			this.level.scene.add(line);
		},
		clone_selection() {
			if (!this.editing) return;
			this.modifier((json) => {
				// TODO: decent deepclone method
				json.levelNodes.push(
					JSON.parse(JSON.stringify(this.editing.userData.node)),
				);
				return json;
			});
		},
		delete_selection() {
			if (!this.editing) return;
			this.modifier((json) => {
				json.levelNodes = json.levelNodes.filter(
					(n) =>
						n !==
						this.level.nodes.all[this.editing.userData.id - 1]
							.userData.node,
				);
				return json;
			});
		},
		group_selection() {
			if (!this.editing) return;
			this.modifier((json) => {
				json.levelNodes = json.levelNodes.filter(
					(n) =>
						n !==
						this.level.nodes.all[this.editing.userData.id - 1]
							.userData.node,
				);
				json.levelNodes.push(
					group.groupNodes([this.editing.userData.node]),
				);
				return json;
			});
		},
		keydown(e) {
			switch (e.code) {
				case 'KeyQ':
					this.toggle_transform_space();
					break;

				case 'KeyE':
					this.set_transform_mode('scale');
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
					this.group_selection();
					break;

				case 'Escape':
					this.contextmenu = undefined;
					this.close_mini_editor();
					break;

				default:
					break;
			}
		},
		close_mini_editor() {
			if (this.show_mini_editor)
				this.mini_editor_changed(this.$refs.mini_editor.json);
			this.show_mini_editor = false;
		},
		add_animation_target(node = undefined) {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			const target = levelNodes.triggerTargetAnimation();
			const id = node?.userData?.id ?? 0;
			target.triggerTargetAnimation.objectID = id;
			trigger.triggerTargets.push(target);
			this.changed();
			const target_object = this.level.nodes.all[id - 1];
			if (!target_object) return;
			this.add_trigger_path(this.editing, target_object);
			this.update_connection_visibility();
		},
		add_sublevel_target() {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(levelNodes.triggerTargetSubLevel());
			this.changed();
		},
		add_ambience_target() {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(levelNodes.triggerTargetAmbience());
			this.changed();
		},
		add_sound_target() {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(levelNodes.triggerTargetSound());
			this.changed();
			this.update_connection_visibility();
		},
		add_trigger_source() {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(levelNodes.triggerSourceBasic());
			this.changed();
		},
		add_trigger_blocks_source() {
			if (!this.editing?.userData?.node?.levelNodeTrigger) return;
			const trigger = this.editing.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(levelNodes.triggerSourceBlockNames());
			this.changed();
		},
		add_animation() {
			if (!this.editing?.userData?.node) return;
			const node = this.editing.userData.node;
			(node.animations ??= []).push(levelNodes.animation());
			this.changed();
		},
		edit_object_json(object = undefined) {
			if (!object) object = this.editing;
			if (!object) return;

			this.show_mini_editor = true;
			this.$refs.mini_editor.set_json(object.userData.node);
		},
		mini_editor_changed(new_node) {
			const id = this.editing?.userData?.id;
			if (!id) {
				window.toast('Failed to write node', 'error');
				return;
			}
			this.modifier((json) => {
				console.log(json);
				const index = json.levelNodes.findIndex(
					(n) => n === this.level.nodes.all[id - 1].userData.node,
				);
				if (index !== -1) {
					json.levelNodes[index] = new_node;
				}
				return json;
			});
		},
		open_context_menu(e) {
			if (e.target === this.renderer.domElement) {
				this.contextmenu_position.x = e.clientX;
				this.contextmenu_position.y = e.clientY;
				this.contextmenu = undefined;
				const intersect = this.cast_for_node(e.clientX, e.clientY);
				if (
					intersect &&
					this.editing &&
					intersect.uuid === this.editing.uuid
				) {
					this.contextmenu = {
						'Edit JSON': {
							func: this.edit_object_json,
						},
						Delete: {
							func: this.delete_selection,
						},
						Clone: {
							func: this.clone_selection,
						},
						Group: {
							func: this.group_selection,
						},
						'Add Animation': {
							func: this.add_animation,
						},
						'Copy ID': {
							func: this.copy_editing_id,
						},
					};
					if (this.editing.userData?.node?.levelNodeTrigger) {
						this.contextmenu['Add Target'] = {
							Animation: {
								func: this.add_animation_target,
							},
							SubLevel: {
								func: this.add_sublevel_target,
							},
							Ambience: {
								func: this.add_ambience_target,
							},
							Sound: {
								func: this.add_sound_target,
							},
						};
						this.contextmenu['Add Source'] = {
							Basic: {
								func: this.add_trigger_source,
							},
							Blocks: {
								func: this.add_trigger_blocks_source,
							},
						};
					}
				}
				if (
					intersect &&
					this.editing &&
					this.editing.userData?.node?.levelNodeTrigger
				) {
					this.contextmenu = this.contextmenu ?? {};
					this.contextmenu['Add as Target'] = {
						func: () => {
							this.add_animation_target(intersect);
						},
					};
				}
				if (this.contextmenu) e.preventDefault();
			}
		},
		copy_editing_id() {
			const id = this.editing?.userData?.id;
			if (id === undefined) window.toast('failed to get id', 'error');
			else navigator.clipboard.writeText(id);
		},
		close_context_menu() {
			this.contextmenu = undefined;
		},
		teleport_start() {
			if (this?.level?.nodes?.defaultSpawn) {
				const position = new THREE.Vector3();
				this.level.nodes.defaultSpawn.getWorldPosition(position);
				this.camera.position.set(
					position.x,
					position.y + 1,
					position.z + 1,
				);
				this.controls.target?.set(position.x, position.y, position.z);
				this.camera.lookAt(position.x, position.y, position.z);
			}
		},
		teleport_finish() {
			if (this?.level?.nodes?.levelNodeFinish?.length) {
				const position = new THREE.Vector3();
				this.level.nodes.levelNodeFinish[0].getWorldPosition(position);
				this.camera.position.set(
					position.x,
					position.y + 1,
					position.z + 1,
				);
				this.controls.target?.set(position.x, position.y, position.z);
				this.camera.lookAt(position.x, position.y, position.z);
			}
		},
		teleport_origin() {
			this.camera.position.set(0, 1, 1);
			this.controls.target?.set(0, 0, 0);
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

			const center = new THREE.Vector3()
				.addVectors(max, min)
				.divideScalar(2);
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
			this.controls.target.copy(center);
			this.camera.lookAt(center);
		},
	},
};
</script>

<template>
	<section
		:ref="'viewport'"
		class="viewport"
		@mousedown="mousedown"
		@mouseup="mouseup"
		@contextmenu="open_context_menu"
	>
		<ContextMenu
			v-if="contextmenu"
			:ref="'contextmenu'"
			:menu="contextmenu"
			:style="`top: ${contextmenu_position.y}px; left: ${contextmenu_position.x}px;`"
			@click="close_context_menu"
		/>
		<JsonPanel
			:mini="true"
			ref="mini_editor"
			v-show="show_mini_editor"
			class="mini-editor"
		/>
		<button
			class="close-mini-editor"
			@click="close_mini_editor"
			v-show="show_mini_editor"
		>
			Save
		</button>
		<div class="modes">
			<div>
				<label for="modes-translate">
					<TranslateIcon />
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
				</label>
				<input
					id="modes-scale"
					type="checkbox"
					:checked="transform_mode === 'scale'"
					@click="transform_mode_event"
				/>
			</div>
			<div>
				<label for="space">
					<SpaceIcon />
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
				<label
					for="controls-mouse-zoom"
					title="toggle zoom to cursor position"
				>
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
				<label
					for="controls-wasd"
					title="toggle keyboard movement controls"
				>
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
	</section>
</template>

<style>
.controls,
.modes {
	& > div:has(input:checked) > label svg {
		color: var(--text-color-accent);
	}
}
</style>
<style scoped>
.mini-editor {
	position: absolute;
	z-index: 1;
}
.close-mini-editor {
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
}
.viewport {
	position: relative;
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
</style>
