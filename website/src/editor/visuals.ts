import {
	isLevelNodeObject,
	LevelNodeObject,
	LineWithConnectionData,
} from '@/common/levelNodes';
import { Vector3toTHREE } from '@/common/utils';
import { LevelData } from '@/editor/LevelLoader';
import {
	triggerTargetData,
	triggerTargetHasKey,
} from '@grab-tools/lib/generated/nodes';
import {
	LevelNodeGASM,
	LevelNodeGroup,
	LevelNodeTrigger,
} from '@grab-tools/lib/generated/proto';
import {
	Box3,
	BoxGeometry,
	BufferGeometry,
	EdgesGeometry,
	Group,
	Line,
	LineBasicMaterial,
	LineSegments,
	Matrix4,
	Object3D,
	Points,
	PointsMaterial,
	Scene,
	Vector3,
} from 'three';

const points_options = {
	size: 3,
	sizeAttenuation: false,
};

const animation_path_color = 0x000099;
const current_animation_path_color = 0x0000ff;
const trigger_connection_color = 0xff8800;
const gasm_connection_color = 0x006600;
const group_bounds_color = 0x009900;
const current_group_bounds_color = 0x99ff00;

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
const trigger_connection_material = new LineBasicMaterial({
	color: trigger_connection_color,
});
const gasm_connection_material = new LineBasicMaterial({
	color: gasm_connection_color,
});
const group_bounds_material = new LineBasicMaterial({
	color: group_bounds_color,
});
const group_bounds_geometry = Object.assign(
	new EdgesGeometry(new BoxGeometry()),
	{ userData: { groupBoundsIgnore: true } },
);

export function add_animation_paths(level: LevelData, visible: boolean) {
	level.nodes.animated.forEach((object) => {
		object.userData.node.animations?.forEach(
			(_animation, animation_index) => {
				add_animation_path(object, animation_index, visible);
			},
		);
	});
}

