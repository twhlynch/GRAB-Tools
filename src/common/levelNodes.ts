import {
	InstructionDataType,
	LevelNode,
	OperandDataType,
	TriggerSource,
	TriggerTarget,
} from '@/generated/proto';
import { Root as PBRoot } from 'protobufjs';
import { Object3D, Quaternion, Vector3 } from 'three';

// helpers
type PropsStartingWith<T, Prefix extends string> = T[Extract<
	keyof T,
	`${Prefix}${string}`
>];

type StartingWith<Type, Prefix extends string> = {
	[Key in Extract<keyof Type, `${Prefix}${string}`>]: Type[Key];
};

type KeyMapping<Type, Key extends string> = StartingWith<Required<Type>, Key>;

type Exact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

type MatchesAnyType<K, T extends LevelNodeTypes[]> = T extends [
	infer Head,
	...infer Tail,
]
	? Exact<Required<Head>, Required<K>> extends true
		? true
		: Tail extends LevelNodeTypes[]
			? MatchesAnyType<K, Tail>
			: false
	: false;

// keys of LevelNode of type T
type KeysOfType<Type, SubType, Key extends string> = {
	[K in keyof KeyMapping<Type, Key>]: Exact<
		Required<SubType>,
		Required<KeyMapping<Type, Key>[K]>
	> extends true
		? K
		: never;
}[keyof KeyMapping<Type, Key>];

// LevelNode with specified LevelNodeX key required
export type LevelNodeWith<T> = LevelNode &
	Record<KeysOfType<LevelNode, T, 'levelNode'>, T>;

// all LevelNodeX types
export type LevelNodeTypes = NonNullable<
	PropsStartingWith<LevelNode, 'levelNode'>
>;

// same for trigger targets and sources
export type TriggerTargetWith<T> = TriggerTarget &
	Record<KeysOfType<TriggerTarget, T, 'triggerTarget'>, T>;
export type TriggerSourceWith<T> = TriggerSource &
	Record<KeysOfType<TriggerSource, T, 'triggerSource'>, T>;

export type TriggerTargetTypes = NonNullable<
	PropsStartingWith<TriggerTarget, 'triggerTarget'>
>;
export type TriggerSourceTypes = NonNullable<
	PropsStartingWith<TriggerSource, 'triggerSource'>
>;

// since its reused
type NodeMapping = KeyMapping<LevelNode, 'levelNode'>;

// > wow this sucks
// exclude specified LevelNodeX type
export type LevelNodeTypesExcept<T extends LevelNodeTypes> = NodeMapping[keyof {
	[L in {
		[K in keyof NodeMapping]: Exact<
			Required<T>,
			Required<NodeMapping[K]>
		> extends false
			? K
			: never;
	}[keyof NodeMapping]]: NonNullable<PropsStartingWith<LevelNode, L>>;
}];

// exclude multiple LevelNodeX types
export type LevelNodeTypesExcepts<T extends LevelNodeTypes[]> =
	NodeMapping[keyof {
		[L in {
			[K in keyof NodeMapping]: MatchesAnyType<
				NodeMapping[K],
				T
			> extends true
				? never
				: K;
		}[keyof NodeMapping]]: NonNullable<PropsStartingWith<LevelNode, L>>;
	}];

// type guards for LevelNodes
export function isLevelNode<T extends LevelNodeTypes>(
	node: LevelNode,
	key: KeysOfType<LevelNode, T, 'levelNode'>,
): node is LevelNodeWith<T> {
	return !!node[key];
}

// bidirectional map from enum
type EnumMap<E> = {
	[K in keyof E as K extends string ? K : never]: E[K];
} & Record<E[keyof E] & number, keyof E> &
	Record<string, number | keyof E>;

// protobuf.Root with assumed
export type Root = PBRoot & {
	COD: {
		Level: {
			LevelNodeMaterial: object;
			LevelNodeShape: object;
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
export type LevelNodeObject = Object3D & {
	initialPosition: Vector3;
	initialRotation: Quaternion;
	userData: {
		id: number;
		node: LevelNode;
	};
};

// type guards for LevelNodeObjects
export function isLevelNodeObject(
	object: Object3D | undefined,
): object is LevelNodeObject {
	return object?.userData.node;
}
