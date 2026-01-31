<script>
import { create_connection } from '@/assets/encoding/gasm/connections';
import { groupNodes, ungroupNode } from '@/assets/encoding/group';
import {
	animation,
	triggerSourceBasic,
	triggerSourceBlockNames,
	triggerTargetAmbience,
	triggerTargetAnimation,
	triggerTargetSound,
	triggerTargetSubLevel,
} from '@/assets/encoding/level_nodes';
import {
	deepClone,
	materials,
	node_data,
	shapes,
} from '@/assets/encoding/utils';
import { FreeControls } from '@/assets/FreeControls';
import GizmoControls from '@/assets/GizmoControls';
import { LevelLoader } from '@/assets/LevelLoader';
import AnimationPanel from '@/components/EditorPanels/AnimationPanel.vue';
import ContextMenu from '@/components/EditorPanels/ContextMenu.vue';
import GASMPanel from '@/components/EditorPanels/GASMPanel.vue';
import JsonPanel from '@/components/EditorPanels/JsonPanel.vue';
import KeyHint from '@/components/EditorPanels/KeyHint.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import CursorIcon from '@/icons/CursorIcon.vue';
import KeyboardIcon from '@/icons/KeyboardIcon.vue';
import OneSidedScaleIcon from '@/icons/OneSidedScaleIcon.vue';
import RotateIcon from '@/icons/RotateIcon.vue';
import ScaleIcon from '@/icons/ScaleIcon.vue';
import SpaceIcon from '@/icons/SpaceIcon.vue';
import TranslateIcon from '@/icons/TranslateIcon.vue';
import { useConfigStore } from '@/stores/config';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

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
			show_gasm_connections: true,
			show_fog: true,
			show_sky: true,
			transform_mode: 'translate',
			transform_space: 'local',
			contextmenu: undefined,
			contextmenu_position: { x: 0, y: 0 },
			is_animating: true,
			show_mini_editor: false,
			show_gasm_editor: false,
			show_keybinds: true,
			show_key_hints: true,
			show_shadows: false,
			group_depth: 0,
			hold: {
				timeout: undefined,
				x: 0,
				y: 0,
			},
		};
	},
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
	emits: ['changed', 'modifier', 'scope', 'undo', 'redo'],
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
		if (!this.renderer) return;

		this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
			e.preventDefault();
			window.toast('WebGL context lost, reload recommended', 'error');
		});
		this.renderer.domElement.addEventListener(
			'webglcontextrestored',
			() => {
				window.toast('WebGL context restored', 'info');
			},
		);

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
		window.addEventListener('keyup', this.keyup);
		await this.set_json(this.json);

		this.$refs.resize.size(
			this.$refs.resize.$el.getBoundingClientRect().bottom - 30 - 5,
		);

		this.load_camera_state();
	},
	unmounted() {
		window.removeEventListener('keydown', this.keydown);
		window.removeEventListener('keyup', this.keyup);
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
			try {
				this.renderer = new THREE.WebGLRenderer({
					antialias: true,
					preserveDrawingBuffer: true,
				});
			} catch (e) {
				e.message =
					'Browser failed to create WebGL context: ' + e.message;
				window.panic(e);
				return;
			}

			THREE.ColorManagement.enabled = true;
			this.renderer.setSize(
				this.$refs.viewport.clientWidth,
				this.$refs.viewport.clientHeight,
			);
			this.renderer.outputColorSpace = THREE.SRGBColorSpace;
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setClearColor(
				// new THREE.Color(143.0 / 255.0, 182.0 / 255.0, 221.0 / 255.0),
				// new THREE.Color(28 / 255.0, 28 / 255.0, 36 / 255.0),
				new THREE.Color(3 / 255.0, 3 / 255.0, 3 / 255.0),
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
				this.huge_far ? 4000000 : 10000,
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
			this.renderer.domElement.addEventListener('dragover', (e) => {
				e.preventDefault();
			});
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
		moving_event(_) {
			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				this.update_animation_path_position(object);
				this.update_group_bounds(object);
			});
			this.update_connection_positions(this.gizmo.selection);
		},
		edit_event(e) {
			this.controls.enabled = !e.value;
			if (e.value) return;
			this.dragging = true;

			this.gizmo.selection.forEach((object) => {
				this.update_node_shader(object);
				this.update_group_bounds(object);
			});

			this.update_connection_positions(this.gizmo.selection);
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
				while (intersect && intersect.parent !== this.editing_parent) {
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
						this.gizmo.clear(this.editing_parent);
					}

					if (this.is_animating) this.reset_node_positions();
					this.gizmo.add(intersect);
					this.is_animating = false;
				} else {
					if (e.shiftKey) {
						this.gizmo.remove(intersect, this.editing_parent);

						if (this.gizmo.empty()) {
							this.is_animating =
								this.$refs.animation_panel.playing;
						}
					}
				}
			} else {
				if (!this.dragging) {
					this.gizmo.clear(this.editing_parent);
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
				GASM: true,
			});
			this.level = await window._levelLoader.load(json, true);
			this.add_hitboxes();
			this.add_trigger_connections();
			this.add_gasm_connections();
			this.add_animation_paths();
			this.add_group_bounds();
			if (this.show_shadows) this.update_shadows();
			this.scene.add(this.level.scene);
			this.enter_specific_group(this.level.scene);
			this.$emit('scope', (scope) => {
				scope.$refs.statistics.set_level(this.level);
			});
			this.$refs.animation_panel.set_level(this.level);
			console.log(this.level);
			console.log(json);
		},
		configure_shadow_camera() {
			const sun = this.level.sun;

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
				this.update_connection_positions(this.level.nodes.animated);
				this.level.nodes.animated.forEach((object) => {
					this.update_node_shader(object, false, true);
				});
			}
			if (this.$refs.animation_panel)
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
				this.gizmo.clear(this.editing_parent);
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
				this.show_keybinds = false;
			}
		},
		mouseup(_) {
			this.controls.isMouseActive = false;
		},
		set_transform_mode(mode) {
			this.transform_mode = mode;
			if (mode === 'one_sided') {
				this.gizmo.set_mode('scale');
				this.gizmo.set_one_sided(true);
			} else {
				this.gizmo.set_mode(mode);
				this.gizmo.set_one_sided(false);
			}
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
			this.gizmo.clear(this.editing_parent);
			nodes
				.filter((obj) => obj.parent === this.editing_parent)
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
			camera_state += `${this.controls.target?.x ?? 0},${
				this.controls.target?.y ?? 0
			},${this.controls.target?.z ?? 0}`;

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
			const sky = this.level.scene.children.find((obj) => obj.isSky);
			if (sky) sky.visible = this.show_sky;
		},
		toggle_trigger_connections() {
			this.show_trigger_connections = !this.show_trigger_connections;
			this.update_trigger_connection_visibility();
			this.update_connection_positions();
		},
		toggle_gasm_connections() {
			this.show_gasm_connections = !this.show_gasm_connections;
			this.update_gasm_connection_visibility();
			this.update_connection_positions();
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
			if (object.children.length === 0) return;

			const geometry = new THREE.BoxGeometry();
			const edges = new THREE.EdgesGeometry(geometry);
			const material = new THREE.LineBasicMaterial({
				color: object === this.editing_parent ? 0x99ff00 : 0x009900,
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
		update_group_bounds(object) {
			let parent = object;
			while (parent !== this.level.scene) {
				const bounds = parent.userData.group_bounds;
				if (bounds) {
					parent.remove(bounds);
					this.add_group_bound(parent);
				}
				parent = parent.parent;
			}
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
		update_trigger_connection_visibility() {
			this.level.nodes.levelNodeTrigger.forEach((object) => {
				(object.userData.trigger_connections ?? []).forEach((path) => {
					path.visible = this.show_trigger_connections;
				});
			});
		},
		update_gasm_connection_visibility() {
			this.level.nodes.levelNodeGASM.forEach((object) => {
				(object.userData.gasm_connections ?? []).forEach((path) => {
					path.visible = this.show_gasm_connections;
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
		add_gasm_connections() {
			if (this.level.nodes.levelNodeGASM?.length) {
				this.level.nodes.levelNodeGASM.forEach((object) => {
					const node = object.userData.node.levelNodeGASM;
					const connections = node.connections;
					if (!connections) return;

					const ids = [];
					connections.forEach((connection) => {
						if (!connection.type || connection.type === 0) {
							const objectID = connection.objectID;
							if (objectID) ids.push(objectID);
						}
					});
					ids.forEach((id) => {
						const target = this.level.nodes.all[id - 1];
						if (!target) return;
						this.add_gasm_path(object, target);
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

			object.userData.node.animations.forEach((anim, i) => {
				if (!anim.frames) return;
				const points = anim.frames.map(
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
		},
		update_connection_positions(related_objects = undefined) {
			if (related_objects === undefined) {
				related_objects = [
					...(this.show_trigger_connections
						? this.level.nodes?.levelNodeTrigger ?? []
						: []),
					...(this.show_gasm_connections
						? this.level.nodes?.levelNodeGASM ?? []
						: []),
				];
			}

			if (!related_objects.length) return;

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
				const path_target = line.userData.target;
				const path_object = line.userData.object;

				const object_position = new THREE.Vector3();
				path_object.getWorldPosition(object_position);
				const position = new THREE.Vector3();
				path_target.getWorldPosition(position);

				const points = [object_position, position];
				line.geometry.dispose();
				line.geometry = new THREE.BufferGeometry().setFromPoints(
					points,
				);
			});
		},
		add_relevant_connection(object, connection) {
			let current = object;
			while (current?.userData?.node) {
				(current.userData.relevant_connections ??= []).push(connection);
				current = current.parent;
			}
		},
		make_connection(object, target, material) {
			const trigger_position = new THREE.Vector3();
			object.getWorldPosition(trigger_position);

			const target_position = new THREE.Vector3();
			target.getWorldPosition(target_position);

			const points = [trigger_position, target_position];
			const line_geometry = new THREE.BufferGeometry().setFromPoints(
				points,
			);

			const line = new THREE.Line(line_geometry, material);
			line.userData.object = object;
			line.userData.target = target;

			return line;
		},
		add_gasm_path(object, target) {
			this.gasm_connection_material =
				this.gasm_connection_material ??
				new THREE.LineBasicMaterial({
					color: 0x006600,
				});

			const line = this.make_connection(
				object,
				target,
				this.gasm_connection_material,
			);
			line.visible = this.show_gasm_connections;
			(object.userData.gasm_connections ??= []).push(line);
			this.add_relevant_connection(target, line);
			this.add_relevant_connection(object, line);

			this.level.scene.add(line);
		},
		add_trigger_path(object, target) {
			this.trigger_connection_material =
				this.trigger_connection_material ??
				new THREE.LineBasicMaterial({
					color: 0xff8800,
				});

			const line = this.make_connection(
				object,
				target,
				this.trigger_connection_material,
			);
			line.visible = this.show_trigger_connections;
			(object.userData.trigger_connections ??= []).push(line);
			this.add_relevant_connection(target, line);
			this.add_relevant_connection(object, line);

			this.level.scene.add(line);
		},
		modify_selection(func) {
			if (this.gizmo.empty()) return;
			this.modifier((json) => {
				const node_list =
					this.editing_parent.userData?.node?.levelNodeGroup
						?.childNodes ?? json.levelNodes;

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
		delete_selection() {
			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) =>
						!this.gizmo.selection.find(
							(o) => n === o.userData.node,
						),
				),
			]);
		},
		group_selection() {
			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) =>
						!this.gizmo.selection.find(
							(o) => n === o.userData.node,
						),
				),
				groupNodes(this.gizmo.selection.map((o) => o.userData.node)),
			]);
		},
		ungroup_selection() {
			if (this.gizmo.selection.length !== 1) return;
			this.modify_selection((node_list) => [
				...node_list.filter(
					(n) =>
						!this.gizmo.selection.find(
							(o) => n === o.userData.node,
						),
				),
				...ungroupNode(this.gizmo.selection[0].userData.node),
			]);
		},
		keyup(e) {
			switch (e.code) {
				case 'ShiftLeft':
					this.gizmo.set_snapping(false);
					break;

				default:
					break;
			}
		},
		keydown(e) {
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
					if (this.show_mini_editor) this.close_mini_editor();
					else if (this.show_gasm_editor) this.close_gasm_editor();
					else if (this.contextmenu) this.contextmenu = undefined;
					else if (!this.gizmo.empty())
						this.gizmo.clear(this.editing_parent);
					this.is_animating = this.$refs.animation_panel.playing;
					break;

				default:
					break;
			}
		},
		enter_group() {
			if (this.gizmo.selection.length !== 1) return;
			const group = this.gizmo.selection[0];
			if (!group.userData.node?.levelNodeGroup) return;
			this.enter_specific_group(group);
		},
		exit_group() {
			if (this.editing_parent === this.level.scene) return;
			this.enter_specific_group(this.editing_parent.parent);
		},
		enter_specific_group(object) {
			this.gizmo.clear(this.editing_parent);
			if (this.editing_parent?.isGroup) {
				this.editing_parent.userData.group_bounds.material.color =
					new THREE.Color(0x009900);
			}
			this.editing_parent = object;
			if (this.editing_parent.isGroup) {
				this.editing_parent.userData.group_bounds.material.color =
					new THREE.Color(0x99ff00);
			}
			this.group_depth = 0;
			let parent = this.editing_parent;
			while (parent !== this.level.scene) {
				this.group_depth++;
				parent = parent.parent;
			}
		},
		close_gasm_editor() {
			if (this.show_gasm_editor) this.$refs.gasm_editor.save();
			this.show_gasm_editor = false;
		},
		save_gasm_code(new_json) {
			const id = this.editing_gasm?.userData?.id;
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
					json.levelNodes[index] = new_json;
				}
				return json;
			});
		},
		close_mini_editor() {
			if (this.show_mini_editor)
				this.mini_editor_changed(this.$refs.mini_editor.json);
			this.show_mini_editor = false;
		},
		add_code_player_connection(object) {
			const object_node = object.userData.node;
			create_connection(object_node, undefined, 0, 'player', 'Player');
			this.changed();
		},
		add_code_connection(object, target, type) {
			const object_node = object.userData.node;
			const target_node = target.userData.node;
			const id = target?.userData?.id ?? 0;
			const is_new = create_connection(
				object_node,
				target_node,
				id,
				type === 'active' ? 'triggerActive' : type,
			);
			if (is_new) this.add_gasm_path(object, target);

			this.changed();
		},
		add_animation_target(object, target_object = undefined) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			const target = triggerTargetAnimation();
			const id = target_object?.userData?.id ?? 0;
			target.triggerTargetAnimation.objectID = id;
			trigger.triggerTargets.push(target);
			this.add_trigger_path(object, target_object);
			this.changed();
		},
		add_sublevel_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(triggerTargetSubLevel());
			this.changed();
		},
		add_ambience_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(triggerTargetAmbience());
			this.changed();
		},
		add_sound_target(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerTargets) trigger.triggerTargets = [];
			trigger.triggerTargets.push(triggerTargetSound());
			this.changed();
		},
		add_trigger_source(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(triggerSourceBasic());
			this.changed(object);
		},
		add_trigger_blocks_source(object) {
			if (!object?.userData?.node?.levelNodeTrigger) return;
			const trigger = object.userData.node.levelNodeTrigger;
			if (!trigger.triggerSources) trigger.triggerSources = [];
			trigger.triggerSources.push(triggerSourceBlockNames());
			this.changed();
		},
		add_animation(object) {
			if (!object?.userData?.node) return;
			const node = object.userData.node;
			(node.animations ??= []).push(animation());
			this.changed();
		},
		edit_object_json(object) {
			if (!object) return;

			this.show_mini_editor = true;
			this.editing_json = object;
			this.$refs.mini_editor.set_json(object.userData.node);
		},
		edit_gasm_code(object) {
			if (!object) return;

			this.show_gasm_editor = true;
			this.editing_gasm = object;
			this.$refs.gasm_editor.set_json(object.userData.node);
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
				const node = node_data(object);
				node.material = material;
			});
			this.modifier((json) => json);
		},
		set_shape(shape) {
			this.gizmo.selection.forEach((object) => {
				const node = node_data(object);
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
		open_context_menu(x, y, e) {
			if (e?.target !== this.renderer.domElement) return;

			this.contextmenu_position.x = x;
			this.contextmenu_position.y = y;
			this.contextmenu = undefined;

			const clicked_object = this.cast_for_node(x, y);
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
			const selected_is_code = selected_node.levelNodeGASM;
			const clicked_has_code = clicked_node.levelNodeGASM;
			const clicked_is_trigger = clicked_node.levelNodeTrigger;
			const clicked_can_animate =
				!clicked_node.levelNodeStart && !clicked_node.levelNodeFinish;
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
				!clicked_node.levelNodeStart && !clicked_node.levelNodeFinish;
			const clicked_has_color =
				clicked_node.levelNodeStatic?.material === 8 ||
				clicked_node.levelNodeStatic?.material === 3;
			const clicked_is_sign = clicked_node.levelNodeSign;

			this.contextmenu = {
				...(clicked_is_selected && {
					'Edit JSON': {
						func: () => {
							this.edit_object_json(clicked_object);
						},
					},
					...(clicked_has_code && {
						'Edit Code': {
							func: () => {
								this.edit_gasm_code(clicked_object);
							},
						},
					}),
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
											Object.entries(shapes()).length -
											shapes().__END_OF_SPECIAL_PARTS__ -
											1,
									},
									(_, i) => {
										return [
											this.format_type(
												shapes()[1000 + i],
											),
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
										length: Object.entries(materials())
											.length,
									},
									(_, i) => {
										return [
											this.format_type(materials()[i]),
											{
												func: () => {
													this.set_material(i);
												},
												num: i,
											},
										];
									},
								).filter(
									(item) =>
										item[1].num !== materials().TRIGGER,
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
				...(single_selection &&
					selected_is_code &&
					clicked_can_target && {
						'Add as Connection': {
							Position: {
								func: () => {
									this.add_code_connection(
										selected_object,
										clicked_object,
										'position',
									);
								},
							},
							Rotation: {
								func: () => {
									this.add_code_connection(
										selected_object,
										clicked_object,
										'rotation',
									);
								},
							},
							Scale: {
								func: () => {
									this.add_code_connection(
										selected_object,
										clicked_object,
										'scale',
									);
								},
							},
							...(clicked_is_sign && {
								Sign: {
									func: () => {
										this.add_code_connection(
											selected_object,
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
											selected_object,
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
											selected_object,
											clicked_object,
											'active',
										);
									},
								},
							}),
							...(clicked_is_selected && {
								Player: {
									func: () => {
										this.add_code_player_connection(
											selected_object,
										);
									},
								},
							}),
						},
					}),
				...(clicked_is_selected && {
					[`Copy ID (${clicked_object?.userData?.id ?? 0})`]: {
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
				e?.preventDefault?.();
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
			this.controls.target?.copy(center);
			this.camera.lookAt(center);
		},
		mirror_x() {
			this.modifier((json) => {
				const node_list =
					this.editing_parent.userData?.node?.levelNodeGroup
						?.childNodes ?? json.levelNodes;

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = node_data(node);

						const x = -object.initialPosition?.x ?? 0;
						object.position.x = x;
						object.initialPosition.x = x;
						data.position.x = x;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.x) {
											frame.position.x =
												-frame.position.x;
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
				const node_list =
					this.editing_parent.userData?.node?.levelNodeGroup
						?.childNodes ?? json.levelNodes;

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = node_data(node);

						const y = -object.initialPosition?.y ?? 0;
						object.position.y = y;
						object.initialPosition.y = y;
						data.position.y = y;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.y) {
											frame.position.y =
												-frame.position.y;
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
				const node_list =
					this.editing_parent.userData?.node?.levelNodeGroup
						?.childNodes ?? json.levelNodes;

				this.level.nodes.all
					.filter((obj) => node_list.includes(obj.userData.node))
					.forEach((object) => {
						const node = object.userData.node;
						const data = node_data(node);

						const z = -object.initialPosition?.z ?? 0;
						object.position.z = z;
						object.initialPosition.z = z;
						data.position.z = z;
						if (node.animations) {
							node.animations.forEach((anim) => {
								if (anim.frames?.length) {
									anim.frames.forEach((frame) => {
										if (frame.position?.z) {
											frame.position.z =
												-frame.position.z;
										}
									});
								}
							});
						}
					});

				return json;
			});
		},
		pointerstart(e) {
			if (e.touches.length !== 1) return;

			this.hold.x = e.clientX;
			this.hold.y = e.clientY;

			clearTimeout(this.hold.timeout);

			this.hold.timeout = setTimeout(() => {
				this.open_context_menu(this.hold.x, this.hold.y, e);
			}, 600);
		},
		pointerend(e) {
			clearTimeout(this.hold.timeout);
		},
		pointercancel(e) {
			clearTimeout(this.hold.timeout);
		},
		pointermove(e) {
			const dx = Math.abs(e.clientX - this.hold.x);
			const dy = Math.abs(e.clientY - this.hold.y);

			if (dx > 10 || dy > 10) {
				clearTimeout(this.hold.timeout);
			}
		},
		rightmousedown(e) {
			this.open_context_menu(e.clientX, e.clientY, e);
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
				@contextmenu="rightmousedown"
				@pointerstart="pointerstart"
				@pointerend="pointerend"
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
					ref="gasm_editor"
					v-show="show_gasm_editor"
					class="gasm-editor"
					@set="save_gasm_code"
				/>
				<button
					class="close-gasm-editor"
					@click="close_gasm_editor"
					v-show="show_gasm_editor"
				>
					Save
				</button>
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
				<div class="group-depth" v-show="group_depth">
					<span>Depth: {{ group_depth }}</span>
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
</style>
