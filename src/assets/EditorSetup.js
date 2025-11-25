import { tags as t } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { keymap } from '@codemirror/view';
import {
	indentWithTab,
	defaultKeymap,
	history,
	historyKeymap,
} from '@codemirror/commands';

const colors = {
	bg: '#141415',
	builtin: '#b4d4cf',
	comment: '#606079',
	constant: '#aeaed1',
	delta: '#f3be7c',
	error: '#d8647e',
	fg: '#cdcdcd',
	floatBorder: '#878787',
	func: '#c48282',
	hint: '#7e98e8',
	inactiveBg: '#1c1c24',
	keyword: '#6e94b2',
	line: '#252530',
	number: '#e0a363',
	operator: '#90a0b5',
	parameter: '#bb9dbd',
	plus: '#7fa563',
	property: '#c3c3d5',
	search: '#405065',
	string: '#e8b589',
	type: '#9bb4bc',
	visual: '#333738',
	warning: '#f3be7c',
};

const themeOptions = {
	'&': {
		backgroundColor: colors.bg,
		color: colors.fg,
		fontSize: '0.8rem',
	},
	'.cm-gutters': {
		backgroundColor: colors.bg,
		color: colors.floatBorder,
	},
	'&.cm-editor .cm-scroller': {
		fontFamily: 'var(--font-family-alt)',
	},
	'.cm-content': {
		caretColor: colors.fg,
	},
	'.cm-cursor, .cm-dropCursor': {
		borderLeftColor: colors.fg,
	},
	'&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection':
		{
			// Safari doesn't fully apply a solid background-color to ::selection element unless the color includes an alpha value.
			// https://github.com/w3c/csswg-drafts/issues/6853
			background: colors.visual + 'FE !important',
		},
	'& .cm-selectionMatch, & .cm-searchMatch': {
		backgroundColor: colors.search,
	},
	'& .cm-searchMatch-selected': {
		backgroundColor: colors.hint,
	},

	'& .cm-tooltip': {
		backgroundColor: colors.inactiveBg,
		color: colors.fg,
	},

	'& .cm-activeLine': {
		backgroundColor: 'transparent',
	},

	'& .cm-tooltip-autocomplete ul li[aria-selected]': {
		background: colors.visual,
	},

	'.cm-vimMode .cm-selectionBackground': {
		backgroundColor: colors.visual + ' !important',
	},

	'.cm-vimMode .cm-focused .cm-selectionBackground': {
		backgroundColor: colors.visual + ' !important',
	},
};

const themeStyle = [
	// vague
	// { color: colors.bg, tag: [] },
	// { color: colors.builtin, tag: [] },
	{ color: colors.comment, fontStyle: 'italic', tag: [t.comment, t.meta] },
	{ color: colors.constant, tag: [t.constant(t.name)] },
	// { color: colors.delta, tag: [] },
	{ color: colors.error, tag: [t.invalid] },
	// { color: colors.fg, tag: [] },
	// { color: colors.floatBorder, tag: [] },
	{
		color: colors.func,
		tag: [
			t.regexp,
			t.function(t.name),
			t.function(t.variableName),
			t.function(t.propertyName),
		],
	},
	// { color: colors.hint, tag: [] },
	// { color: colors.inactiveBg, tag: [] },
	{
		color: colors.keyword,
		tag: [
			t.operatorKeyword,
			t.keyword,
			t.controlKeyword,
			t.moduleKeyword,
			t.modifier,
		],
	},
	// { color: colors.line, tag: [] },
	{ color: colors.number, tag: [t.number, t.bool] },
	{ color: colors.operator, tag: [t.operator] },
	{ color: colors.parameter, tag: [] },
	// { color: colors.plus, tag: [] },
	{ color: colors.property, tag: [t.propertyName] },
	// { color: colors.search, tag: [] },
	{ color: colors.string, fontStyle: 'italic', tag: [t.string, t.character] },
	{ color: colors.type, tag: [t.typeName, t.className, t.self, t.namespace] },
	// { color: colors.visual, tag: [] },
	// { color: colors.warning, tag: [] },
	{ tag: [t.strong], fontWeight: 'bold' },
	{ tag: [t.emphasis], fontStyle: 'italic' },
	{ tag: [t.strikethrough], textDecoration: 'line-through' },
];

const themeExtension = EditorView.theme(themeOptions, {
	dark: true,
});
const highlightStyle = HighlightStyle.define(themeStyle);
const theme = [themeExtension, syntaxHighlighting(highlightStyle)];

function build_editor(
	parent,
	doc = '',
	lang,
	extensions = [],
	keymaps = [],
	changed = (_) => {},
) {
	return new EditorView({
		parent: parent,
		doc: doc,
		extensions: [
			...extensions,
			history(),
			theme,
			EditorView.updateListener.of(changed),
			keymap.of([
				...defaultKeymap,
				...historyKeymap,
				indentWithTab,
				...keymaps,
			]),
			...(lang ? [lang] : []),
		],
	});
}

export default build_editor;
