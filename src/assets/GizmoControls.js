import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as THREE from 'three';

/**
 * TransformControls wrapper
 * @param {Function<Event>} changing_event called as transform controls changes
 * @param {Function<Event>} changed_event called when starting or stopping using transform controls
 */
class GizmoControls {
	constructor(camera, domElement, scene, changing_event, changed_event) {
		this.camera = camera;
		this.domElement = domElement;
		this.scene = scene;

		this.selection = [];
		this.group = new THREE.Group();

		this.controls = new TransformControls(this.camera, this.domElement);

		this.controls.addEventListener('change', changing_event);
		this.controls.addEventListener('dragging-changed', changed_event);

		this.scene.add(this.group);
		this.scene.add(this.controls);
	}

	/**
	 * parent.attach(object) but handles non uniform scale better
	 */
	_attach(object, parent) {
		object.updateWorldMatrix(true, false);

		const worldPosition = new THREE.Vector3();
		const worldQuaternion = new THREE.Quaternion();
		const worldScale = new THREE.Vector3();

		object.getWorldPosition(worldPosition);
		object.getWorldQuaternion(worldQuaternion);
		object.getWorldScale(worldScale);

		object.parent?.remove?.(object);
		parent.add(object);

		parent.updateWorldMatrix(true, false);
		const parentInv = new THREE.Matrix4().copy(parent.matrixWorld).invert();

		object.position.copy(worldPosition).applyMatrix4(parentInv);

		const parentQuat = new THREE.Quaternion();
		parent.matrixWorld.decompose(
			new THREE.Vector3(),
			parentQuat,
			new THREE.Vector3(),
		);
		object.quaternion
			.copy(worldQuaternion)
			.premultiply(parentQuat.invert());

		const parentScale = new THREE.Vector3();
		parent.matrixWorld.decompose(
			new THREE.Vector3(),
			new THREE.Quaternion(),
			parentScale,
		);
		object.scale.set(
			worldScale.x / parentScale.x,
			worldScale.y / parentScale.y,
			worldScale.z / parentScale.z,
		);

		object.updateMatrix();
		object.updateMatrixWorld(true);
	}

	recenter() {
		if (this.selection.length === 0) {
			this.controls.detach();
			return;
		}

		for (const obj of this.selection) {
			this._attach(obj, this.scene);
		}

		const box = new THREE.Box3();
		for (const obj of this.selection) {
			box.expandByObject(obj);
		}
		const center = new THREE.Vector3();
		box.getCenter(center);

		const first = this.selection[0];
		first.updateMatrixWorld(true);
		const quat = new THREE.Quaternion();
		first.getWorldQuaternion(quat);

		this.group.position.copy(center);
		this.group.quaternion.copy(quat);
		this.group.scale.set(1, 1, 1);
		this.group.updateMatrixWorld(true);

		for (const obj of this.selection) {
			this._attach(obj, this.group);
		}

		this.controls.attach(this.group);
	}

	add(object) {
		if (!object?.userData?.node) return;
		if (this.selection.includes(object)) return;

		this.selection.push(object);

		this._attach(object, this.group);

		object.traverse((obj) => {
			if (!obj.material?.uniforms) return;
			if (!obj.userData?.node) return;
			obj.material.uniforms.isSelected = {
				value: true,
			};
		});

		this.recenter();
	}

	remove(object, parent = undefined) {
		if (!this.selection.includes(object)) return;

		this.selection = this.selection.filter((obj) => obj !== object);

		if (parent) this._attach(object, parent);
		else object.removeFromParent();

		object.traverse((obj) => {
			if (!obj.material?.uniforms) return;
			if (!obj.userData?.node) return;
			obj.material.uniforms.isSelected = {
				value: false,
			};
		});

		this.recenter();
	}

	includes(object) {
		return this.selection.includes(object);
	}

	empty() {
		return this.selection.length === 0;
	}

	clear(parent = undefined) {
		[...this.selection].forEach((object) => {
			this.remove(object, parent);
		});
	}

	set_mode(mode) {
		this.controls.setMode(mode);
	}

	get_mode() {
		return this.controls.mode;
	}

	set_space(space) {
		this.controls.setSpace(space);
	}

	get_space() {
		return this.controls.space;
	}
}

export default GizmoControls;
