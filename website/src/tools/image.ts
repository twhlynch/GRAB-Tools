import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import {
	animation,
	animationFrame,
	quaternion,
} from '@grab-tools/lib/generated/helpers';
import {
	levelNodeWithParticleEmitter,
	levelNodeWithStatic,
} from '@grab-tools/lib/generated/nodes';
import {
	Color,
	LevelNode,
	LevelNodeMaterial,
	LevelNodeShape,
} from '@grab-tools/lib/generated/proto';
import { greedy_mesh } from './greedy_mesh';

type Mode = 'cubes' | 'particles';
type Shape = 'plane' | 'sphere';
type ColorMode = 'average' | 'dominant' | 'center';

interface Pixel {
	color: Required<Color>;
	position: { x: number; y: number; z: number };
}

export async function generate_pixel_art(
	file: File,
	width: number,
	height: number,
	mode: Mode,
	shape: Shape,
	colorMode: ColorMode = 'average',
	greedy: boolean,
) {
	const result: HTMLImageElement = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = reader.result as string;
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});

	const pixels = compute_pixels(result, width, height, shape, colorMode);
	const level_nodes = build_nodes(pixels, mode, greedy);

	return levelNodeGroupFrom({ childNodes: level_nodes });
}

function compute_pixels(
	img: HTMLImageElement,
	width: number,
	height: number,
	shape: Shape,
	colorMode: ColorMode,
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return [];

	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);

	if (shape === 'plane') {
		return sample_grid(ctx, img, width, height, colorMode);
	} else {
		return sample_sphere(ctx, img, width, height);
	}
}

function sample_grid(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	width: number,
	height: number,
	colorMode: ColorMode,
): Pixel[] {
	const pixels = [];

	const step_x = img.width / width;
	const step_y = img.height / height;
	const image_data = ctx.getImageData(0, 0, img.width, img.height).data;

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const x0 = Math.floor(x * step_x);
			const y0 = Math.floor(y * step_y);
			const x1 = Math.max(x0 + 1, Math.floor((x + 1) * step_x));
			const y1 = Math.max(y0 + 1, Math.floor((y + 1) * step_y));

			const sampled = sample_color(
				image_data,
				img.width,
				x0,
				y0,
				x1,
				y1,
				colorMode,
			);

			const color = {
				r: sampled.r / 255,
				g: sampled.g / 255,
				b: sampled.b / 255,
				a: sampled.a,
			};
			const position = { x: x, y: -y, z: 10 };

			pixels.push({ color, position });
		}
	}

	return pixels;
}

function sample_color(
	data: Uint8ClampedArray,
	img_width: number,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	colorMode: ColorMode,
) {
	if (colorMode === 'center') {
		const cx = Math.floor((x0 + x1) / 2);
		const cy = Math.floor((y0 + y1) / 2);
		const index = (cy * img_width + cx) * 4;
		return {
			r: data[index]!,
			g: data[index + 1]!,
			b: data[index + 2]!,
			a: data[index + 3]!,
		};
	}

	if (colorMode === 'dominant') {
		const counts = new Map<number, number>();
		let best_key = -1;
		let best_count = 0;
		let alpha_sum = 0;
		let count = 0;

		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const index = (y * img_width + x) * 4;
				const r = data[index]!;
				const g = data[index + 1]!;
				const b = data[index + 2]!;
				alpha_sum += data[index + 3]!;
				count++;

				// quantise to 5 bits per channel so near-identical colors group
				const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
				const seen = (counts.get(key) ?? 0) + 1;
				counts.set(key, seen);
				if (seen > best_count) {
					best_count = seen;
					best_key = key;
				}
			}
		}

		return {
			// reverse quantisation
			r: ((best_key >> 10) << 3) + 4,
			g: (((best_key >> 5) & 0x1f) << 3) + 4,
			b: ((best_key & 0x1f) << 3) + 4,
			a: Math.round(alpha_sum / count),
		};
	}

	// if (colorMode == 'average') {
	let r_sum = 0;
	let g_sum = 0;
	let b_sum = 0;
	let a_sum = 0;
	let count = 0;

	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const index = (y * img_width + x) * 4;
			r_sum += data[index]!;
			g_sum += data[index + 1]!;
			b_sum += data[index + 2]!;
			a_sum += data[index + 3]!;
			count++;
		}
	}

	return {
		r: Math.round(r_sum / count),
		g: Math.round(g_sum / count),
		b: Math.round(b_sum / count),
		a: Math.round(a_sum / count),
	};
	// }
}

