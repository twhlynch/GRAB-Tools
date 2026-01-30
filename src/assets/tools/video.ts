import encoding from '@/assets/tools/encoding';
import { PYTHON_SERVER_URL } from '@/config';
import {
	Animation,
	AnimationFrame,
	LevelNode,
	LevelNodeGASM,
	LevelNodeStatic,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';
import { asm_to_json } from '../AssemblyConversion';

const VIDEO_SERVER_URL = `${PYTHON_SERVER_URL}process_video`;

async function video(
	file: File,
	width: number,
	height: number,
	mode: 'animations' | 'code',
	callback = (_: number) => {},
): Promise<Array<LevelNode> | null> {
	if (!window.MediaStreamTrackProcessor) {
		window.toast(
			'MediaStreamTrackProcessor not available on this browser, using server fallback',
			'warning',
		);
		return fallback_video(file);
	}

	const video_data = await read_video(file, callback);
	if (video_data === null) return null;

	const func = mode === 'animations' ? build_video : build_code_video;
	const level_nodes = func(video_data, width, height, callback);

	return level_nodes;
}

async function read_video(file: File, callback: (percent: number) => void) {
	console.log(file);
	if (file.size === 0) {
		window.toast('Invalid Video: Size is 0', 'error');
		return null;
	}

	let buffer: Uint8Array<ArrayBuffer>;
	try {
		buffer = await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = async () => {
				const buffer = new Uint8Array(reader.result as ArrayBuffer);
				resolve(buffer);
			};
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		});
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Invalid Video: ' + e.message;
			window.toast(e, 'error');
		}
		return null;
	}

	const blob = new Blob([buffer], {
		type: 'video/mp4',
	});
	const video = document.createElement('video');
	video.src = window.URL.createObjectURL(blob);
	video.muted = true;

	try {
		await video.play();
	} catch (e) {
		if (e instanceof Error) window.toast(e, 'error');
		return null;
	}
	const [track] = video.captureStream().getVideoTracks();
	video.onended = () => track!.stop();

	// @ts-expect-error not baseline
	const processor = new MediaStreamTrackProcessor(track); // fuck firefox
	const video_reader = processor.readable.getReader();

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		window.toast('Failed to initialize rendering context', 'error');
		return null;
	}

	const frames = [];

	let finished = false;
	while (!finished) {
		const { done, value } = await video_reader.read();
		finished = done;

		if (!value) continue;

		canvas.width = value.displayWidth;
		canvas.height = value.displayHeight;

		ctx.drawImage(value, 0, 0);

		const bitmap = await createImageBitmap(canvas);
		frames.push(bitmap);

		callback((video.currentTime / video.duration) * 90);

		value.close();
	}

	return frames;
}

type SafeNode = LevelNodeWith<LevelNodeStatic> & {
	animations: (Animation & {
		frames: AnimationFrame[];
	})[];
};

