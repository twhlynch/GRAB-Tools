import {
	BufferGeometry,
	Group,
	Line,
	LineBasicMaterial,
	Points,
	PointsMaterial,
} from 'three';
import { LevelNodeObject } from './levelNodes';
import { Vector3toTHREE } from './utils';

const points_options = {
	size: 3,
	sizeAttenuation: false,
};

const animation_path_color = 0x000099;
const current_animation_path_color = 0x0000ff;

const animation_path_material = new LineBasicMaterial({
	color: animation_path_color,
});
const animation_points_material = new PointsMaterial({
	color: animation_path_color,
	...points_options,
});
const current_animation_points_material = new PointsMaterial({
	color: current_animation_path_color,
	...points_options,
});
const current_animation_path_material = new LineBasicMaterial({
	color: current_animation_path_color,
});

export function add_animation_paths(object: LevelNodeObject, visible: boolean) {
	object.userData.node.animations?.forEach((animation, animation_index) => {
		if (!animation.frames) return;

		const points = animation.frames.map((frame) =>
			Vector3toTHREE(frame.position),
		);
		const line_geometry = new BufferGeometry().setFromPoints(points);

		const is_current =
			animation_index === (object.userData.node.activeAnimation ?? 0);

		const path_line = new Line(
			line_geometry,
			is_current
				? current_animation_path_material
				: animation_path_material,
		);
		const points_line = new Points(
			line_geometry,
			is_current
				? current_animation_points_material
				: animation_points_material,
		);

		const path_group = Object.assign(new Group(), {
			userData: { object },
		});
		path_group.add(path_line);
		path_group.add(points_line);
		path_group.visible = visible;
		path_group.position.copy(object.position);
		path_group.quaternion.copy(object.quaternion);

		(object.userData.animation_paths ??= []).push(path_group);
		(object.userData.relevant_animation_paths ??= []).push(path_group);

		object.parent!.add(path_group);
	});
}

export function update_animation_paths_transforms(object: LevelNodeObject) {
	const paths = object.userData.relevant_animation_paths;
	if (!paths) return;

	paths.forEach((path) => {
		path.position.copy(path.userData.object.position);
		path.quaternion.copy(path.userData.object.quaternion);
	});
}

export function update_animation_paths_visibility(
	object: LevelNodeObject,
	visible: boolean,
) {
	object.userData.animation_paths?.forEach((path) => {
		path.visible = visible;
	});
}

