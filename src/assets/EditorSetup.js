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

// theme from uiw/codemirror-theme-vscode
const themeOptions = {
	'&': {
		backgroundColor: '#1e1e1e',
		color: '#9cdcfe',
	},
	'.cm-gutters': {
		backgroundColor: '#1e1e1e',
		color: '#838383',
	},
	'&.cm-editor .cm-scroller': {
		fontFamily:
			'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
	},
	'.cm-content': {
		caretColor: '#c6c6c6',
	},
	'.cm-cursor, .cm-dropCursor': {
		borderLeftColor: '#c6c6c6',
	},
	'.cm-activeLine': {
		backgroundColor: '#ffffff0f',
	},
	'.cm-activeLineGutter': {
		color: '#fff',
		backgroundColor: '#ffffff0f',
	},
	'&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection':
		{
			background: '#6199ff2f !important',
		},
	'& .cm-selectionMatch': {
		backgroundColor: '#72a1ff59',
	},
};

const vscodeDarkStyle = [
	{
		tag: [
			t.keyword,
			t.operatorKeyword,
			t.modifier,
			t.color,
			t.constant(t.name),
			t.standard(t.name),
			t.standard(t.tagName),
			t.special(t.brace),
			t.atom,
			t.bool,
			t.special(t.variableName),
		],
		color: '#569cd6',
	},
	{ tag: [t.controlKeyword, t.moduleKeyword], color: '#c586c0' },
	{
		tag: [
			t.name,
			t.deleted,
			t.character,
			t.macroName,
			t.propertyName,
			t.variableName,
			t.labelName,
			t.definition(t.name),
		],
		color: '#9cdcfe',
	},
	{ tag: t.heading, fontWeight: 'bold', color: '#9cdcfe' },
	{
		tag: [
			t.typeName,
			t.className,
			t.tagName,
			t.number,
			t.changed,
			t.annotation,
			t.self,
			t.namespace,
		],
		color: '#4ec9b0',
	},
	{
		tag: [t.function(t.variableName), t.function(t.propertyName)],
		color: '#dcdcaa',
	},
	{ tag: [t.number], color: '#b5cea8' },
	{
		tag: [
			t.operator,
			t.punctuation,
			t.separator,
			t.url,
			t.escape,
			t.regexp,
		],
		color: '#d4d4d4',
	},
	{ tag: [t.regexp], color: '#d16969' },
	{
		tag: [
			t.special(t.string),
			t.processingInstruction,
			t.string,
			t.inserted,
		],
		color: '#ce9178',
	},
	{ tag: [t.angleBracket], color: '#808080' },
	{ tag: t.strong, fontWeight: 'bold' },
	{ tag: t.emphasis, fontStyle: 'italic' },
	{ tag: t.strikethrough, textDecoration: 'line-through' },
	{ tag: [t.meta, t.comment], color: '#6a9955' },
	{ tag: t.link, color: '#6a9955', textDecoration: 'underline' },
	{ tag: t.invalid, color: '#ff0000' },
];

const themeExtension = EditorView.theme(themeOptions, {
	dark: true,
});

const highlightStyle = HighlightStyle.define(vscodeDarkStyle);
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
			lang,
		],
	});
}

export default build_editor;
