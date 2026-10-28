import {
	levelNode,
	levelNodeCrumbling,
	levelNodeFinish,
	levelNodeGASM,
	levelNodeGravity,
	levelNodeGroup,
	levelNodeLight,
	levelNodeLobbyTerminal,
	levelNodeParticleEmitter,
	levelNodeSign,
	levelNodeSound,
	levelNodeStart,
	levelNodeStatic,
	levelNodeTrigger,
	triggerSource,
	triggerSourceBasic,
	triggerSourceBlockNames,
	triggerTarget,
	triggerTargetAmbience,
	triggerTargetAnimation,
	triggerTargetGASM,
	triggerTargetLight,
	triggerTargetSound,
	triggerTargetSubLevel,
} from './helpers';
import {
	LevelNode,
	LevelNodeCrumbling,
	LevelNodeFinish,
	LevelNodeGASM,
	LevelNodeGravity,
	LevelNodeGroup,
	LevelNodeLight,
	LevelNodeLobbyTerminal,
	LevelNodeParticleEmitter,
	LevelNodeSign,
	LevelNodeSound,
	LevelNodeStart,
	LevelNodeStatic,
	LevelNodeTrigger,
	TriggerSource,
	TriggerSourceBasic,
	TriggerSourceBlockNames,
	TriggerTarget,
	TriggerTargetAmbience,
	TriggerTargetAnimation,
	TriggerTargetGASM,
	TriggerTargetLight,
	TriggerTargetSound,
	TriggerTargetSubLevel,
} from './proto';

import {
	AllKeys,
	KeyMapping,
	KeysOfType,
	PropsStartingWith,
	TypesExcept,
} from './util';

export type LevelNodeWith<T> = LevelNode &
	Record<KeysOfType<LevelNode, T, 'levelNode'>, T>;
export type LevelNodeTypes = NonNullable<
	PropsStartingWith<LevelNode, 'levelNode'>
>;

export type LevelNodeKey = keyof KeyMapping<LevelNode, 'levelNode'>;
export type LevelNodeTypeFor<K extends LevelNodeKey> = KeyMapping<
	LevelNode,
	'levelNode'
>[K];

export type LevelNodeTypesExcept<T extends LevelNodeTypes[]> = TypesExcept<
	LevelNode,
	'levelNode',
	LevelNodeTypes,
	T
>;

export function levelNodeWith<T extends LevelNodeTypes>(
	nodeData: Partial<LevelNodeWith<T>>,
): LevelNodeWith<T> {
	return levelNode(nodeData) as LevelNodeWith<T>;
}
export type LevelNodeWithAny = {
	[K in LevelNodeKey]: LevelNodeWith<LevelNodeTypeFor<K>>;
}[LevelNodeKey];

export type LevelNodeDataSlot<N> = {
	[P in LevelNodeKey]: N extends Record<P, LevelNodeTypeFor<P>> ? P : never;
}[LevelNodeKey];

export type LevelNodeDataOf<N extends LevelNode> = [
	LevelNodeDataSlot<N>,
] extends [never]
	? LevelNodeTypes
	: LevelNodeTypeFor<LevelNodeDataSlot<N>>;

export function levelNodeData<N extends LevelNode>(node: N): LevelNodeDataOf<N>;
export function levelNodeData<T extends LevelNodeTypes>(
	node: LevelNodeWith<T>,
): T;
export function levelNodeData(node: LevelNodeWithAny): LevelNodeTypes;
export function levelNodeData(node: LevelNode): LevelNodeTypes | undefined;
export function levelNodeData(node: LevelNode): LevelNodeTypes | undefined {
	return Object.entries(node).find(
		([key, val]) => key.startsWith('levelNode') && !!val,
	)?.[1] as LevelNodeTypes | undefined;
}

export function isLevelNode<K extends LevelNodeKey>(
	node: LevelNode,
	key: K,
): node is LevelNodeWith<LevelNodeTypeFor<K>>;
export function isLevelNode(node: LevelNode): node is LevelNodeWithAny;
export function isLevelNode(node: LevelNode, key?: LevelNodeKey): boolean {
	if (key !== undefined) {
		return !!node[key];
	}
	return Object.entries(node).some(
		([k, v]) => k.startsWith('levelNode') && !!v,
	);
}

export type LevelNodeDataKey = AllKeys<LevelNodeTypes>;

