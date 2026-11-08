import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/addons/loaders/FontLoader.js';

const SIGN_LABEL_WIDTH_PX = 1024;
const SIGN_LABEL_HEIGHT_PX = 730;
const SIGN_LABEL_WIDTH_M = 0.7;
const SIGN_LABEL_HEIGHT_M = 0.5;
const SIGN_FONT_SIZE = 120;
const SIGN_MAX_CHARACTERS = 150;
const SIGN_WORLD_PER_PX_X = SIGN_LABEL_WIDTH_M / SIGN_LABEL_WIDTH_PX;
const SIGN_WORLD_PER_PX_Y = SIGN_LABEL_HEIGHT_M / SIGN_LABEL_HEIGHT_PX;

interface SignFontGlyph {
	ha?: number;
}

export interface SignFontData {
	resolution: number;
	ascender: number;
	descender: number;
	glyphs: Record<string, SignFontGlyph>;
}

export interface SignTextLine {
	text: string;
	width: number;
	baseline: number;
}

export interface SignTextLayout {
	lines: SignTextLine[];
	size: number;
}

function isSignWhitespace(code: number) {
	return (
		code === 32 || // ' '
		code === 9 || // '\t'
		code === 10 || // '\n'
		code === 11 || // '\v'
		code === 12 || // '\f'
		code === 13 || // '\r'
		code === 0x85 || // NEL
		code === 0xa0 // NBSP
	);
}

function signGlyphAdvance(font: SignFontData, code: number) {
	const char = String.fromCodePoint(code);
	const glyph =
		font.glyphs[char] ??
		(isSignWhitespace(code) ? font.glyphs[' '] : font.glyphs['?']);
	return glyph?.ha ?? 0;
}

/**
 * handles line breaks, per-character advances and line widths, then vertically
 * centers the block.
 */
export function layoutSignText(
	font: SignFontData,
	text: string,
): SignTextLayout {
	const chars = Array.from(text)
		.slice(0, SIGN_MAX_CHARACTERS)
		.map((char) => char.codePointAt(0)!);

	const ascentUnits = font.ascender;
	const descentUnits = font.descender;
	const scale = SIGN_FONT_SIZE / (ascentUnits - descentUnits);
	const ascent = ascentUnits * scale;
	const descent = -descentUnits * scale;
	const lineGap = 0;

	const advances: number[] = [];
	const breaks: { index: number; skip: boolean }[] = [];
	const widths: number[] = [];
	let pen = 0;
	let whitespaceIndex = -1;
	let widthAtWhitespace = 0;

	for (let i = 0; i < chars.length; i++) {
		const code = chars[i]!;
		let advance = signGlyphAdvance(font, code) * scale;

		if (isSignWhitespace(code)) {
			whitespaceIndex = i;
			widthAtWhitespace = pen;
		}

		if (code === 10) {
			breaks.push({ index: i, skip: true });
			widths.push(pen);
			pen = 0;
			advance = 0;
		}

		if (SIGN_LABEL_WIDTH_PX < advance + pen) {
			const lastBreak = breaks.length
				? breaks[breaks.length - 1]!.index
				: -1;

			if (whitespaceIndex >= 0 && lastBreak < whitespaceIndex) {
				// word wrap at the last whitespace on this line
				breaks.push({ index: whitespaceIndex, skip: true });
				widths.push(widthAtWhitespace);

				if (whitespaceIndex === i) {
					advance = 0;
					pen = pen - widthAtWhitespace;
				} else {
					const removed = advances[whitespaceIndex] ?? 0;
					advances[whitespaceIndex] = 0;
					pen = pen - widthAtWhitespace - removed;
				}
			} else {
				// no whitespace on this line breaks before the current character
				breaks.push({ index: i, skip: false });
				widths.push(pen);
				pen = advance;
			}
		}

		pen += advance;
		advances.push(advance);
	}
	widths.push(pen);

	const lineCount = breaks.length + 1;
	const totalHeight = (lineCount - 1) * (ascent + descent + lineGap) + ascent;
	const firstBaseline =
		descent -
		ascent -
		SIGN_LABEL_HEIGHT_PX * 0.5 +
		totalHeight * 0.5 -
		descent * 0.5;

	const lines: SignTextLine[] = [];
	let start = 0;
	for (let line = 0; line <= breaks.length; line++) {
		const breakEntry = breaks[line];
		const end = breakEntry ? breakEntry.index : chars.length;
		lines.push({
			text: chars
				.slice(start, end)
				.map((code) =>
					isSignWhitespace(code) ? ' ' : String.fromCodePoint(code),
				)
				.join(''),
			width: widths[line] ?? 0,
			baseline: firstBaseline - line * (descent + lineGap + ascent),
		});
		start = breakEntry
			? breakEntry.index + (breakEntry.skip ? 1 : 0)
			: chars.length;
	}

	const size =
		(SIGN_FONT_SIZE * SIGN_WORLD_PER_PX_Y * font.resolution) /
		(ascentUnits - descentUnits);

	return { lines, size };
}

export class TextLoader {
	font: Font | undefined;
	fontPromise: Promise<void>;

	constructor() {
		this.fontPromise = new Promise<Font>((resolve, reject) => {
			new FontLoader().load(
				'/fonts/Roboto_Regular.json',
				resolve,
				undefined,
				reject,
			);
		}).then((font) => {
			this.font = font;
		});
	}

	async load() {
		await this.fontPromise;
	}

	createSignTextMeshes(
		text: string,
		color: THREE.Color,
		hideModel: boolean,
	): THREE.Mesh[] {
		if (!this.font) return [];

		const layout = layoutSignText(
			this.font.data as unknown as SignFontData,
			text,
		);
		// TODO: apply lighting to text crrectly
		const textMaterial = new THREE.MeshBasicMaterial({ color });
		const meshes: THREE.Mesh[] = [];

		for (const line of layout.lines) {
			if (!line.text.trim()) continue;

			const textGeometry = new TextGeometry(line.text, {
				font: this.font,
				size: layout.size,
				height: 0,
				curveSegments: 8,
				bevelEnabled: false,
			});
			const textMesh = new THREE.Mesh(textGeometry, textMaterial);

			textMesh.position.set(
				-SIGN_LABEL_WIDTH_M * 0.5 +
					(SIGN_LABEL_WIDTH_PX - line.width) *
						0.5 *
						SIGN_WORLD_PER_PX_X,
				SIGN_LABEL_HEIGHT_M * 0.5 + line.baseline * SIGN_WORLD_PER_PX_Y,
				hideModel ? 0 : 0.021,
			);

			meshes.push(textMesh);
		}

		return meshes;
	}
}
