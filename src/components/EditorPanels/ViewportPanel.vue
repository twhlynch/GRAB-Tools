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

export default {
	data() {
		return {
			zoom_to_cursor: true,
			free_movement: false,
			editing: null,
			dragging: false,
			huge_far: false,
			show_groups: false, // TODO:
			show_animations: false, // TODO:
			show_triggers: true,
			show_sound: true,
			show_trigger_connections: false, // TODO:
			show_fog: true,
			show_sky: true,
			transform_mode: 'translate',
			transform_space: 'local',
		};
	},
	components: {
		CursorIcon,
		KeyboardIcon,
		TranslateIcon,
		RotateIcon,
		ScaleIcon,
		SpaceIcon,
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
			object.material.uniforms.worldNormalMatrix.value = normalMatrix;
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
			this.editing = e.target.object;
			this.update_node_shader(this.editing);
		},
		edit_event(e) {
			this.controls.enabled = !e.value;
			if (!e.value) {
				this.dragging = true;
				const entries = Object.entries(this.editing.userData.node);
				const node = entries.find((e) => e[0].includes('levelNode'))[1];
				if (node.position) {
					node.position.x = this.editing.position.x;
					node.position.y = this.editing.position.y;
					node.position.z = this.editing.position.z;
				}
				if (node.scale) {
					node.scale.x = this.editing.scale.x;
					node.scale.y = this.editing.scale.y;
					node.scale.z = this.editing.scale.z;
				}
				if (node.rotation) {
					node.rotation.x = this.editing.quaternion.x;
					node.rotation.y = this.editing.quaternion.y;
					node.rotation.z = this.editing.quaternion.z;
					node.rotation.w = this.editing.quaternion.w;
				}
				this.editing.initialPosition = {
					x: this.editing.position.x,
					y: this.editing.position.y,
					z: this.editing.position.z,
				};
				this.editing.initialRotation = {
					x: this.editing.quaternion.x,
					y: this.editing.quaternion.y,
					z: this.editing.quaternion.z,
					w: this.editing.quaternion.w,
				};
				this.update_node_shader(this.editing);
				this.$emit('changed');
			}
		},
		select_event(e) {
			if (this.free_movement) return;
			const canvasSize = this.renderer.domElement.getBoundingClientRect();
			const mouse = {
				x: ((e.clientX - canvasSize.left) / canvasSize.width) * 2 - 1,
				y: -((e.clientY - canvasSize.top) / canvasSize.height) * 2 + 1,
			};
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, this.camera);
			let individualObjects = this.level.nodes.all.filter(
				(node) => node.parent.type === 'Scene' && node.visible,
			);
			let intersects = raycaster.intersectObjects(
				individualObjects,
				true,
			);
			if (intersects.length && intersects[0].object !== this.editing) {
				this.transform_controls.attach(intersects[0].object);
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
			this.scene.add(this.level.scene);
			console.log(this.level);
		},
		resize(width, height) {
			requestAnimationFrame(() => {
				this.camera.aspect = width / height;
				this.camera.updateProjectionMatrix();

				this.renderer.setSize(width, height);
				this.renderer.render(this.scene, this.camera);
			});
		},
		animation() {
			if (!this.level) return;
			const delta = this.clock.getDelta();

			this.level.update(delta);
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
		nodes_are_equal(obj1, obj2) {
			// TODO: move node a level deeped to prevent copying
			const node1 = Object.entries(obj1).find((e) =>
				e[0].includes('levelNode'),
			)[1];
			const node2 = Object.entries(obj2).find((e) =>
				e[0].includes('levelNode'),
			)[1];
			return node1 === node2;
		},
		clone_selection() {
			this.$emit('modifier', (json) => {
				// TODO: decent deepclone method
				json.levelNodes.push(
					JSON.parse(JSON.stringify(this.editing.userData.node)),
				);
				return json;
			});
		},
		delete_selection() {
			console.log(this.editing.userData.node);
			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.filter((node) =>
					this.nodes_are_equal(node, this.editing.userData.node),
				);
				return json;
			});
		},
		group_selection() {
			this.$emit('modifier', (json) => {
				json.levelNodes = json.levelNodes.filter((node) =>
					this.nodes_are_equal(node, this.editing.userData.node),
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

				default:
					break;
			}
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
	>
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
section,
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
