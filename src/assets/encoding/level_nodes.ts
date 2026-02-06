import {
	levelNode,
	levelNodeCrumbling,
	levelNodeFinish,
	levelNodeGASM,
	levelNodeGravity,
	levelNodeGroup,
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
	triggerTargetSound,
	triggerTargetSubLevel,
} from '@/generated/helpers';
import {
	LevelNodeCrumbling,
	LevelNodeFinish,
	LevelNodeGASM,
	LevelNodeGravity,
	LevelNodeGroup,
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
	TriggerTargetSound,
	TriggerTargetSubLevel,
} from '@/generated/proto';
import { LevelNodeTypes, LevelNodeWith } from '@/types/levelNodes';

export function levelNodeWith<T extends LevelNodeTypes>(
	nodeData: Partial<LevelNodeWith<T>>,
): LevelNodeWith<T> {
	return levelNode(nodeData) as LevelNodeWith<T>;
}

export function levelNodeWithCrumbling(
	overrides?: Partial<LevelNodeCrumbling>,
) {
	return levelNodeWith<LevelNodeCrumbling>({
		levelNodeCrumbling: levelNodeCrumbling(overrides),
	});
}
export function levelNodeWithFinish(overrides?: Partial<LevelNodeFinish>) {
	return levelNodeWith<LevelNodeFinish>({
		levelNodeFinish: levelNodeFinish(overrides),
	});
}
export function levelNodeWithGASM(overrides?: Partial<LevelNodeGASM>) {
	return levelNodeWith<LevelNodeGASM>({
		levelNodeGASM: levelNodeGASM(overrides),
	});
}
export function levelNodeWithGravity(overrides?: Partial<LevelNodeGravity>) {
	return levelNodeWith<LevelNodeGravity>({
		levelNodeGravity: levelNodeGravity(overrides),
	});
}
export function levelNodeWithGroup(overrides?: Partial<LevelNodeGroup>) {
	return levelNodeWith<LevelNodeGroup>({
		levelNodeGroup: levelNodeGroup(overrides),
	});
}
export function levelNodeWithLobbyTerminal(
	overrides?: Partial<LevelNodeLobbyTerminal>,
) {
	return levelNodeWith<LevelNodeLobbyTerminal>({
		levelNodeLobbyTerminal: levelNodeLobbyTerminal(overrides),
	});
}
export function levelNodeWithParticleEmitter(
	overrides?: Partial<LevelNodeParticleEmitter>,
) {
	return levelNodeWith<LevelNodeParticleEmitter>({
		levelNodeParticleEmitter: levelNodeParticleEmitter(overrides),
	});
}
export function levelNodeWithSign(overrides?: Partial<LevelNodeSign>) {
	return levelNodeWith<LevelNodeSign>({
		levelNodeSign: levelNodeSign(overrides),
	});
}
export function levelNodeWithSound(overrides?: Partial<LevelNodeSound>) {
	return levelNodeWith<LevelNodeSound>({
		levelNodeSound: levelNodeSound(overrides),
	});
}
export function levelNodeWithStart(overrides?: Partial<LevelNodeStart>) {
	return levelNodeWith<LevelNodeStart>({
		levelNodeStart: levelNodeStart(overrides),
	});
}
export function levelNodeWithStatic(overrides?: Partial<LevelNodeStatic>) {
	return levelNodeWith<LevelNodeStatic>({
		levelNodeStatic: levelNodeStatic(overrides),
	});
}
export function levelNodeWithTrigger(overrides?: Partial<LevelNodeTrigger>) {
	return levelNodeWith<LevelNodeTrigger>({
		levelNodeTrigger: levelNodeTrigger(overrides),
	});
}

export function triggerTargetWith(target: TriggerTarget): TriggerTarget {
	return triggerTarget(target);
}

export function triggerTargetWithAnimation(
	overrides?: Partial<TriggerTargetAnimation>,
) {
	return triggerTargetWith({
		triggerTargetAnimation: triggerTargetAnimation(overrides),
	});
}
export function triggerTargetWithGASM(overrides?: Partial<TriggerTargetGASM>) {
	return triggerTargetWith({
		triggerTargetGASM: triggerTargetGASM(overrides),
	});
}
export function triggerTargetWithAmbience(
	overrides?: Partial<TriggerTargetAmbience>,
) {
	return triggerTargetWith({
		triggerTargetAmbience: triggerTargetAmbience(overrides),
	});
}
export function triggerTargetWithSound(
	overrides?: Partial<TriggerTargetSound>,
) {
	return triggerTargetWith({
		triggerTargetSound: triggerTargetSound(overrides),
	});
}
export function triggerTargetWithSubLevel(
	overrides?: Partial<TriggerTargetSubLevel>,
) {
	return triggerTargetWith({
		triggerTargetSubLevel: triggerTargetSubLevel(overrides),
	});
}

export function triggerSourceWith(source: TriggerSource): TriggerSource {
	return triggerSource(source);
}

export function triggerSourceWithBasic(
	overrides?: Partial<TriggerSourceBasic>,
) {
	return triggerSourceWith({
		triggerSourceBasic: triggerSourceBasic(overrides),
	});
}

export function triggerSourceWithBlockNames(
	overrides?: Partial<TriggerSourceBlockNames>,
) {
	return triggerSourceWith({
		triggerSourceBlockNames: triggerSourceBlockNames(overrides),
	});
}
