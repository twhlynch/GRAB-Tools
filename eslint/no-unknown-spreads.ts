import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

export const noUnknownSpread = ESLintUtils.RuleCreator(() => '')({
	name: 'no-unknown-spread',
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow spreading arrays of unknown length into arguments to prevent "Maximum call stack size exceeded" caused by excessive argument counts.',
		},
		messages: {
			unknownLength:
				'Do not spread arrays of unknown length into arguments. Use a tuple with a statically known length.',
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		const services = ESLintUtils.getParserServices(context);
		const checker = services.program.getTypeChecker();

		function checkSpread(node: TSESTree.SpreadElement) {
			const tsNode = services.esTreeNodeToTSNodeMap.get(node.argument);
			const type = checker.getTypeAtLocation(tsNode);

			if (!checker.isTupleType(type)) {
				context.report({
					node,
					messageId: 'unknownLength',
				});
			}
		}

		return {
			'CallExpression > SpreadElement.arguments': checkSpread,
			'NewExpression > SpreadElement.arguments': checkSpread,
		};
	},
});

/* tests *

declare function foo(...args: unknown[]): void;
declare function bar(...args: [number, number]): void;

const array: number[] = [1, 2];
const tuple: [number, number] = [1, 2];
const readonlyTuple = [1, 2] as const;
const inferredArray = [1, 2];
const emptyArray: number[] = [];
const anyArray: any = [1, 2];

// should error
foo(...array);
foo(...emptyArray);
foo(...anyArray);
foo(...inferredArray);
bar(...array);

// should NOT error
foo(...tuple);
foo(...readonlyTuple);
foo(...[1, 2]);
bar(...tuple);
bar(...[1, 2]);
foo(...([] as unknown as [number, number]));

/**/