export function add_animation_path(
	object: LevelNodeObject,
	animation_index: number,
	visible: boolean,
) {
	const animation = object.userData.node.animations?.[animation_index];
	if (!animation?.frames) return;

	const points = animation.frames.map((frame) =>
		Vector3toTHREE(frame.position),
	);
	const line_geometry = new BufferGeometry().setFromPoints(points);

	const is_current =
		animation_index === (object.userData.node.activeAnimation ?? 0);

	const path_line = Object.assign(
		new Line(
			line_geometry,
			is_current
				? current_animation_path_material
				: animation_path_material,
		),
		{ userData: { groupBoundsIgnore: true } },
	);
	const points_line = Object.assign(
		new Points(
			line_geometry,
			is_current
				? current_animation_points_material
				: animation_points_material,
		),
		{ userData: { groupBoundsIgnore: true } },
	);

	const path_group = Object.assign(new Group(), {
		userData: { object, groupBoundsIgnore: true },
	});
	path_group.add(path_line);
	path_group.add(points_line);
	path_group.visible = visible;
	path_group.position.copy(object.position);
	path_group.quaternion.copy(object.quaternion);

	(object.userData.animation_paths ??= []).push(path_group);
	(object.userData.relevant_animation_paths ??= []).push(path_group);

	object.parent!.add(path_group);
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

export function add_trigger_connections(level: LevelData, visible: boolean) {
	level.nodes.levelNodeTrigger.forEach((object) => {
		const targets = object.userData.node.levelNodeTrigger.triggerTargets;
		if (!targets) return;

		// collect target ids
		const ids: number[] = [];
		targets.forEach((target) => {
			if (triggerTargetHasKey(target, 'objectID')) {
				const target_data = triggerTargetData(target);
				if (target_data.objectID) ids.push(target_data.objectID);
			}
		});

		// add connections to targets
		ids.forEach((id) => {
			const target = level.nodes.all[id - 1];
			if (!target) return;
			add_trigger_connection(object, target, visible);
		});
	});
}

export function add_gasm_connections(level: LevelData, visible: boolean) {
	level.nodes.levelNodeGASM.forEach((object) => {
		const connections = object.userData.node.levelNodeGASM.connections;
		if (!connections) return;

		// collect target ids
		const ids: number[] = [];
		connections.forEach((connection) => {
			if (!connection.type && connection.objectID) {
				ids.push(connection.objectID);
			}
		});

		// add connections to targets
		ids.forEach((id) => {
			const target = level.nodes.all[id - 1];
			if (!target) return;
			add_gasm_connection(object, target, visible);
		});
	});
}

export function add_trigger_connection(
	object: LevelNodeObject<LevelNodeTrigger>,
	target_object: LevelNodeObject,
	visible: boolean,
) {
	const line = add_connection(
		object,
		target_object,
		trigger_connection_material,
		visible,
	);
	(object.userData.trigger_connections ??= []).push(line);
}

export function add_gasm_connection(
	object: LevelNodeObject<LevelNodeGASM>,
	target_object: LevelNodeObject,
	visible: boolean,
) {
	const line = add_connection(
		object,
		target_object,
		gasm_connection_material,
		visible,
	);
	(object.userData.gasm_connections ??= []).push(line);
}

function add_connection(
	object: LevelNodeObject,
	target_object: LevelNodeObject,
	material: LineBasicMaterial,
	visible: boolean,
) {
	const line = create_connection(object, target_object, material);

	line.visible = visible;

	add_relevant_connection(target_object, line);
	add_relevant_connection(object, line);

	// find scene and add the line to it
	let current: Object3D | Scene | null = object;
	while (current && !(current instanceof Scene)) {
		current = current.parent;
	}
	if (current) {
		current.add(line);
	}

	return line;
}

function create_connection(
	object: LevelNodeObject,
	target: LevelNodeObject,
	material: LineBasicMaterial,
) {
	const trigger_position = new Vector3();
	object.getWorldPosition(trigger_position);

	const target_position = new Vector3();
	target.getWorldPosition(target_position);

	const points = [trigger_position, target_position];
	const line_geometry = new BufferGeometry().setFromPoints(points);

	const line = Object.assign(new Line(line_geometry, material), {
		userData: { object, target, groupBoundsIgnore: true },
	});

	return line;
}

function add_relevant_connection(
	object: LevelNodeObject,
	connection: LineWithConnectionData,
) {
	let current: Object3D | null = object;
	while (isLevelNodeObject(current)) {
		(current.userData.relevant_connections ??= []).push(connection);
		current = current.parent;
	}
}

export function update_trigger_connections_visibility(
	object: LevelNodeObject<LevelNodeTrigger>,
	visible: boolean,
) {
	object.userData.trigger_connections?.forEach((path) => {
		path.visible = visible;
	});
}

export function update_gasm_connections_visibility(
	object: LevelNodeObject<LevelNodeGASM>,
	visible: boolean,
) {
	object.userData.gasm_connections?.forEach((path) => {
		path.visible = visible;
	});
}

export function update_connection_positions(objects: LevelNodeObject[]) {
	if (!objects.length) return;

	const lines = new Set<LineWithConnectionData>();
	objects.forEach((obj) => {
		obj.userData.relevant_connections?.forEach((line) => {
			lines.add(line);
		});
	});

	lines.forEach((line) => {
		const path_target = line.userData.target;
		const path_object = line.userData.object;

		const object_position = new Vector3();
		path_object.getWorldPosition(object_position);

		const target_position = new Vector3();
		path_target.getWorldPosition(target_position);

		// faster update avoiding internal checks
		const position = line.geometry.attributes.position!;
		position.setXYZ(
			0,
			object_position.x,
			object_position.y,
			object_position.z,
		);
		position.setXYZ(
			1,
			target_position.x,
			target_position.y,
			target_position.z,
		);
		position.needsUpdate = true;
	});
}

export function add_group_bounds(level: LevelData, visible: boolean) {
	level.nodes.levelNodeGroup.forEach((object) => {
		add_group_bound(object, visible);
	});
}

export function update_group_bound_visibility(
	object: LevelNodeObject<LevelNodeGroup>,
	visible: boolean,
) {
	if (object.userData.group_bounds) {
		object.userData.group_bounds.visible = visible;
	}
}

function get_group_bounds(object: LevelNodeObject<LevelNodeGroup>) {
	object.updateWorldMatrix(true, true);

	const box = new Box3();
	const inverse_matrix = object.matrixWorld.clone().invert();
	const matrix = new Matrix4();
	const vertex = new Vector3();

	object.traverse((child) => {
		if (child.userData.groupBoundsIgnore) return;

		const geometry = (
			child as Object3D & {
				geometry?: BufferGeometry;
			}
		).geometry;

		const position = geometry?.attributes.position;
		if (!position) return;

		matrix.multiplyMatrices(inverse_matrix, child.matrixWorld);

		for (let i = 0; i < position.count; i++) {
			vertex.fromBufferAttribute(position, i);
			vertex.applyMatrix4(matrix);
			box.expandByPoint(vertex);
		}
	});

	if (box.isEmpty()) return null;

	return {
		center: box.getCenter(new Vector3()),
		size: box.getSize(new Vector3()),
	};
}

export function add_group_bound(
	object: LevelNodeObject<LevelNodeGroup>,
	visible: boolean,
) {
	const bounds_data = get_group_bounds(object);
	if (!bounds_data) return;

	const bounds = Object.assign(
		new LineSegments(
			group_bounds_geometry,
			group_bounds_material.clone(), // to change the color
		),
		{ userData: { groupBoundsIgnore: true } },
	);

	bounds.position.copy(bounds_data.center);
	bounds.scale.copy(bounds_data.size);

	bounds.visible = visible;
	object.userData.group_bounds = bounds;

	object.add(bounds);
}

export function update_group_bounds_color(
	object: LevelNodeObject<LevelNodeGroup>,
	is_current: boolean,
) {
	object.userData.group_bounds?.material.color.set(
		is_current ? current_group_bounds_color : group_bounds_color,
	);
}

export function update_relevant_group_bounds(object: Object3D) {
	let current: Object3D | null = object;
	while (isLevelNodeObject(current)) {
		if (isLevelNodeObject(current, 'levelNodeGroup')) {
			const bounds = current.userData.group_bounds;
			if (bounds) {
				const bounds_data = get_group_bounds(current);

				if (bounds_data) {
					bounds.position.copy(bounds_data.center);
					bounds.scale.copy(bounds_data.size);
				}
			}
		}
		current = current.parent;
	}
}