function build_video(
	frames: ImageBitmap[],
	width: number,
	height: number,
	callback: (percent: number) => void,
): LevelNode[] | null {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) {
		window.toast('Failed to initialize rendering context', 'error');
		return null;
	}

	const level_nodes: SafeNode[] = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			level_nodes.push({
				levelNodeStatic: {
					material: 8,
					shape: 1001,
					color1: {},
					rotation: { w: 1 },
					scale: { x: 1, y: 1, z: 1 },
					position: { x: x, y: -y },
				},
				animations: [
					{
						name: 'idle',
						frames: [
							{
								time: 0,
								position: {},
								rotation: { w: 1 },
							},
						],
						speed: 1,
					},
				],
			});
		}
	}
	const wall_node = {
		levelNodeStatic: {
			material: 8,
			shape: 1000,
			color1: { r: 1, g: 1, b: 1 },
			rotation: { w: 1 },
			scale: { x: width, y: height, z: 0.01 },
			position: { x: width / 2 - 0.5, y: -(height / 2 - 0.5) },
		},
	};

	for (const i in frames) {
		const frame = frames[i]!;

		callback(90 + 10 * (Number(i) / frames.length));

		// these may be redundant
		ctx.drawImage(frame, 0, 0, width, height);
		const imageData = ctx.getImageData(0, 0, width, height);

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const index = x + y * width;
				const data_index = index * 4;
				const r = imageData.data[data_index]! / 255;
				const g = imageData.data[data_index + 1]! / 255;
				const b = imageData.data[data_index + 2]! / 255;
				const brightness = Math.sqrt(
					0.299 * Math.pow(r, 2) +
						0.587 * Math.pow(g, 2) +
						0.114 * Math.pow(b, 2),
				);
				const z = Math.round(brightness * 0.5 * 1000) / 1000;
				const pixel_frames = level_nodes[index]!.animations[0]!.frames; // always [index] and always has an animation
				let last_frame = pixel_frames[pixel_frames.length - 1]!; // always 1 or more frames
				const is_dupe =
					pixel_frames.length >= 1 && z === last_frame.position?.z;
				const has_dedupe =
					pixel_frames.length >= 2 &&
					z === pixel_frames[pixel_frames.length - 2]!.position?.z; // i did >= 2

				if (is_dupe) {
					if (!has_dedupe) {
						pixel_frames.push({
							time: last_frame.time,
							position: { z: last_frame.position?.z ?? 0 },
							rotation: { w: 1 },
						});
						last_frame = pixel_frames[pixel_frames.length - 1]!; // always 1 frame
					}
					last_frame.time = Number(i) * (1 / 24);
				} else {
					pixel_frames.push({
						time: Number(i) * (1 / 24),
						position: { z },
						rotation: { w: 1 },
					});
				}
			}
		}
	}

	return [...level_nodes, wall_node];
}

type Instruction = {
	line: string;
	x: number;
	y: number;
};

function build_code_video(
	bitmaps: ImageBitmap[],
	width: number,
	height: number,
	callback: (percent: number) => void,
): LevelNode[] | null {
	const { DEFAULT_COLORED } = encoding.materials();
	const MAX_INSTRUCTIONS_PER_FRAME = 80;
	const PIXELS_PER_CODE_BLOCK = Math.floor(
		// (LIMIT - (sleep, goto, label) - 1) / |{r, g, b}|
		(MAX_INSTRUCTIONS_PER_FRAME - 3 - 1) / 3,
	);
	const static_nodes: LevelNodeWith<LevelNodeStatic>[] = [];
	const code_nodes: LevelNodeWith<LevelNodeGASM>[] = [];

	// parse video data
	const video = bitmaps_to_frames(bitmaps, width, height);
	if (!video) return null;

	callback(95);

	// create pixels
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			static_nodes.push(encoding.levelNodeStatic());
			const { levelNodeStatic: pixel_node } =
				static_nodes[static_nodes.length - 1]!;
			pixel_node.material = DEFAULT_COLORED;
			pixel_node.position = { x, y: -y };
		}
	}

	const last: Record<string, { r: number; g: number; b: number }> = {};

	// assembly for lines to run each frame
	const video_asm: Instruction[][] = video.map((frame) =>
		// update rgb values that change
		frame.flatMap((p) => {
			const key = `${p.x}_${p.y}`;
			const prev = (last[key] ??= { r: 0, g: 0, b: 0 });
			const pixel = `P_${key}`;

			return (['r', 'g', 'b'] as const).flatMap((c) => {
				if (prev[c] === p[c]) return [];
				prev[c] = p[c];
				return [
					{
						line: `SET ${pixel}.${c.toUpperCase()} ${p[c]}`,
						x: p.x,
						y: p.y,
					},
				];
			});
		}),
	);

	// a final frame to reset to black
	const reset_asm: Instruction[] = [...Array(width)].flatMap((_, x) =>
		[...Array(height)].flatMap((_, y) =>
			['R', 'G', 'B'].map((c) => ({
				line: `SET P_${x}_${y}.${c} 0`,
				x,
				y,
			})),
		),
	);

	// all the frames
	const frames_asm = [...video_asm, reset_asm];

	// number of code blocks to stay under the frame limit
	const code_block_count = Math.ceil(
		(width * height) / PIXELS_PER_CODE_BLOCK,
	);

	// build code blocks
	for (let blk_index = 0; blk_index < code_block_count; blk_index++) {
		const code = encoding.levelNodeGASM();
		const { levelNodeGASM: code_node } = code;

		const x = Math.floor((blk_index * 25) / height);
		const y = (blk_index * 25) % height;

		code_node.startActive = true;
		(code_node.position ??= {}).z = -2;
		code_node.position.x = x;
		code_node.position.y = -y;

		code_nodes.push(code);
	}

	const sleep = `\nSLEEP 0\n`;

	const connection_map: Record<number, true> = {};
	const connect = (block_index: number, x: number, y: number) => {
		const block = code_nodes[block_index]!;
		const pixel_index = y + x * height;
		if (connection_map[pixel_index]) return;
		connection_map[pixel_index] = true;

		encoding.add_code_connection(
			block,
			'color',
			`P_${x}_${y}`,
			y + x * height + 1,
		);
	};

	// per code block assembly
	const asm: string[][] = [];

	// distribute code somewhat evenly
	for (let frame_index = 0; frame_index < frames_asm.length; frame_index++) {
		const frame_asm = frames_asm[frame_index]!;

		// distribute pixel change lines to their assigned block
		for (let line_index = 0; line_index < frame_asm.length; line_index++) {
			const line = frame_asm[line_index]!;

			const block_index = Math.floor(
				(line.y + line.x * height) / PIXELS_PER_CODE_BLOCK,
			);
			(asm[block_index] ??= []).push(line.line);
			connect(block_index, line.x, line.y);
		}

		// add sleep to ALL blocks every frame
		for (let blk_index = 0; blk_index < code_block_count; blk_index++) {
			(asm[blk_index] ??= []).push(sleep);
		}
	}

	for (let blk_index = 0; blk_index < code_block_count; blk_index++) {
		const block_asm = asm[blk_index]!;
		const code_block = code_nodes[blk_index]!;

		asm_to_json(
			'LABEL l\n' +
				// display video
				block_asm.join('\n') +
				// reset to zero
				sleep +
				// loop forever
				'GOTO l\n',
			code_block,
		);
	}

	return [...static_nodes, ...code_nodes];
}

