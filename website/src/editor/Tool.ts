import type { LevelNodeObject } from '@/common/levelNodes';
import type { Level, LevelNodeGroup } from '@grab-tools/lib/generated/proto';
import type { Camera, Scene, WebGLRenderer } from 'three';
import type GizmoControls from './GizmoControls';
import type { LevelData } from './LevelLoader';

export interface ViewportInterface {
	gizmo: GizmoControls;
	editing_parent: LevelNodeObject<LevelNodeGroup> | Scene | undefined;
	level: LevelData;
	renderer: WebGLRenderer;
	camera: Camera;
	modifier: (func: (level: Level) => Level) => void;
}

export interface Tool {
	readonly name: string;

	// return 'success'
	activate(viewport: ViewportInterface): boolean;
	deactivate?(): void;

	// return 'handled' to prevent default handling
	on_click?(e: MouseEvent): boolean;
	on_mouse_down?(e: MouseEvent): boolean;
	on_mouse_up?(e: MouseEvent): boolean;
	on_mouse_move?(e: MouseEvent): boolean;
	on_contextmenu?(e: MouseEvent): boolean;
	on_key_down?(e: KeyboardEvent): boolean;
	on_key_up?(e: KeyboardEvent): boolean;
}
