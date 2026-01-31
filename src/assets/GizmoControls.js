import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls';
import { node_data } from './encoding/utils';

class GizmoControls {
	constructor(camera, domElement, scene, changing_event, changed_event) {
		this.camera = camera;
		this.domElement = domElement;
		this.scene = scene;

		this.selection = [];
		this.dragData = null;

		this.pivot = new THREE.Object3D();
		this.scene.add(this.pivot);

		this.controls = new TransformControls(this.camera, this.domElement);
		this.controls.setSize(1);
		this.controls.enabled = true;

		this.one_sided = false;

		this.controls.addEventListener('change', (e) => {
			this.handle_transform_change();
			if (typeof changing_event === 'function') {
				changing_event(e);
			}
		});

		this.controls.addEventListener('dragging-changed', (e) => {
			this.handle_dragging_changed(e);
			if (typeof changed_event === 'function') {
				changed_event(e);
			}
		});

		this.scene.add(this.controls);
	}

	set_one_sided(one_sided) {
		this.one_sided = one_sided;
	}

	handle_dragging_changed(event) {
		const isDragging = event.value;

		if (isDragging) {
			this.pivot.updateMatrixWorld(true);
			const pivot_matrix = this.pivot.matrixWorld.clone();
			const pivot_inverse = pivot_matrix.clone().invert();

			const box = new THREE.Box3();
			this.selection.forEach((obj) => box.expandByObject(obj));
			const size = new THREE.Vector3();
			box.getSize(size);

			let scale_dir = 0;
			const axis = this.controls.axis;

			if (
				this.controls.mode === 'scale' &&
				this.one_sided &&
				axis.length === 1 &&
				'XYZ'.includes(axis)
			) {
				const ray = this.controls.getRaycaster().ray;
				const v = ray.origin.clone().applyMatrix4(pivot_inverse);
				const d = ray.direction
					.clone()
					.transformDirection(pivot_inverse)
					.normalize();

				scale_dir =
					Math.sign(
						v.addScaledVector(d, -v.dot(d))[axis.toLowerCase()],
					) || 1;
			}

			this.dragData = {
				pivot_matrix,
				pivot_inverse,
				objects: this.selection.map((obj) => {
					obj.updateMatrixWorld(true);
					return {
						object: obj,
						parent: obj.parent,
						original_matrix: obj.matrixWorld.clone(),
						original_quaternion: obj.quaternion.clone(),
					};
				}),
				selection_size: size,
				start_scale: this.pivot.scale.clone(),
				start_position: this.pivot.position.clone(),
				scale_dir,
			};
		} else {
			this.dragData = null;
			this.update_node_data();
			this.recenter();
		}
	}

	update_node_data() {
		this.selection.forEach((object) => {
			object.updateMatrixWorld(true);

			const node = node_data(object);
			if (!node) return;

			if (node.position) {
				node.position.x = object.position.x;
				node.position.y = object.position.y;
				node.position.z = object.position.z;
			}
			if (node.rotation) {
				node.rotation.x = object.quaternion.x;
				node.rotation.y = object.quaternion.y;
				node.rotation.z = object.quaternion.z;
				node.rotation.w = object.quaternion.w;
			}
			if (node.scale && typeof node.scale === 'object') {
				node.scale.x = object.scale.x;
				node.scale.y = object.scale.y;
				node.scale.z = object.scale.z;
			}
			if (node.scale && typeof node.scale === 'number') {
				node.scale = object.scale.x;
			}
			if (node.radius) {
				node.radius = object.scale.x / 2;
			}

			object.initialPosition.copy(object.position);
			object.initialRotation.copy(object.quaternion);
		});
	}

