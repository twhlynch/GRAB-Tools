import { deepClone, node_data } from '@/assets/encoding/utils';
import type { Tool, Viewport } from '@/assets/Tool';
import type { Level, LevelNode } from '@/generated/proto';

import * as THREE from 'three';

interface BrushItem {
	node: LevelNode;
	offset: { x: number; y: number; z: number };
}

export default class BrushTool implements Tool {
	readonly name = 'Brush';

	private viewport: Viewport | null = null;
	private brush: BrushItem[] = [];

	activate(viewport: Viewport) {
		if (viewport.gizmo.empty()) {
			window.toast('Select objects first to use as a brush', 'warn');
			return false;
		}
		if (viewport.editing_parent !== viewport.level.scene) {
			window.toast('Brush does not work inside a group', 'warn');
			return false;
		}

		this.viewport = viewport;
		viewport.renderer.domElement.style.cursor = 'crosshair';

		// bottom center of object
		const bbox = new THREE.Box3();
		viewport.gizmo.selection.forEach((object) => {
			object.traverse((obj: THREE.Object3D & { isGroup?: boolean }) => {
				if (obj.userData.node && !obj.isGroup) bbox.expandByObject(obj);
			});
		});

		const bottom_y = bbox.min.y;
		const center_x = (bbox.max.x + bbox.min.x) / 2;
		const center_z = (bbox.max.z + bbox.min.z) / 2;

		this.brush = viewport.gizmo.selection.map((obj: THREE.Object3D) => ({
			node: deepClone(obj.userData.node as LevelNode),
			offset: {
				x: obj.position.x - center_x,
				y: obj.position.y - bottom_y,
				z: obj.position.z - center_z,
			},
		}));

		viewport.gizmo.clear();

		return true;
	}

	deactivate() {
		if (this.viewport) {
			this.viewport.renderer.domElement.style.cursor = '';
		}
	}

	on_click(e: MouseEvent) {
		const viewport = this.viewport;
		if (!viewport) return false;

		// mouse position
		const canvasSize = viewport.renderer.domElement.getBoundingClientRect();
		const mouse = new THREE.Vector2(
			((e.clientX - canvasSize.left) / canvasSize.width) * 2 - 1,
			-((e.clientY - canvasSize.top) / canvasSize.height) * 2 + 1,
		);

		// find intersect at mouse
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, viewport.camera);
		const individualObjects = viewport.level.nodes.all.filter(
			(node: THREE.Object3D & { isGroup?: boolean }) =>
				!node.isGroup && node.visible,
		);
		const intersects = raycaster.intersectObjects(individualObjects, true);
		if (!intersects.length) return true;
		const hit_point = intersects[0]!.point;

		// clone brush at position
		const clones = this.brush.map((item) => {
			const cloned = deepClone(item.node);
			const data = node_data(cloned);
			const pos = data.position;
			if (pos) {
				pos.x = hit_point.x + item.offset.x;
				pos.y = hit_point.y + item.offset.y;
				pos.z = hit_point.z + item.offset.z;
			}
			return cloned;
		});

		// add to level
		viewport.modifier((level: Level) => {
			(level.levelNodes ??= []).push(...clones);
			return level;
		});

		return true;
	}
}