export type LevelNodesWithKey<K extends LevelNodeDataKey> = {
	[P in LevelNodeKey]: K extends keyof LevelNodeTypeFor<P> ? P : never;
}[LevelNodeKey];

export type LevelNodeWithKey<K extends LevelNodeDataKey> = {
	[P in LevelNodesWithKey<K>]: LevelNodeWith<LevelNodeTypeFor<P>> &
		Partial<Record<Exclude<LevelNodeKey, P>, undefined>>;
}[LevelNodesWithKey<K>];

const levelNode_slots: Record<LevelNodeDataKey, readonly LevelNodeKey[]> = {
	position: [
		'levelNodeGroup',
		'levelNodeStart',
		'levelNodeFinish',
		'levelNodeStatic',
		'levelNodeCrumbling',
		'levelNodeSign',
		'levelNodeGravity',
		'levelNodeLobbyTerminal',
		'levelNodeParticleEmitter',
		'levelNodeTrigger',
		'levelNodeSound',
		'levelNodeGASM',
		'levelNodeLight',
	],
	scale: [
		'levelNodeGroup',
		'levelNodeStatic',
		'levelNodeCrumbling',
		'levelNodeSign',
		'levelNodeGravity',
		'levelNodeParticleEmitter',
		'levelNodeTrigger',
		'levelNodeGASM',
	],
	rotation: [
		'levelNodeGroup',
		'levelNodeStart',
		'levelNodeStatic',
		'levelNodeCrumbling',
		'levelNodeSign',
		'levelNodeGravity',
		'levelNodeLobbyTerminal',
		'levelNodeParticleEmitter',
		'levelNodeTrigger',
		'levelNodeSound',
		'levelNodeGASM',
		'levelNodeLight',
	],
	childNodes: ['levelNodeGroup'],
	name: ['levelNodeGroup', 'levelNodeStart', 'levelNodeSound'],
	physicsObject: ['levelNodeGroup'],
	localPhysicsObject: ['levelNodeGroup'],
	mass: ['levelNodeGroup'],
	radius: ['levelNodeStart', 'levelNodeFinish'],
	isHidden: ['levelNodeStart'],
	shape: ['levelNodeStatic', 'levelNodeCrumbling', 'levelNodeTrigger'],
	material: ['levelNodeStatic', 'levelNodeCrumbling'],
	color1: ['levelNodeStatic'],
	isNeon: ['levelNodeStatic', 'levelNodeSign'],
	isTransparent: ['levelNodeStatic'],
	color2: ['levelNodeStatic'],
	isGrabbable: ['levelNodeStatic'],
	isGrapplable: ['levelNodeStatic'],
	isPassable: ['levelNodeStatic'],
	isGradient: ['levelNodeStatic'],
	gradientDirection: ['levelNodeStatic'],
	specularBrightness: ['levelNodeStatic'],
	isAdditive: ['levelNodeStatic'],
	stableTime: ['levelNodeCrumbling'],
	respawnTime: ['levelNodeCrumbling'],
	isLocal: ['levelNodeCrumbling'],
	text: ['levelNodeSign'],
	color: ['levelNodeSign', 'levelNodeLight'],
	hideModel: ['levelNodeSign'],
	weight: ['levelNodeSign'],
	mode: ['levelNodeGravity'],
	direction: ['levelNodeGravity'],
	hideParticles: ['levelNodeGravity'],
	particlesPerSecond: ['levelNodeParticleEmitter'],
	lifeSpan: ['levelNodeParticleEmitter'],
	startColor: ['levelNodeParticleEmitter'],
	endColor: ['levelNodeParticleEmitter'],
	startSize: ['levelNodeParticleEmitter'],
	endSize: ['levelNodeParticleEmitter'],
	velocity: ['levelNodeParticleEmitter'],
	velocityMin: ['levelNodeParticleEmitter'],
	velocityMax: ['levelNodeParticleEmitter'],
	accelerationMin: ['levelNodeParticleEmitter'],
	accelerationMax: ['levelNodeParticleEmitter'],
	isShared: ['levelNodeTrigger', 'levelNodeGASM'],
	triggerSources: ['levelNodeTrigger'],
	triggerTargets: ['levelNodeTrigger'],
	parameters: ['levelNodeSound'],
	repeat: ['levelNodeSound'],
	volume: ['levelNodeSound'],
	startActive: ['levelNodeSound', 'levelNodeGASM'],
	maxRangeFactor: ['levelNodeSound'],
	program: ['levelNodeGASM'],
	connections: ['levelNodeGASM'],
	lateUpdate: ['levelNodeGASM'],
	type: ['levelNodeLight'],
	intensity: ['levelNodeLight'],
	range: ['levelNodeLight'],
	angle: ['levelNodeLight'],
	distanceFalloffShape: ['levelNodeLight'],
	coneFalloffShape: ['levelNodeLight'],
	creationOrder: ['levelNodeLight'],
};