	handle_transform_change() {
		if (!this.dragData || this.selection.length === 0) return;

		this.pivot.updateMatrixWorld(true);

		if (this.dragData.scale_dir) {
			const axis = this.controls.axis.toLowerCase();
			const { selection_size, start_scale, start_position, scale_dir } =
				this.dragData;

			const delta =
				(selection_size[axis] / 2) *
				(this.pivot.scale[axis] / start_scale[axis] - 1) *
				scale_dir;

			const shift = new THREE.Vector3()
				.setComponent('xyz'.indexOf(axis), delta)
				.applyQuaternion(this.pivot.quaternion);

			this.pivot.position.copy(start_position).add(shift);
			this.pivot.updateMatrixWorld(true);
		}

		const delta_matrix = this.pivot.matrixWorld
			.clone()
			.multiply(this.dragData.pivot_inverse);

		for (const {
			object: obj,
			parent,
			original_matrix,
			original_quaternion,
		} of this.dragData.objects) {
			const new_world_matrix = delta_matrix
				.clone()
				.multiply(original_matrix);
			const local_matrix = parent.matrixWorld
				.clone()
				.invert()
				.multiply(new_world_matrix);

			local_matrix.decompose(obj.position, obj.quaternion, obj.scale);

			if (this.controls.mode === 'scale') {
				obj.quaternion.copy(original_quaternion);
			}

			this.applyNodeConstraints(obj);
			obj.updateMatrixWorld(true);
		}
	}
	applyNodeConstraints(object) {
		const node = object?.userData?.node;
		const axis = this.controls.axis;
		if (!node || !axis) return;

		const mode = this.controls.mode;
		const override_axis = axis.charAt(0).toLowerCase();

		if (node.levelNodeStart || node.levelNodeFinish) {
			if (mode === 'rotate') {
				object.quaternion.x = 0;
				object.quaternion.z = 0;
			} else if (mode === 'scale') {
				const s = object.scale[override_axis];
				object.scale.x = s;
				object.scale.z = s;
				object.scale.y = 1;
			}
		}

		if (node.levelNodeSign) {
			if (node.levelNodeSign.hideModel) {
				if (mode === 'scale') {
					const s = object.scale[override_axis];
					object.scale.x = s;
					object.scale.y = s;
					object.scale.z = s;
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
	}

	recenter() {
		if (this.selection.length === 0) {
			this.controls.detach();
			return;
		}

		const box = new THREE.Box3();
		for (const obj of this.selection) {
			box.expandByObject(obj);
		}
		const center = new THREE.Vector3();
		box.getCenter(center);

		this.pivot.position.copy(center);

		const primary = this.selection[0];

		if (this.controls.space === 'local' && primary) {
			primary.getWorldQuaternion(this.pivot.quaternion);
		} else {
			this.pivot.quaternion.set(0, 0, 0, 1);
		}

		this.pivot.scale.set(1, 1, 1);
		this.pivot.updateMatrixWorld(true);

		this.controls.attach(this.pivot);
	}

	add(object) {
		if (!object?.userData?.node) return;
		if (this.selection.includes(object)) return;

		this.selection.push(object);
		this.update_visuals(object, true);
		this.recenter();
	}

	remove(object) {
		if (!this.selection.includes(object)) return;

		this.selection = this.selection.filter((o) => o !== object);
		this.update_visuals(object, false);
		this.recenter();
	}

	clear() {
		[...this.selection].forEach((obj) => this.remove(obj));
	}

	includes(object) {
		return this.selection.includes(object);
	}

	empty() {
		return this.selection.length === 0;
	}

	update_visuals(object, isSelected) {
		object.traverse((obj) => {
			if (obj.material?.uniforms?.isSelected) {
				obj.material.uniforms.isSelected.value = isSelected;
			}
		});
	}

	set_mode(mode) {
		this.controls.setMode(mode);
		this.recenter();
	}

	get_mode() {
		return this.controls.mode;
	}

	set_space(space) {
		this.controls.setSpace(space);
		this.recenter();
	}

	get_space() {
		return this.controls.space;
	}

	set_snapping(enabled) {
		this.controls.setRotationSnap(
			enabled ? 5 * THREE.MathUtils.DEG2RAD : null,
		);
		this.controls.setScaleSnap(enabled ? 0.25 : null);
		this.controls.setTranslationSnap(enabled ? 0.25 : null);
	}
}

export default GizmoControls;
