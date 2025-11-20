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
			show_groups: true,
			show_animations: true,
			show_triggers: true,
			show_sound: true,
			show_trigger_connections: true,
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

		this.load_camera_state();
	},
	unmounted() {
		window.removeEventListener('keydown', this.keydown);
	},
	methods: {
		update_node_shader(object, position = true, light = true) {
			if (!object) return;

			if (position && object?.material?.uniforms?.worldMatrix) {
				object.material.uniforms.worldMatrix = {
					value: new THREE.Matrix4().copy(object.matrixWorld),
				};
				const normalMatrix = new THREE.Matrix3();
				normalMatrix.getNormalMatrix(object.matrixWorld);

				object.material.uniforms.frozenNormalMatrix = {
					value: normalMatrix,
				};
			}

			if (light && object?.material?.uniforms?.worldNormalMatrix) {
				const normalMatrix = new THREE.Matrix3();
				normalMatrix.getNormalMatrix(object.matrixWorld);

				object.material.uniforms.worldNormalMatrix = {
					value: normalMatrix,
				};
			}

			if (object.children?.length) {
				object.children.forEach((child) =>
					this.update_node_shader(child, position, light),
				);
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
		moving_event(e) {
			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				this.update_animation_path_position(object);
			});
			this.update_trigger_path_positions(this.gizmo.selection);
		},
		edit_event(e) {
			this.controls.enabled = !e.value;
			if (e.value) return;
			this.dragging = true;

			this.gizmo.selection.forEach((object) => {
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
			this.add_group_bounds();
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
				this.level.nodes.animated.forEach((object) => {
					this.update_node_shader(object, false, true);
				});
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
		select_nodes(nodes) {
			if (this.free_movement) return;
			this.is_animating = false;
			this.gizmo.clear(this.level.scene);
			nodes
				.filter((obj) => obj.parent === this.level.scene)
				.forEach((obj) => this.gizmo.add(obj));
		},
		select_by_material(material) {
			this.select_nodes(this.level.nodes.material[material]);
		},
		select_by_shape(shape) {
			this.select_nodes(this.level.nodes.shape[shape]);
		},
		select_by_type(type) {
			this.select_nodes(this.level.nodes[type]);
		},
		select_by_color() {
			if (this.gizmo.empty()) return;
			const target = this.gizmo.selection[0];
			const target_node = target.userData.node.levelNodeStatic;
			if (!target_node) return;
			const node_color = target_node.color1 ?? { r: 1, g: 1, b: 1 };

			const selection = this.level.nodes.all.filter((object) => {
				const node = object.userData.node.levelNodeStatic;
				if (!node) return false;
				const color = node.color1 ?? { r: 1, g: 1, b: 1 };
				if (!color) return false;

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
			camera_state += `&control_target=`;
			camera_state += `${this.controls.target.x},${this.controls.target.y},${this.controls.target.z}`;

			navigator.clipboard.writeText(camera_state);
		},
		load_camera_state() {
			const params = new URLSearchParams(window.location.search);
			const camera_position = params.get('camera_position');
			const camera_rotation = params.get('camera_rotation');
			const control_target = params.get('control_target');
			if (camera_position) {
				const position = camera_position
					.split(',')
					.map((pos) => parseFloat(pos));
				this.camera.position.set(position[0], position[1], position[2]);
			}
			if (camera_rotation) {
				const rotation = camera_rotation
					.split(',')
					.map((rot) => parseFloat(rot));
				this.camera.rotation.set(rotation[0], rotation[1], rotation[2]);
			}
			if (control_target) {
				const target = control_target
					.split(',')
					.map((pos) => parseFloat(pos));
				this.controls.target.set(target[0], target[1], target[2]);
				this.camera.lookAt(target[0], target[1], target[2]);
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
		toggle_groups() {
			this.show_groups = !this.show_groups;
			this.update_group_visibility();
		},
		update_group_visibility() {
			this.level.nodes.levelNodeGroup.forEach((object) => {
				object.userData.group_bounds.visible = this.show_groups;
			});
		},
		add_group_bounds() {
			if (this.level.nodes?.levelNodeGroup?.length) {
				this.level.nodes.levelNodeGroup.forEach((object) => {
					this.add_group_bound(object);
				});
			}
		},
		add_group_bound(object) {
			const geometry = new THREE.BoxGeometry();
			const edges = new THREE.EdgesGeometry(geometry);
			const material = new THREE.LineBasicMaterial({
				color: 0x009900,
			});
			const line = new THREE.LineSegments(edges, material);

			const box = new THREE.Box3().setFromObject(object);
			for (const obj of object.children) {
				box.expandByObject(obj);
			}
			const size = new THREE.Vector3();
			const center = new THREE.Vector3();
			box.getSize(size);
			box.getCenter(center);

			object.worldToLocal(center);

			const child = object.children[0];
			const child_q = new THREE.Quaternion();
			child.getWorldQuaternion(child_q);
			const parent_q = new THREE.Quaternion();
			object.getWorldQuaternion(parent_q);
			const quat = parent_q.clone().invert().multiply(child_q);

			line.quaternion.copy(quat.multiply(object.quaternion));
			line.scale.copy(size);
			line.position.copy(center);

			line.visible = this.show_groups;
			object.userData.group_bounds = line;
			object.add(line);
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
		ungroup_selection() {
			if (this.gizmo.selection.length !== 1) return;
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
					...group.ungroupNode(this.gizmo.selection[0].userData.node),
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
				const node = encoding.node_data(object);
				node.material = material;
			});
			this.modifier((json) => json);
		},
		set_shape(shape) {
			this.gizmo.selection.forEach((object) => {
				const node = encoding.node_data(object);
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
				const selected_is_group = selected_node.levelNodeGroup;
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
						...(single_selection &&
							selected_is_group && {
								Ungroup: {
									func: this.ungroup_selection,
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
		mirror_x() {
			this.level.nodes.all.forEach((object) => {
				const node = object.userData.node;
				const data = encoding.node_data(node);

				const x = -object.initialPosition.x;
				object.position.x = x;
				object.initialPosition.x = x;
				data.position.x = x;
				if (node.animations) {
					node.animations.forEach((animation) => {
						if (animation.frames?.length) {
							animation.frames.forEach((frame) => {
								if (frame.position?.x) {
									frame.position.x = -frame.position.x;
								}
							});
						}
					});
				}
			});
			this.modifier((json) => json);
		},
		mirror_y() {
			this.level.nodes.all.forEach((object) => {
				const node = object.userData.node;
				const data = encoding.node_data(node);

				const y = -object.initialPosition.y;
				object.position.y = y;
				object.initialPosition.y = y;
				data.position.y = y;
				if (node.animations) {
					node.animations.forEach((animation) => {
						if (animation.frames?.length) {
							animation.frames.forEach((frame) => {
								if (frame.position?.y) {
									frame.position.y = -frame.position.y;
								}
							});
						}
					});
				}
			});
			this.modifier((json) => json);
		},
		mirror_z() {
			this.level.nodes.all.forEach((object) => {
				const node = object.userData.node;
				const data = encoding.node_data(node);

				const z = -object.initialPosition.z;
				object.position.z = z;
				object.initialPosition.z = z;
				data.position.z = z;
				if (node.animations) {
					node.animations.forEach((animation) => {
						if (animation.frames?.length) {
							animation.frames.forEach((frame) => {
								if (frame.position?.z) {
									frame.position.z = -frame.position.z;
								}
							});
						}
					});
				}
			});
			this.modifier((json) => json);
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
