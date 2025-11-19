<script>
import { LevelLoader } from '../../../src/assets/LevelLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FreeControls } from '@/assets/FreeControls.js';
import encoding from '@/assets/tools/encoding.js';
import CursorIcon from '@/icons/CursorIcon.vue';
import KeyboardIcon from '@/icons/KeyboardIcon.vue';
import GizmoControls from '@/assets/GizmoControls.js';
import { useConfigStore } from '@/stores/config.js';
import TranslateIcon from '@/icons/TranslateIcon.vue';
import RotateIcon from '@/icons/RotateIcon.vue';
import ScaleIcon from '@/icons/ScaleIcon.vue';
import SpaceIcon from '@/icons/SpaceIcon.vue';
import group from '@/assets/tools/group.js';
import ContextMenu from '@/components/EditorPanels/ContextMenu.vue';
import JsonPanel from './JsonPanel.vue';
import AnimationPanel from '@/components/EditorPanels/AnimationPanel.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';

export default {
	data() {
		return {
			zoom_to_cursor: true,
			free_movement: false,
			editing_json: undefined,
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
		AnimationPanel,
		ResizableColPanel,
	},
	emits: ['changed', 'modifier', 'scope'],
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

		this.$refs.resize.size(
			this.$refs.resize.$el.getBoundingClientRect().bottom - 30 - 5,
		);
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

			if (object.children?.length) {
				object.children.forEach(this.update_node_shader);
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
			this.renderer.domElement.tabIndex = 0;
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
			// editing
			this.gizmo = new GizmoControls(
				this.camera,
				this.renderer.domElement,
				this.scene,
				this.moving_event,
				this.edit_event,
			);
			this.gizmo.set_mode(this.transform_mode);
			this.gizmo.set_space(this.transform_space);
			this.renderer.domElement.addEventListener(
				'click',
				this.select_event,
			);
		},
		moving_event(e) {
			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				this.validate_node(object);
				this.update_animation_path_position(object);
			});
			this.update_trigger_path_positions(this.gizmo.selection);
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
			const axis = this.gizmo.controls.axis;
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
			if (this.gizmo.empty()) return;
			this.dragging = true;
			this.gizmo.selection.forEach((object) => {
				this.validate_node(object);

				const world_pos = new THREE.Vector3();
				const world_quat = new THREE.Quaternion();
				const world_scale = new THREE.Vector3();
				object.updateMatrixWorld(true);
				object.getWorldPosition(world_pos);
				object.getWorldQuaternion(world_quat);
				object.getWorldScale(world_scale);

				const entries = Object.entries(object.userData.node);
				const node = entries.find((e) => e[0].includes('levelNode'))[1];

				if (node.position) {
					node.position.x = world_pos.x;
					node.position.y = world_pos.y;
					node.position.z = world_pos.z;
				}
				if (node.scale && typeof node.scale === 'object') {
					node.scale.x = Math.abs(world_scale.x);
					node.scale.y = Math.abs(world_scale.y);
					node.scale.z = Math.abs(world_scale.z);
				}
				if (node.scale && typeof node.scale === 'number') {
					node.scale = Math.abs(world_scale.x);
				}
				if (node.radius) {
					node.radius = Math.abs(world_scale.x) / 2;
				}
				if (node.rotation) {
					node.rotation.x = world_quat.x;
					node.rotation.y = world_quat.y;
					node.rotation.z = world_quat.z;
					node.rotation.w = world_quat.w;
				}
				object.initialPosition.copy(world_pos);
				object.initialRotation.copy(world_quat);
				this.update_node_shader(object);
			});
			this.update_trigger_path_positions(this.gizmo.selection);
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
				while (
					intersect.parent !== this.level.scene &&
					intersect.parent !== this.gizmo.group
				) {
					intersect = intersect.parent;
				}
			}
			return intersect;
		},
		select_event(e) {
			if (this.free_movement) return;
			const intersect = this.cast_for_node(e.clientX, e.clientY);
			if (intersect) {
				if (!this.gizmo.includes(intersect)) {
					if (!e.shiftKey) {
						this.gizmo.clear(this.level.scene);
					}

					if (this.is_animating) this.reset_node_positions();
					this.gizmo.add(intersect);
					this.is_animating = false;
				} else {
					if (e.shiftKey) {
						this.gizmo.remove(intersect, this.level.scene);

						if (this.gizmo.empty()) {
							this.is_animating =
								this.$refs.animation_panel.playing;
						}
					}
				}
			} else {
				if (!this.dragging) {
					this.gizmo.clear(this.level.scene);
					this.is_animating = this.$refs.animation_panel.playing;
				}
			}
			this.dragging = false;
		},
		async set_json(json) {
			if (!json) return;
			this.gizmo.clear();
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
			this.add_hitboxes();
			this.add_trigger_connections();
			this.add_animation_paths();
			this.scene.add(this.level.scene);
			this.$emit('scope', (scope) => {
				scope.$refs.statistics.set_level(this.level);
			});
			this.$refs.animation_panel.set_level(this.level);
			console.log(this.level);
		},
		add_hitboxes() {
			const geometry = new THREE.BoxGeometry();
			const material = new THREE.MeshBasicMaterial({
				color: 0x000000,
				transparent: true,
				opacity: 0.1,
			});
			this.level.nodes.all
				.filter((o) => !o.isGroup && !o.isMesh)
				.forEach((object) => {
					const hitbox = new THREE.Mesh(geometry, material);
					object.add(hitbox);
				});
		},
		changed() {
			this.level.level.complexity = this.level.complexity;
			this.level.level.formatVersion = this.$config.FORMAT_VERSION;
			this.$refs.animation_panel.set_level(this.level);
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
		set_time(time) {
			this.level.meta.time = 0;
			this.level.nodes.animated.forEach((node) => {
				node.userData.currentFrameIndex = 0;
			});
			this.level.update(time);
		},
		animation() {
			const delta = this.clock.getDelta();
			if (!this.level) return;

			if (this.is_animating) {
				this.level.update(delta);
				this.update_trigger_path_positions(this.level.nodes.animated);
			}
			this.$refs.animation_panel.set_time(this.level.meta.time);
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
				this.gizmo.clear(this.level.scene);
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
			this.gizmo.set_mode(this.transform_mode);
		},
		transform_mode_event(e) {
			const mode = e.target.id.split('-')[1];
			this.set_transform_mode(mode);
			e.target.checked = true;
		},
		toggle_transform_space(_) {
			this.gizmo.set_space(
				this.gizmo.get_space() === 'local' ? 'world' : 'local',
			);
			this.transform_space = this.gizmo.get_space();
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
				color: 0x000099,
			});
			const points_material = new THREE.PointsMaterial({
				color: 0x000099,
				size: 3,
				sizeAttenuation: false,
			});
			const current_points_material = new THREE.PointsMaterial({
				color: 0x0000ff,
				size: 3,
				sizeAttenuation: false,
			});
			const current_path_material = new THREE.LineBasicMaterial({
				color: 0x0000ff,
			});

			const position = new THREE.Vector3();
			object.getWorldPosition(position);

			object.userData.node.animations.forEach((animation, i) => {
				const points = animation.frames.map(
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
				const path_line = new THREE.Line(
					line_geometry,
					i === (object.userData.node.activeAnimation ?? 0)
						? current_path_material
						: path_material,
				);
				const points_line = new THREE.Points(
					line_geometry,
					i === (object.userData.node.activeAnimation ?? 0)
						? current_points_material
						: points_material,
				);
				const path_group = new THREE.Group();
				path_group.add(path_line);
				path_group.add(points_line);

				path_group.visible = this.show_animations;
				(object.userData.animation_paths ??= []).push(path_group);
				path_group.userData.object = object;

				(object.userData.relevant_animation_paths ??= []).push(
					path_group,
				);

				object.parent.add(path_group);
			});

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
			const paths = object?.userData?.relevant_animation_paths;
			if (!paths) return;
			paths.forEach((path) => {
				path.position.copy(path.userData.object.position);
				path.quaternion.copy(path.userData.object.quaternion);
			});
			if (object.parent === this.gizmo.group) {
				paths.forEach((path) => {
					this.gizmo.group.add(path);
					this.gizmo._attach(path, this.level.scene); // HACK: private method access
				});
			}
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
			if (this.gizmo.empty()) return;
			this.modifier((json) => {
				json.levelNodes.push(
					...this.gizmo.selection.map((object) => {
						return encoding.deepClone(object.userData.node);
					}),
				);
				return json;
			});
		},
		delete_selection() {
			if (this.gizmo.empty()) return;
			this.modifier((json) => {
				json.levelNodes = json.levelNodes.filter(
					(n) =>
						!this.gizmo.selection.find(
							(o) =>
								n ===
								this.level.nodes.all[o.userData.id - 1].userData
									.node,
						),
				);
				return json;
			});
		},
		group_selection() {
			if (this.gizmo.empty()) return;
			this.modifier((json) => {
				json.levelNodes = json.levelNodes.filter(
					(n) =>
						!this.gizmo.selection.find(
							(o) =>
								n ===
								this.level.nodes.all[o.userData.id - 1].userData
									.node,
						),
				);
				json.levelNodes.push(
					group.groupNodes(
						this.gizmo.selection.map((o) => o.userData.node),
					),
				);
				return json;
			});
		},
		keydown(e) {
			if (e.target === this.renderer.domElement) {
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

					default:
						break;
				}
			}

			switch (e.code) {
				case 'Escape':
					if (this.show_mini_editor) this.close_mini_editor();
					else if (this.contextmenu) this.contextmenu = undefined;
					else if (!this.gizmo.empty())
						this.gizmo.clear(this.level.scene);
					this.is_animating = this.$refs.animation_panel.playing;
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
		add_animation_target(object, target_object = undefined) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			const target = encoding.triggerTargetAnimation();
			const id = target_object?.userData?.id ?? 0;
			target.triggerTargetAnimation.objectID = id;
			trigger.triggerTargets.push(target);
			this.add_trigger_path(object, target_object);
			this.changed();
			this.update_connection_visibility();
		},
		add_sublevel_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(encoding.triggerTargetSubLevel());
			this.changed();
		},
		add_ambience_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(encoding.triggerTargetAmbience());
			this.changed();
		},
		add_sound_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(encoding.triggerTargetSound());
			this.changed();
			this.update_connection_visibility();
		},
		add_trigger_source(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(encoding.triggerSourceBasic());
			this.changed(object);
		},
		add_trigger_blocks_source(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(encoding.triggerSourceBlockNames());
			this.changed();
		},
		add_animation(object) {
			if (!object?.userData?.node) return;
			const node = object.userData.node;
			(node.animations ??= []).push(encoding.animation());
			this.changed();
		},
		edit_object_json(object) {
			if (!object) return;

			this.show_mini_editor = true;
			this.editing_json = object;
			this.$refs.mini_editor.set_json(object.userData.node);
		},
		mini_editor_changed(new_node) {
			const id = this.editing_json?.userData?.id;
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
		set_material(material) {
			this.gizmo.selection.forEach((object) => {
				const entries = Object.entries(object.userData.node);
				const node = entries.find((e) => e[0].includes('levelNode'))[1]; // TODO: add sub node userData
				node.material = material;
			});
			this.modifier((json) => json);
		},
		set_shape(shape) {
			this.gizmo.selection.forEach((object) => {
				const entries = Object.entries(object.userData.node);
				const node = entries.find((e) => e[0].includes('levelNode'))[1];
				node.shape = shape;
			});
			this.modifier((json) => json);
		},
		format_type(type) {
			return type
				.split('_')
				.map(
					(word) =>
						word.charAt(0).toUpperCase() +
						word.toLowerCase().slice(1),
				)
				.join(' ');
		},
		open_context_menu(e) {
			if (e.target === this.renderer.domElement) {
				this.contextmenu_position.x = e.clientX;
				this.contextmenu_position.y = e.clientY;
				this.contextmenu = undefined;

				const clicked_object = this.cast_for_node(e.clientX, e.clientY);
				if (!clicked_object) return;
				const clicked_node = clicked_object.userData?.node;
				if (!clicked_node) return;
				const selection = this.gizmo.selection;
				if (!selection.length) return;
				if (selection.some((n) => !n.userData?.node)) return;
				const single_selection = selection.length === 1;
				const selected_object = selection[0];
				const selected_node = selected_object.userData.node;

				const clicked_is_selected = this.gizmo.includes(clicked_object);
				const clicked_has_shape =
					clicked_node.levelNodeStatic ||
					clicked_node.levelNodeCrumbling ||
					clicked_node.levelNodeTrigger;
				const selected_is_trigger = selected_node.levelNodeTrigger;
				const clicked_is_trigger = clicked_node.levelNodeTrigger;
				const clicked_can_animate =
					!clicked_node.levelNodeStart &&
					!clicked_node.levelNodeFinish;
				const can_group = !selection.some((object) => {
					return (
						object.userData.node.levelNodeStart ||
						object.userData.node.levelNodeFinish
					);
				});
				const can_clone = !selection.some((object) => {
					return object.userData.node.levelNodeFinish;
				});
				const clicked_has_material = clicked_node.levelNodeStatic;
				const clicked_can_target =
					!clicked_node.levelNodeStart &&
					!clicked_node.levelNodeFinish;

				this.contextmenu = {
					...(clicked_is_selected && {
						'Edit JSON': {
							func: () => {
								this.edit_object_json(clicked_object);
							},
						},
						Delete: {
							func: this.delete_selection,
						},
						...(can_clone && {
							Clone: {
								func: this.clone_selection,
							},
						}),
						...(can_group && {
							Group: {
								func: this.group_selection,
							},
						}),
						...(clicked_has_shape && {
							Shape: {
								...Object.fromEntries(
									Array.from(
										{
											length:
												Object.entries(
													this.level.root.COD.Level
														.LevelNodeShape,
												).length -
												this.level.root.COD.Level
													.LevelNodeShape
													.__END_OF_SPECIAL_PARTS__ -
												1,
										},
										(_, i) => {
											return [
												this.format_type(
													this.level.root.COD.Level
														.LevelNodeShape[
														1000 + i
													],
												),
												{
													func: () => {
														this.set_shape(
															1000 + i,
														);
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
											length: Object.entries(
												this.level.root.COD.Level
													.LevelNodeMaterial,
											).length,
										},
										(_, i) => {
											return [
												this.format_type(
													this.level.root.COD.Level
														.LevelNodeMaterial[i],
												),
												{
													func: () => {
														this.set_material(i);
													},
												},
											];
										},
									),
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
						...(clicked_is_trigger && {
							'Add Target': {
								Animation: {
									func: () => {
										this.add_animation_target(
											clicked_object,
										);
									},
								},
								SubLevel: {
									func: () => {
										this.add_sublevel_target(
											clicked_object,
										);
									},
								},
								Ambience: {
									func: () => {
										this.add_ambience_target(
											clicked_object,
										);
									},
								},
								Sound: {
									func: () => {
										this.add_sound_target(clicked_object);
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
										this.add_trigger_blocks_source(
											clicked_object,
										);
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
									this.add_animation_target(
										selected_object,
										clicked_object,
									);
								},
							},
						}),
					...(clicked_is_selected && {
						'Copy ID': {
							func: () => {
								this.copy_object_id(clicked_object);
							},
						},
					}),
				};

				if (
					this.contextmenu &&
					Object.keys(this.contextmenu).length === 0
				) {
					e.preventDefault();
				}
			}
		},
		copy_object_id(object) {
			const id = object?.userData?.id;
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
		run_in_scope(func) {
			func(this);
		},
	},
};
</script>

<template>
	<ResizableColPanel ref="resize">
		<template #first>
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
		<template #second>
			<AnimationPanel ref="animation_panel" @scope="run_in_scope" />
		</template>
	</ResizableColPanel>
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
	outline: none;
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
