import { compile } from '@/tools/compiler';
import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import {
	levelNodeWithFinish,
	levelNodeWithGASM,
	levelNodeWithGroup,
	levelNodeWithStart,
	levelNodeWithTrigger,
	triggerTargetWithAnimation,
} from '@grab-tools/lib/generated/nodes';
import { describe, expect, it } from 'vitest';

describe('compiler', () => {
	it('correctly offsets node ids and removes starts and finishes', () => {
		const input = [
			[
				levelNodeWithStart(), // 1
				levelNodeWithTrigger({
					// 2
					triggerTargets: [
						triggerTargetWithAnimation({ objectID: 2 }),
						triggerTargetWithAnimation({ objectID: 3 }),
						triggerTargetWithAnimation({ objectID: 4 }),
						triggerTargetWithAnimation({ objectID: 5 }),
						triggerTargetWithAnimation({ objectID: 6 }),
						triggerTargetWithAnimation({ objectID: 8 }),
					],
				}),
				levelNodeWithGroup({
					// 3
					childNodes: [
						levelNodeWithGASM({
							// 4
							connections: [
								{ objectID: 2 },
								{ objectID: 3 },
								{ objectID: 4 },
								{ objectID: 5 },
								{ objectID: 6 },
								{ objectID: 8 },
							],
						}),
						levelNodeWithGroup({
							// 5
							childNodes: [
								levelNodeWithTrigger({
									// 6
									triggerTargets: [
										triggerTargetWithAnimation({
											objectID: 2,
										}),
										triggerTargetWithAnimation({
											objectID: 3,
										}),
										triggerTargetWithAnimation({
											objectID: 4,
										}),
										triggerTargetWithAnimation({
											objectID: 5,
										}),
										triggerTargetWithAnimation({
											objectID: 6,
										}),
										triggerTargetWithAnimation({
											objectID: 8,
										}),
									],
								}),
							],
						}),
					],
				}),
				levelNodeWithFinish(), // 7
				levelNodeWithGASM({
					// 8
					connections: [
						{ objectID: 2 },
						{ objectID: 3 },
						{ objectID: 4 },
						{ objectID: 5 },
						{ objectID: 6 },
						{ objectID: 8 },
					],
				}),
			],
			[
				levelNodeWithStart(), // 1
				levelNodeWithFinish(), // 2
				levelNodeGroupFrom({
					// 3
					childNodes: [
						levelNodeWithTrigger({
							// 4
							triggerTargets: [
								triggerTargetWithAnimation({ objectID: 3 }),
								triggerTargetWithAnimation({ objectID: 4 }),
								triggerTargetWithAnimation({ objectID: 5 }),
							],
						}),
					],
				}),
				levelNodeWithGASM({
					// 5
					connections: [
						{ objectID: 3 },
						{ objectID: 4 },
						{ objectID: 5 },
					],
				}),
			],
		];

		const output = [
			// level 1
			levelNodeGroupFrom({
				// 1
				childNodes: [
					levelNodeWithTrigger({
						// 2
						triggerTargets: [
							triggerTargetWithAnimation({ objectID: 2 }),
							triggerTargetWithAnimation({ objectID: 3 }),
							triggerTargetWithAnimation({ objectID: 4 }),
							triggerTargetWithAnimation({ objectID: 5 }),
							triggerTargetWithAnimation({ objectID: 6 }),
							triggerTargetWithAnimation({ objectID: 7 }),
						],
					}),
					levelNodeWithGroup({
						// 3
						childNodes: [
							levelNodeWithGASM({
								// 4
								connections: [
									{ objectID: 2 },
									{ objectID: 3 },
									{ objectID: 4 },
									{ objectID: 5 },
									{ objectID: 6 },
									{ objectID: 7 },
								],
							}),
							levelNodeWithGroup({
								// 5
								childNodes: [
									levelNodeWithTrigger({
										// 6
										triggerTargets: [
											triggerTargetWithAnimation({
												objectID: 2,
											}),
											triggerTargetWithAnimation({
												objectID: 3,
											}),
											triggerTargetWithAnimation({
												objectID: 4,
											}),
											triggerTargetWithAnimation({
												objectID: 5,
											}),
											triggerTargetWithAnimation({
												objectID: 6,
											}),
											triggerTargetWithAnimation({
												objectID: 7,
											}),
										],
									}),
								],
							}),
						],
					}),
					levelNodeWithGASM({
						// 7
						connections: [
							{ objectID: 2 },
							{ objectID: 3 },
							{ objectID: 4 },
							{ objectID: 5 },
							{ objectID: 6 },
							{ objectID: 7 },
						],
					}),
				],
			}),
			// level 2
			levelNodeGroupFrom({
				// 8
				childNodes: [
					levelNodeGroupFrom({
						// 9
						childNodes: [
							levelNodeWithTrigger({
								// 10
								triggerTargets: [
									triggerTargetWithAnimation({ objectID: 9 }),
									triggerTargetWithAnimation({
										objectID: 10,
									}),
									triggerTargetWithAnimation({
										objectID: 11,
									}),
								],
							}),
						],
					}),
					levelNodeWithGASM({
						// 11
						connections: [
							{ objectID: 9 },
							{ objectID: 10 },
							{ objectID: 11 },
						],
					}),
				],
			}),
		];

		expect(compile(input, { group: true })).toEqual(output);
	});
});
