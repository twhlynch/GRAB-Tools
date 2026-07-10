import {
	LevelNodeTypes,
	LevelNodeWith,
	TriggerSourceTypes,
	TriggerSourceWith,
	TriggerTargetTypes,
	TriggerTargetWith,
} from '@/common/levelNodes';
import { levelNode, triggerSource, triggerTarget } from './helpers';

export function merge<T extends object>(target: T, source: Partial<T>): T {
	for (const key in source) {
		const src = source[key];
		const tgt = target[key];

		if (
			src !== undefined &&
			typeof src === 'object' &&
			!Array.isArray(src)
		) {
			if (!tgt || typeof tgt !== 'object' || Array.isArray(tgt)) {
				target[key] = {} as T[typeof key];
			}
			merge(
				target[key] as T[keyof T] & object,
				src as Partial<T[keyof T]>,
			);
		} else {
			target[key] = src as T[Extract<keyof T, string>];
		}
	}
	return target;
}

export function levelNodeWith<T extends LevelNodeTypes>(
	nodeData: Partial<LevelNodeWith<T>>,
): LevelNodeWith<T> {
	return levelNode(nodeData) as LevelNodeWith<T>;
}

export function triggerTargetWith<T extends TriggerTargetTypes>(
	target: Partial<TriggerTargetWith<T>>,
): TriggerTargetWith<T> {
	return triggerTarget(target) as TriggerTargetWith<T>;
}

export function triggerSourceWith<T extends TriggerSourceTypes>(
	source: Partial<TriggerSourceWith<T>>,
): TriggerSourceWith<T> {
	return triggerSource(source) as TriggerSourceWith<T>;
}