export function levelNodeHasKey<K extends LevelNodeDataKey>(
	node: LevelNode,
	key: K,
): node is LevelNodeWithKey<K> {
	return levelNode_slots[key].some((slot) => !!node[slot]);
}

export type TriggerSourceWith<T> = TriggerSource &
	Record<KeysOfType<TriggerSource, T, 'triggerSource'>, T>;
export type TriggerSourceTypes = NonNullable<
	PropsStartingWith<TriggerSource, 'triggerSource'>
>;

export type TriggerSourceKey = keyof KeyMapping<TriggerSource, 'triggerSource'>;
export type TriggerSourceTypeFor<K extends TriggerSourceKey> = KeyMapping<
	TriggerSource,
	'triggerSource'
>[K];

export type TriggerSourceTypesExcept<T extends TriggerSourceTypes[]> =
	TypesExcept<TriggerSource, 'triggerSource', TriggerSourceTypes, T>;

export function triggerSourceWith<T extends TriggerSourceTypes>(
	nodeData: Partial<TriggerSourceWith<T>>,
): TriggerSourceWith<T> {
	return triggerSource(nodeData) as TriggerSourceWith<T>;
}
export type TriggerSourceWithAny = {
	[K in TriggerSourceKey]: TriggerSourceWith<TriggerSourceTypeFor<K>>;
}[TriggerSourceKey];

export type TriggerSourceDataSlot<N> = {
	[P in TriggerSourceKey]: N extends Record<P, TriggerSourceTypeFor<P>>
		? P
		: never;
}[TriggerSourceKey];

export type TriggerSourceDataOf<N extends TriggerSource> = [
	TriggerSourceDataSlot<N>,
] extends [never]
	? TriggerSourceTypes
	: TriggerSourceTypeFor<TriggerSourceDataSlot<N>>;

export function triggerSourceData<N extends TriggerSource>(
	node: N,
): TriggerSourceDataOf<N>;
export function triggerSourceData<T extends TriggerSourceTypes>(
	node: TriggerSourceWith<T>,
): T;
export function triggerSourceData(
	node: TriggerSourceWithAny,
): TriggerSourceTypes;
export function triggerSourceData(
	node: TriggerSource,
): TriggerSourceTypes | undefined;
export function triggerSourceData(
	node: TriggerSource,
): TriggerSourceTypes | undefined {
	return Object.entries(node).find(
		([key, val]) => key.startsWith('triggerSource') && !!val,
	)?.[1] as TriggerSourceTypes | undefined;
}

export function isTriggerSource<K extends TriggerSourceKey>(
	node: TriggerSource,
	key: K,
): node is TriggerSourceWith<TriggerSourceTypeFor<K>>;
export function isTriggerSource(
	node: TriggerSource,
): node is TriggerSourceWithAny;
export function isTriggerSource(
	node: TriggerSource,
	key?: TriggerSourceKey,
): boolean {
	if (key !== undefined) {
		return !!node[key];
	}
	return Object.entries(node).some(
		([k, v]) => k.startsWith('triggerSource') && !!v,
	);
}

export type TriggerSourceDataKey = AllKeys<TriggerSourceTypes>;

export type TriggerSourcesWithKey<K extends TriggerSourceDataKey> = {
	[P in TriggerSourceKey]: K extends keyof TriggerSourceTypeFor<P>
		? P
		: never;
}[TriggerSourceKey];

export type TriggerSourceWithKey<K extends TriggerSourceDataKey> = {
	[P in TriggerSourcesWithKey<K>]: TriggerSourceWith<
		TriggerSourceTypeFor<P>
	> &
		Partial<Record<Exclude<TriggerSourceKey, P>, undefined>>;
}[TriggerSourcesWithKey<K>];

