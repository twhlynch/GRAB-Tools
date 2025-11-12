<script>
import { LevelLoader } from '../../../src/assets/LevelLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FreeControls } from '@/assets/FreeControls.js';
import encoding from '@/assets/tools/encoding.js';
import CursorIcon from '@/icons/CursorIcon.vue';
import KeyboardIcon from '@/icons/KeyboardIcon.vue';

export default {
	data() {
		return {
			zoom_to_cursor: true,
		};
	},
	components: {
		CursorIcon,
		KeyboardIcon,
	},
	async mounted() {
		if (!window._levelLoader) window._levelLoader = new LevelLoader();
		window._levelLoader.config({
			sky: true,
			lights: true,
			text: true,
			triggers: true,
			sound: true,
			sublevels: true,
			static: false,
		});

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
		await this.set_json(this.json);
	},
	methods: {
		setup_renderer() {
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
				new THREE.Color(143.0 / 255.0, 182.0 / 255.0, 221.0 / 255.0),
				1.0,
			);
			this.renderer.setAnimationLoop(this.animation);
			this.$refs.viewport.appendChild(this.renderer.domElement);

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
			this.controls = new OrbitControls(
				this.camera,
				this.renderer.domElement,
			);
			this.controls.zoomToCursor = this.zoom_to_cursor;
			this.controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
		},
		async set_json(json) {
			if (!json) return;
			const buffer = await encoding.encodeLevel(json);
			const formattedBuffer = new Uint8Array(buffer);
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
			this.level = await window._levelLoader.load(formattedBuffer);
			this.scene.add(this.level.scene);
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
					checked
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
					@change="toggleControls"
				/>
			</div>
		</div>
	</section>
</template>

<style>
.controls > div:has(input:checked) > label svg {
	color: var(--text-color-accent);
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
.controls {
	position: absolute;
	right: 0.5rem;
	bottom: 0.5rem;
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
</style>
