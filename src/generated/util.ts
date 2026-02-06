import { LevelNodeTypes, LevelNodeWith } from '@/types/levelNodes';
import { levelNode, triggerSource, triggerTarget } from './helpers';
import { TriggerSource, TriggerTarget } from './proto';

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

export function triggerTargetWith(target: TriggerTarget): TriggerTarget {
	return triggerTarget(target);
}

export function triggerSourceWith(source: TriggerSource): TriggerSource {
	return triggerSource(source);
}