const triggerSource_slots: Record<
	TriggerSourceDataKey,
	readonly TriggerSourceKey[]
> = {
	type: ['triggerSourceBasic'],
	names: ['triggerSourceBlockNames'],
};

export function triggerSourceHasKey<K extends TriggerSourceDataKey>(
	node: TriggerSource,
	key: K,
): node is TriggerSourceWithKey<K> {
	return triggerSource_slots[key].some((slot) => !!node[slot]);
}

export type TriggerTargetWith<T> = TriggerTarget &
	Record<KeysOfType<TriggerTarget, T, 'triggerTarget'>, T>;
export type TriggerTargetTypes = NonNullable<
	PropsStartingWith<TriggerTarget, 'triggerTarget'>
>;

export type TriggerTargetKey = keyof KeyMapping<TriggerTarget, 'triggerTarget'>;
export type TriggerTargetTypeFor<K extends TriggerTargetKey> = KeyMapping<
	TriggerTarget,
	'triggerTarget'
>[K];

export type TriggerTargetTypesExcept<T extends TriggerTargetTypes[]> =
	TypesExcept<TriggerTarget, 'triggerTarget', TriggerTargetTypes, T>;

export function triggerTargetWith<T extends TriggerTargetTypes>(
	nodeData: Partial<TriggerTargetWith<T>>,
): TriggerTargetWith<T> {
	return triggerTarget(nodeData) as TriggerTargetWith<T>;
}
export type TriggerTargetWithAny = {
	[K in TriggerTargetKey]: TriggerTargetWith<TriggerTargetTypeFor<K>>;
}[TriggerTargetKey];

export type TriggerTargetDataSlot<N> = {
	[P in TriggerTargetKey]: N extends Record<P, TriggerTargetTypeFor<P>>
		? P
		: never;
}[TriggerTargetKey];

export type TriggerTargetDataOf<N extends TriggerTarget> = [
	TriggerTargetDataSlot<N>,
] extends [never]
	? TriggerTargetTypes
	: TriggerTargetTypeFor<TriggerTargetDataSlot<N>>;

export function triggerTargetData<N extends TriggerTarget>(
	node: N,
): TriggerTargetDataOf<N>;
export function triggerTargetData<T extends TriggerTargetTypes>(
	node: TriggerTargetWith<T>,
): T;
export function triggerTargetData(
	node: TriggerTargetWithAny,
): TriggerTargetTypes;
export function triggerTargetData(
	node: TriggerTarget,
): TriggerTargetTypes | undefined;
export function triggerTargetData(
	node: TriggerTarget,
): TriggerTargetTypes | undefined {
	return Object.entries(node).find(
		([key, val]) => key.startsWith('triggerTarget') && !!val,
	)?.[1] as TriggerTargetTypes | undefined;
}

export function isTriggerTarget<K extends TriggerTargetKey>(
	node: TriggerTarget,
	key: K,
): node is TriggerTargetWith<TriggerTargetTypeFor<K>>;
export function isTriggerTarget(
	node: TriggerTarget,
): node is TriggerTargetWithAny;
export function isTriggerTarget(
	node: TriggerTarget,
	key?: TriggerTargetKey,
): boolean {
	if (key !== undefined) {
		return !!node[key];
	}
	return Object.entries(node).some(
		([k, v]) => k.startsWith('triggerTarget') && !!v,
	);
}

export type TriggerTargetDataKey = AllKeys<TriggerTargetTypes>;

export type TriggerTargetsWithKey<K extends TriggerTargetDataKey> = {
	[P in TriggerTargetKey]: K extends keyof TriggerTargetTypeFor<P>
		? P
		: never;
}[TriggerTargetKey];

export type TriggerTargetWithKey<K extends TriggerTargetDataKey> = {
	[P in TriggerTargetsWithKey<K>]: TriggerTargetWith<
		TriggerTargetTypeFor<P>
	> &
		Partial<Record<Exclude<TriggerTargetKey, P>, undefined>>;
}[TriggerTargetsWithKey<K>];

const triggerTarget_slots: Record<
	TriggerTargetDataKey,
	readonly TriggerTargetKey[]
