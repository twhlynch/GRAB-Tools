import { groupNodes } from '@/common/group';
import { animation, animationFrame, quaternion } from '@/generated/helpers';
import {
	levelNodeWithParticleEmitter,
	levelNodeWithStatic,
} from '@/generated/nodes';
import {
	Color,
	LevelNode,
	LevelNodeMaterial,
	LevelNodeShape,
} from '@/generated/proto';
import { greedy_mesh } from './greedy_mesh';

type Mode = 'cubes' | 'particles';
type Shape = 'plane' | 'sphere';

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
	greedy?: boolean,
) {
	const result: HTMLImageElement = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = reader.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

	const pixels = compute_pixels(result, width, height, shape);
	const level_nodes = build_nodes(pixels, mode, greedy);

	return groupNodes(level_nodes);
}

function compute_pixels(
	img: HTMLImageElement,
	width: number,
	height: number,
	shape: Shape,
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return [];

	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);

	if (shape === 'plane') {
		return sample_grid(ctx, img, width, height);
	} else {
		return sample_sphere(ctx, img, width, height);
	}
}

function sample_grid(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	width: number,
	height: number,
): Pixel[] {
	const pixels = [];

	const step_x = img.width / width;
	const step_y = img.height / height;

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const pixel = ctx.getImageData(x * step_x, y * step_y, 1, 1);

			const color = {
				r: pixel.data[0]! / 255,
				g: pixel.data[1]! / 255,
				b: pixel.data[2]! / 255,
				a: pixel.data[3]!,
			};
			const position = { x: x, y: -y, z: 10 };

			pixels.push({ color, position });
		}
	}

	return pixels;
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

function build_nodes(pixels: Pixel[], mode: Mode, greedy?: boolean) {
	if (mode === 'particles') {
		return build_particles(pixels);
	} else {
		return build_pixels(pixels, greedy);
	}
}

function build_pixels(pixels: Pixel[], greedy?: boolean) {
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
