import { compile, count_nodes } from '@/tools/compiler';
import {
	levelNodeGroupFrom,
	levelNodeWithFinish,
	levelNodeWithGroup,
	levelNodeWithStart,
	levelNodeWithStatic,
	levelNodeWithTrigger,
	triggerTargetWithSound,
} from '@grab-tools/lib/generated/nodes';
import { describe, expect, it } from 'vitest';

describe('compiler', () => {
	it('correctly counts nodes in flat and grouped hierarchies', () => {
		const nodes = [
			levelNodeWithStart(),
			levelNodeWithGroup({
				childNodes: [
					levelNodeWithStatic(),
					levelNodeWithStatic(),
					levelNodeWithGroup({
						childNodes: [levelNodeWithStatic()],
					}),
				],
			}),
			levelNodeWithFinish(),
		];

		const counts = count_nodes(nodes);
		expect(counts.total).toBe(7);
		expect(counts.levelNodeStart).toBe(1);
		expect(counts.levelNodeFinish).toBe(1);
		expect(counts.levelNodeGroup).toBe(2);
		expect(counts.levelNodeStatic).toBe(3);
	});

	it('removes start and finish and correctly remaps target IDs with groups', () => {
		// Level hierarchy:
		// 1: Group A
		//   2: Child A1
		//   3: Child A2
		// 4: Start
		// 5: Trigger targeting Child A2 (ID 3) and Static C (ID 6)
		// 6: Static C
		// 7: Finish
		const triggerNode = levelNodeWithTrigger({
			targets: [
				triggerTargetWithSound({ objectID: 3 }),
				triggerTargetWithSound({ objectID: 6 }),
			],
		});

		const level1 = [
			levelNodeWithGroup({
				childNodes: [levelNodeWithStatic(), levelNodeWithStatic()],
			}),
			levelNodeWithStart(),
			triggerNode,
			levelNodeWithStatic(),
			levelNodeWithFinish(),
		];

		const compiled = compile([level1], { group: true });

		// Compiled should have 1 outer group node
		expect(compiled.length).toBe(1);
		const outerGroup = compiled[0]!.levelNodeGroup;
		expect(outerGroup).toBeDefined();

		// Children should have Start and Finish removed:
		// - Group A (with 2 children)
		// - Trigger
		// - Static C
		expect(outerGroup!.childNodes?.length).toBe(3);

		// Traversal order of compiled:
		// ID 1: Outer group
		// ID 2: Group A
		// ID 3: Child A1
		// ID 4: Child A2
		// ID 5: Trigger
		// ID 6: Static C
		const compiledTrigger = outerGroup!.childNodes![1]!;
		expect(compiledTrigger.levelNodeTrigger).toBeDefined();
		const targets = compiledTrigger.levelNodeTrigger!.targets!;

		// Old ID 3 (Child A2) should now be mapped to ID 4
		expect(targets[0]!.triggerTargetSound?.objectID).toBe(4);

		// Old ID 6 (Static C) should now be mapped to ID 6
		expect(targets[1]!.triggerTargetSound?.objectID).toBe(6);
	});
});