> = {
	objectID: [
		'triggerTargetAnimation',
		'triggerTargetSound',
		'triggerTargetGASM',
		'triggerTargetLight',
	],
	animationName: ['triggerTargetAnimation'],
	loop: ['triggerTargetAnimation'],
	reverse: ['triggerTargetAnimation'],
	mode: ['triggerTargetAnimation', 'triggerTargetSound', 'triggerTargetGASM'],
	repeat: ['triggerTargetSound'],
	color: ['triggerTargetLight'],
	range: ['triggerTargetLight'],
	brightness: ['triggerTargetLight'],
	fadeDuration: ['triggerTargetLight'],
	levelIdentifier: ['triggerTargetSubLevel'],
	spawnPoint: ['triggerTargetSubLevel'],
	skyColor0: ['triggerTargetAmbience'],
	skyColor1: ['triggerTargetAmbience'],
	sunAltitude: ['triggerTargetAmbience'],
	sunAzimuth: ['triggerTargetAmbience'],
	sunSize: ['triggerTargetAmbience'],
	fogDensity: ['triggerTargetAmbience'],
	changeDuration: ['triggerTargetAmbience'],
	interpolationType: ['triggerTargetAmbience'],
	useAdvancedSunSettings: ['triggerTargetAmbience'],
	sunColor: ['triggerTargetAmbience'],
	sunBrightness: ['triggerTargetAmbience'],
	ambientColor: ['triggerTargetAmbience'],
	ambientBrightness: ['triggerTargetAmbience'],
	starDensity: ['triggerTargetAmbience'],
	starClustering: ['triggerTargetAmbience'],
	starRotationEuler: ['triggerTargetAmbience'],
	starSize: ['triggerTargetAmbience'],
	starVisibility: ['triggerTargetAmbience'],
};

export function triggerTargetHasKey<K extends TriggerTargetDataKey>(
	node: TriggerTarget,
	key: K,
): node is TriggerTargetWithKey<K> {
	return triggerTarget_slots[key].some((slot) => !!node[slot]);
}

