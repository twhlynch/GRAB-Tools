import { LevelNode } from '@/generated/proto';
import { Root as PBRoot } from 'protobufjs';

// helpers
type PropsStartingWith<T, Prefix extends string> = T[Extract<
	keyof T,
	`${Prefix}${string}`
>];

type StartingWith<T, Prefix extends string> = {
	[K in Extract<keyof T, `${Prefix}${string}`>]: T[K];
};

type NodesMapping = StartingWith<Required<LevelNode>, 'levelNode'>;

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
type KeysOfType<T> = {
	[K in keyof NodesMapping]: Exact<
		Required<T>,
		Required<NodesMapping[K]>
	> extends true
		? K
		: never;
}[keyof NodesMapping];

// LevelNode with specified LevelNodeX key required
export type LevelNodeWith<T> = LevelNode & {
	[L in KeysOfType<T>]: T;
};

// all LevelNodeX types
export type LevelNodeTypes = NonNullable<
	PropsStartingWith<LevelNode, 'levelNode'>
>;

// > wow this sucks
// exclude specified LevelNodeX type
export type LevelNodeTypesExcept<T extends LevelNodeTypes> =
	NodesMapping[keyof {
		[L in {
			[K in keyof NodesMapping]: Exact<
				Required<T>,
				Required<NodesMapping[K]>
			> extends false
				? K
				: never;
		}[keyof NodesMapping]]: NonNullable<PropsStartingWith<LevelNode, L>>;
	}];

// exclude multiple LevelNodeX types
export type LevelNodeTypesExcepts<T extends LevelNodeTypes[]> =
	NodesMapping[keyof {
		[L in {
			[K in keyof NodesMapping]: MatchesAnyType<
				NodesMapping[K],
				T
			> extends true
				? never
				: K;
		}[keyof NodesMapping]]: NonNullable<PropsStartingWith<LevelNode, L>>;
	}];

// type guards for LevelNodes
export function isLevelNode<T extends LevelNodeTypes>(
	node: LevelNode,
	key: KeysOfType<T>,
): node is LevelNodeWith<T> {
	return !!node[key];
}

// protobuf.Root with assumed
export type Root = PBRoot & {
	COD: {
		Level: {
			LevelNodeMaterial: object;
			LevelNodeShape: object;
		};
	};
};
