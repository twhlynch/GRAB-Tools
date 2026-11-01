import { deepClone } from '@/common/utils';
import type { Tool, ViewportInterface } from '@/editor/Tool';
import {
	levelNodeData,
	LevelNodeWithAny,
} from '@grab-tools/lib/generated/nodes';
import type { Level } from '@grab-tools/lib/generated/proto';
import * as THREE from 'three';

interface BrushItem {
	node: LevelNodeWithAny;
	offset: { x: number; y: number; z: number };
}

export default class BrushTool implements Tool {
	readonly name = 'Brush';

	private viewport: ViewportInterface | null = null;
	private brush: BrushItem[] = [];

	activate(viewport: ViewportInterface) {
		if (viewport.gizmo.empty()) {
			window.toast('Select objects first to use as a brush', 'warning');
			return false;
		}
		if (viewport.editing_parent !== viewport.level.scene) {
			window.toast('Brush does not work inside a group', 'warning');
			return false;
		}

		this.viewport = viewport;
		viewport.renderer.domElement.style.cursor = 'crosshair';

		// bottom center of object
		const bbox = new THREE.Box3();
		viewport.gizmo.selection.forEach((object) => {
			object.traverse((obj) => {
				if (obj.userData.node && !obj.userData.isGroup)
					bbox.expandByObject(obj);
			});
		});

		const bottom_y = bbox.min.y;
		const center_x = (bbox.max.x + bbox.min.x) / 2;
		const center_z = (bbox.max.z + bbox.min.z) / 2;

		this.brush = viewport.gizmo.selection.map((obj) => ({
			node: deepClone(obj.userData.node),
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
			(node) => !node.userData.isGroup && node.visible,
		);
		const intersects = raycaster.intersectObjects(individualObjects, true);
		if (!intersects.length) return true;
		const hit_point = intersects[0]!.point;

		// clone brush at position
		const clones = this.brush.map((item) => {
			const cloned = deepClone(item.node);
			const data = levelNodeData(cloned);
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