export function levelNodeWithGroup(overrides?: Partial<LevelNodeGroup>) {
	return levelNodeWith({
		levelNodeGroup: levelNodeGroup(overrides),
	});
}
export function isLevelNodeGroup(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeGroup> {
	return !!node.levelNodeGroup;
}

export function levelNodeWithStart(overrides?: Partial<LevelNodeStart>) {
	return levelNodeWith({
		levelNodeStart: levelNodeStart(overrides),
	});
}
export function isLevelNodeStart(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeStart> {
	return !!node.levelNodeStart;
}

export function levelNodeWithFinish(overrides?: Partial<LevelNodeFinish>) {
	return levelNodeWith({
		levelNodeFinish: levelNodeFinish(overrides),
	});
}
export function isLevelNodeFinish(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeFinish> {
	return !!node.levelNodeFinish;
}

export function levelNodeWithStatic(overrides?: Partial<LevelNodeStatic>) {
	return levelNodeWith({
		levelNodeStatic: levelNodeStatic(overrides),
	});
}
export function isLevelNodeStatic(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeStatic> {
	return !!node.levelNodeStatic;
}

export function levelNodeWithCrumbling(
	overrides?: Partial<LevelNodeCrumbling>,
) {
	return levelNodeWith({
		levelNodeCrumbling: levelNodeCrumbling(overrides),
	});
}
export function isLevelNodeCrumbling(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeCrumbling> {
	return !!node.levelNodeCrumbling;
}

export function levelNodeWithSign(overrides?: Partial<LevelNodeSign>) {
	return levelNodeWith({
		levelNodeSign: levelNodeSign(overrides),
	});
}
export function isLevelNodeSign(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeSign> {
	return !!node.levelNodeSign;
}

export function levelNodeWithGravity(overrides?: Partial<LevelNodeGravity>) {
	return levelNodeWith({
		levelNodeGravity: levelNodeGravity(overrides),
	});
}
export function isLevelNodeGravity(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeGravity> {
	return !!node.levelNodeGravity;
}

export function levelNodeWithLobbyTerminal(
	overrides?: Partial<LevelNodeLobbyTerminal>,
) {
	return levelNodeWith({
		levelNodeLobbyTerminal: levelNodeLobbyTerminal(overrides),
	});
}
export function isLevelNodeLobbyTerminal(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeLobbyTerminal> {
	return !!node.levelNodeLobbyTerminal;
}

export function levelNodeWithParticleEmitter(
	overrides?: Partial<LevelNodeParticleEmitter>,
) {
	return levelNodeWith({
		levelNodeParticleEmitter: levelNodeParticleEmitter(overrides),
	});
}
export function isLevelNodeParticleEmitter(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeParticleEmitter> {
	return !!node.levelNodeParticleEmitter;
}

export function triggerSourceWithBasic(
	overrides?: Partial<TriggerSourceBasic>,
) {
	return triggerSourceWith({
		triggerSourceBasic: triggerSourceBasic(overrides),
	});
}
export function isTriggerSourceBasic(
	node: TriggerSource,
): node is TriggerSourceWith<TriggerSourceBasic> {
	return !!node.triggerSourceBasic;
}

export function triggerSourceWithBlockNames(
	overrides?: Partial<TriggerSourceBlockNames>,
) {
	return triggerSourceWith({
		triggerSourceBlockNames: triggerSourceBlockNames(overrides),
	});
}
export function isTriggerSourceBlockNames(
	node: TriggerSource,
): node is TriggerSourceWith<TriggerSourceBlockNames> {
	return !!node.triggerSourceBlockNames;
}

export function triggerTargetWithAnimation(
	overrides?: Partial<TriggerTargetAnimation>,
) {
	return triggerTargetWith({
		triggerTargetAnimation: triggerTargetAnimation(overrides),
	});
}
export function isTriggerTargetAnimation(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetAnimation> {
	return !!node.triggerTargetAnimation;
}

export function triggerTargetWithSound(
	overrides?: Partial<TriggerTargetSound>,
) {
	return triggerTargetWith({
		triggerTargetSound: triggerTargetSound(overrides),
	});
}
export function isTriggerTargetSound(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetSound> {
	return !!node.triggerTargetSound;
}

export function triggerTargetWithGASM(overrides?: Partial<TriggerTargetGASM>) {
	return triggerTargetWith({
		triggerTargetGASM: triggerTargetGASM(overrides),
	});
}
export function isTriggerTargetGASM(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetGASM> {
	return !!node.triggerTargetGASM;
}

export function triggerTargetWithLight(
	overrides?: Partial<TriggerTargetLight>,
) {
	return triggerTargetWith({
		triggerTargetLight: triggerTargetLight(overrides),
	});
}
export function isTriggerTargetLight(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetLight> {
	return !!node.triggerTargetLight;
}

export function triggerTargetWithSubLevel(
	overrides?: Partial<TriggerTargetSubLevel>,
) {
	return triggerTargetWith({
		triggerTargetSubLevel: triggerTargetSubLevel(overrides),
	});
}
export function isTriggerTargetSubLevel(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetSubLevel> {
	return !!node.triggerTargetSubLevel;
}

export function triggerTargetWithAmbience(
	overrides?: Partial<TriggerTargetAmbience>,
) {
	return triggerTargetWith({
		triggerTargetAmbience: triggerTargetAmbience(overrides),
	});
}
export function isTriggerTargetAmbience(
	node: TriggerTarget,
): node is TriggerTargetWith<TriggerTargetAmbience> {
	return !!node.triggerTargetAmbience;
}

export function levelNodeWithTrigger(overrides?: Partial<LevelNodeTrigger>) {
	return levelNodeWith({
		levelNodeTrigger: levelNodeTrigger(overrides),
	});
}
export function isLevelNodeTrigger(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeTrigger> {
	return !!node.levelNodeTrigger;
}

export function levelNodeWithSound(overrides?: Partial<LevelNodeSound>) {
	return levelNodeWith({
		levelNodeSound: levelNodeSound(overrides),
	});
}
export function isLevelNodeSound(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeSound> {
	return !!node.levelNodeSound;
}

export function levelNodeWithGASM(overrides?: Partial<LevelNodeGASM>) {
	return levelNodeWith({
		levelNodeGASM: levelNodeGASM(overrides),
	});
}
export function isLevelNodeGASM(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeGASM> {
	return !!node.levelNodeGASM;
}

export function levelNodeWithLight(overrides?: Partial<LevelNodeLight>) {
	return levelNodeWith({
		levelNodeLight: levelNodeLight(overrides),
	});
}
export function isLevelNodeLight(
	node: LevelNode,
): node is LevelNodeWith<LevelNodeLight> {
	return !!node.levelNodeLight;
}
