import {
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
	triggerSourceBasic,
	triggerSourceBlockNames,
	triggerTargetAmbience,
	triggerTargetAnimation,
	triggerTargetGASM,
	triggerTargetSound,
	triggerTargetSubLevel,
} from './helpers';
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
	TriggerSourceBasic,
	TriggerSourceBlockNames,
	TriggerTargetAmbience,
	TriggerTargetAnimation,
	TriggerTargetGASM,
	TriggerTargetSound,
	TriggerTargetSubLevel,
} from './proto';
import { levelNodeWith, triggerSourceWith, triggerTargetWith } from './util';

export function levelNodeWithGroup(overrides?: Partial<LevelNodeGroup>) {
	return levelNodeWith({
		levelNodeGroup: levelNodeGroup(overrides),
	});
}
export function levelNodeWithStart(overrides?: Partial<LevelNodeStart>) {
	return levelNodeWith({
		levelNodeStart: levelNodeStart(overrides),
	});
}
export function levelNodeWithFinish(overrides?: Partial<LevelNodeFinish>) {
	return levelNodeWith({
		levelNodeFinish: levelNodeFinish(overrides),
	});
}
export function levelNodeWithStatic(overrides?: Partial<LevelNodeStatic>) {
	return levelNodeWith({
		levelNodeStatic: levelNodeStatic(overrides),
	});
}
export function levelNodeWithCrumbling(
	overrides?: Partial<LevelNodeCrumbling>,
) {
	return levelNodeWith({
		levelNodeCrumbling: levelNodeCrumbling(overrides),
	});
}
export function levelNodeWithSign(overrides?: Partial<LevelNodeSign>) {
	return levelNodeWith({
		levelNodeSign: levelNodeSign(overrides),
	});
}
export function levelNodeWithGravity(overrides?: Partial<LevelNodeGravity>) {
	return levelNodeWith({
		levelNodeGravity: levelNodeGravity(overrides),
	});
}
export function levelNodeWithLobbyTerminal(
	overrides?: Partial<LevelNodeLobbyTerminal>,
) {
	return levelNodeWith({
		levelNodeLobbyTerminal: levelNodeLobbyTerminal(overrides),
	});
}
export function levelNodeWithParticleEmitter(
	overrides?: Partial<LevelNodeParticleEmitter>,
) {
	return levelNodeWith({
		levelNodeParticleEmitter: levelNodeParticleEmitter(overrides),
	});
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
export function triggerTargetWithAnimation(
	overrides?: Partial<TriggerTargetAnimation>,
) {
	return triggerTargetWith({
		triggerTargetAnimation: triggerTargetAnimation(overrides),
	});
}
export function triggerTargetWithSound(
	overrides?: Partial<TriggerTargetSound>,
) {
	return triggerTargetWith({
		triggerTargetSound: triggerTargetSound(overrides),
	});
}
export function triggerTargetWithGASM(overrides?: Partial<TriggerTargetGASM>) {
	return triggerTargetWith({
		triggerTargetGASM: triggerTargetGASM(overrides),
	});
}
export function triggerTargetWithSubLevel(
	overrides?: Partial<TriggerTargetSubLevel>,
) {
	return triggerTargetWith({
		triggerTargetSubLevel: triggerTargetSubLevel(overrides),
	});
}
export function triggerTargetWithAmbience(
	overrides?: Partial<TriggerTargetAmbience>,
) {
	return triggerTargetWith({
		triggerTargetAmbience: triggerTargetAmbience(overrides),
	});
}
export function levelNodeWithTrigger(overrides?: Partial<LevelNodeTrigger>) {
	return levelNodeWith({
		levelNodeTrigger: levelNodeTrigger(overrides),
	});
}
export function levelNodeWithSound(overrides?: Partial<LevelNodeSound>) {
	return levelNodeWith({
		levelNodeSound: levelNodeSound(overrides),
	});
}
export function levelNodeWithGASM(overrides?: Partial<LevelNodeGASM>) {
	return levelNodeWith({
		levelNodeGASM: levelNodeGASM(overrides),
	});
}