type Pixel = {
	x: number;
	y: number;
	r: number;
	g: number;
	b: number;
};

type Frame = Pixel[];

function bitmap_to_frame(
	bitmap: ImageBitmap,
	width: number,
	height: number,
	ctx: OffscreenCanvasRenderingContext2D,
): Frame {
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(bitmap, 0, 0, width, height);

	const { data } = ctx.getImageData(0, 0, width, height);
	const frame: Frame = [];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			frame.push({
				x,
				y,
				r: data[i]!,
				g: data[i + 1]!,
				b: data[i + 2]!,
			});
		}
	}

	return frame;
}

function bitmaps_to_frames(
	bitmaps: ImageBitmap[],
	width: number,
	height: number,
): Frame[] {
	if (bitmaps.length === 0) return [];
	if (bitmaps[0] === undefined) return [];

	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return [];

	return bitmaps.map((bitmap) => bitmap_to_frame(bitmap, width, height, ctx));
}

async function fallback_video(file: File): Promise<Array<LevelNode> | null> {
	const formData = new FormData();
	formData.append('file', file);

	let response;
	try {
		response = await fetch(VIDEO_SERVER_URL, {
			method: 'POST',
			body: formData,
		});
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Error making request: ' + e.message;
			window.toast(e, 'error');
		}
		return null;
	}

	if (!response.ok) {
		const error = await response.text();
		window.toast('Error processing video: ' + error, 'error');
		return null;
	}

	const result = await response.blob();
	const level = await encoding.decodeLevel(result);
	if (!level) {
		window.toast('Invalid level', 'error');
		return null;
	}

	if (!level.levelNodes?.length) {
		window.toast('Video returned has no nodes', 'error');
		return null;
	}

	return level.levelNodes;
}

export default {
	video,
};
