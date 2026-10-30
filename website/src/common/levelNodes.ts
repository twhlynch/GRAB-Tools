import {
	isLevelNode,
	LevelNodeKey,
	LevelNodeTypeFor,
	LevelNodeTypes,
	LevelNodeWith,
	LevelNodeWithAny,
} from '@grab-tools/lib/generated/nodes';
import {
	Animation,
	InstructionDataType,
	LevelNode,
	LevelNodeMaterial,
	LevelNodeShape,
	OperandDataType,
} from '@grab-tools/lib/generated/proto';
import { Root as PBRoot, Type } from 'protobufjs';
import {
	Group,
	IUniform,
	Line,
	LineSegments,
	Mesh,
	Object3D,
	Quaternion,
	ShaderMaterial,
	Vector3,
} from 'three';
import { isObject3D } from './utils';

// bidirectional map from enum
type EnumMap<E> = {
	[K in keyof E as K extends string ? K : never]: E[K];
} & Record<E[keyof E] & number, keyof E> &
	Record<string, number | keyof E>;

// protobuf.Root with assumed
export type Root = PBRoot & {
	COD: {
		Level: {
			LevelNode: Type & {
				oneofs: {
					content: {
						fieldsArray: { name: LevelNodeKey }[];
						oneof: LevelNodeKey[];
					};
				};
			};
			LevelNodeMaterial: typeof LevelNodeMaterial;
			LevelNodeShape: typeof LevelNodeShape;
			InstructionData: {
				Type: EnumMap<typeof InstructionDataType>;
			};
			OperandData: {
				Type: EnumMap<typeof OperandDataType>;
			};
		};
	};
};

// object type
// - all of Object3D
// - optionally Mesh exclusing material
// - shader material
// - other custom properties
// - is<Node>
export type LevelNodeObject<T extends LevelNodeTypes = never> = Partial<
	Omit<Mesh, 'material' | keyof Object3D>
> &
	Object3D & {
		material?: ShaderMaterial & {
			uniforms: {
				fogEnabled: IUniform<number>;
				isSelected: IUniform<boolean>;
			};
		};
		initialPosition: Vector3;
		initialRotation: Quaternion;
		userData: {
			id: number;
			node: [T] extends [never] ? LevelNodeWithAny : LevelNodeWith<T>;
			animation?: Animation;
			currentFrameIndex?: number;
			update?: (delta: number) => void;

			animation_paths?: Group[];
			relevant_animation_paths?: (Group & {
				userData: { object: LevelNodeObject };
			})[];
			relevant_connections?: Line[];
			trigger_connections?: Line[];
			gasm_connections?: Line[];
			group_bounds?: LineSegments;
		} & {
			[
				K in LevelNodeKey as K extends `levelNode${infer S}`
					? `is${S}`
					: K
			]?: boolean;
		};
	};

// type guards for LevelNodeObjects
export function isLevelNodeObject<K extends LevelNodeKey>(
	object: unknown,
	key: K,
): object is LevelNodeObject<LevelNodeTypeFor<K>>;
export function isLevelNodeObject(object: unknown): object is LevelNodeObject;
export function isLevelNodeObject(
	object: unknown,
	key?: LevelNodeKey,
): boolean {
	return (
		isObject3D(object) &&
		'node' in object.userData &&
		(key
			? isLevelNode(object.userData.node as LevelNode, key)
			: isLevelNode(object.userData.node as LevelNode))
	);
}