function sample_sphere(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	width: number,
	height: number,
): Pixel[] {
	const pixels: Pixel[] = [];

	const image_data = ctx.getImageData(0, 0, img.width, img.height).data;
	const radius = Math.min(width, height);

	for (let x = -radius; x <= radius; x++) {
		for (let y = -radius; y <= radius; y++) {
			for (let z = 0 - radius; z <= 0 + radius; z++) {
				const distance = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

				if (!(distance > radius - 0.5 && distance < radius + 0.5))
					continue;

				const phi = Math.atan2(z, x);
				const theta = Math.acos(y / radius);

				const u = -(phi + radius) / (2 * Math.PI);
				const v = theta / Math.PI;

				const x_rounded = Math.floor(u * img.width);
				const y_rounded = Math.floor(v * img.height);

				const index = (y_rounded * img.width + x_rounded) * 4;
				const r = image_data[index]! / 255;
				const g = image_data[index + 1]! / 255;
				const b = image_data[index + 2]! / 255;

				pixels.push({
					color: {
						r: gamma_to_linear(r),
						g: gamma_to_linear(g),
						b: gamma_to_linear(b),
						a: 1,
					},
					position: {
						x: x,
						y: y * -1,
						z: z,
					},
				});
			}
		}
	}

	return pixels;
}

function gamma_to_linear(value: number) {
	return value <= 0.04045
		? value / 12.92
		: Math.pow((value + 0.055) / 1.055, 2.4);
}

function build_nodes(pixels: Pixel[], mode: Mode, greedy: boolean) {
	if (mode === 'particles') {
		return build_particles(pixels);
	} else {
		return build_pixels(pixels, greedy);
	}
}

function build_pixels(pixels: Pixel[], greedy: boolean) {
	const nodes = pixels.map((pixel) => {
		return levelNodeWithStatic({
			material: LevelNodeMaterial.DEFAULT_COLORED,
			shape: LevelNodeShape.CUBE,
			position: pixel.position,
			color1: pixel.color,
			isNeon: true,
		});
	});

	if (greedy) return greedy_mesh(nodes);

	return nodes;
}

function build_particles(pixels: Pixel[]) {
	const level_nodes: LevelNode[] = [];
	const positions: Pixel[][] = [];
	const colors: Color[] = [];

	for (const pixel of pixels) {
		const color = {
			r: Math.floor(pixel.color.r * 24) / 24,
			g: Math.floor(pixel.color.g * 24) / 24,
			b: Math.floor(pixel.color.b * 24) / 24,
			a: 1,
		};

		let index = colors.findIndex(
			(c) => color.r === c.r && color.g === c.g && color.b === c.b,
		);
		if (index === -1) {
			index = colors.length;
			colors.push(color);
			positions.push([]);
		}

		positions[index]!.push(pixel);
	}

	for (let j = 0; j < positions.length; j++) {
		const particles = positions[j]!;
		const color = colors[j]!;

		const particlesNode = levelNodeWithParticleEmitter({
			scale: { x: 0.01, y: 0.01, z: 0.01 },
			particlesPerSecond: particles.length,
			lifeSpan: { x: 5, y: 5 },
			startColor: color,
			endColor: color,
			startSize: { x: 0.1, y: 0.1 },
			endSize: { x: 0.08, y: 0.08 },
			velocity: {},
			velocityMin: {},
			velocityMax: {},
			accelerationMin: {},
			accelerationMax: {},
		});

		particlesNode.animations = [
			animation({
				frames: particles.flatMap((p, i) => {
					const particle_position = {
						x: p.position.x * 0.1,
						y: p.position.y * 0.1,
						z: p.position.z * 0.1,
					};
					return [
						animationFrame({
							time: i * (1 / particles.length),
							position: particle_position,
							rotation: quaternion(),
						}),
						animationFrame({
							time: (i + 1) * (1 / particles.length),
							position: particle_position,
							rotation: quaternion(),
						}),
					];
				}),
			}),
		];

		level_nodes.push(particlesNode);
	}

	return level_nodes;
}
