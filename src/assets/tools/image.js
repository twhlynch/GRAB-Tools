import { groupNodes } from '../encoding/group';

/**
 * @param {File} file - An image file
 * @param {Number} width - Width of output
 * @param {Number} height - Height of output
 * @param {"cubes" | "particles"} mode - Mode
 * @param {"plane" | "sphere"} shape - Shape
 * @returns {Promise<Object>} - A group level node
 */
async function image(file, width, height, mode, shape) {
	const result = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = reader.result;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

	const pixels = compute_pixels(result, width, height, shape);
	let level_nodes = build_nodes(pixels, mode);

	return groupNodes(level_nodes);
}

function compute_pixels(img, width, height, shape) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', { willReadFrequently: true });

	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);

	const pixels = [];

	if (shape === 'plane') {
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const pixel = ctx.getImageData(
					x * (img.width / width),
					y * (img.height / height),
					1,
					1,
				);
				pixels.push({
					r: pixel.data[0] / 255,
					g: pixel.data[1] / 255,
					b: pixel.data[2] / 255,
					a: pixel.data[3],
					x: x,
					y: y * -1,
					z: 10,
				});
			}
		}
	} else if (shape === 'sphere') {
		const image_data = ctx.getImageData(
			0,
			0,
			canvas.width,
			canvas.height,
		).data;
		const radius = Math.min(width, height);
		for (let x = -radius; x <= radius; x++) {
			for (let y = -radius; y <= radius; y++) {
				for (let z = 0 - radius; z <= 0 + radius; z++) {
					let distance = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
					if (distance > radius - 0.5 && distance < radius + 0.5) {
						const phi = Math.atan2(z, x);
						const theta = Math.acos(y / radius);

						const u = -(phi + radius) / (2 * Math.PI);
						const v = theta / Math.PI;

						const x_rounded = Math.floor(u * canvas.width);
						const y_rounded = Math.floor(v * canvas.height);

						const index =
							(y_rounded * canvas.width + x_rounded) * 4;
						const r = image_data[index] / 255;
						const g = image_data[index + 1] / 255;
						const b = image_data[index + 2] / 255;

						const color = gammaToLinear(r, g, b);

						pixels.push({
							r: color.r,
							g: color.g,
							b: color.b,
							a: color.a,
							x: x,
							y: y * -1,
							z: z,
						});
					}
				}
			}
		}
	}

	return pixels;
}

function build_nodes(pixels, mode) {
	let level_nodes = [];

	if (mode === 'particles') {
		let colors = [];
		let colorsMap = [];
		for (let i = 0; i < pixels.length; i++) {
			let color = {
				r: Math.floor(pixels[i].r * 24) / 24,
				g: Math.floor(pixels[i].g * 24) / 24,
				b: Math.floor(pixels[i].b * 24) / 24,
			};

			let index = colorsMap.findIndex(
				(c) => color.r === c.r && color.g === c.g && color.b === c.b,
			);
			if (index === -1) {
				index = colorsMap.length;
				colorsMap.push(color);
				colors.push([]);
			}

			colors[index].push(pixels[i]);
		}
		for (let j = 0; j < colors.length; j++) {
			let particlesNode = {
				levelNodeParticleEmitter: {
					position: {},
					scale: {
						x: 0.01,
						y: 0.01,
						z: 0.01,
					},
					rotation: {
						w: 1,
					},
					particlesPerSecond: colors[j].length,
					lifeSpan: {
						x: 5,
						y: 5,
					},
					startColor: {
						r: colorsMap[j].r,
						g: colorsMap[j].g,
						b: colorsMap[j].b,
						a: 1,
					},
					endColor: {
						r: colorsMap[j].r,
						g: colorsMap[j].g,
						b: colorsMap[j].b,
						a: 1,
					},
					startSize: {
						x: 0.1,
						y: 0.1,
					},
					endSize: {
						x: 0.08,
						y: 0.08,
					},
					velocity: {},
					velocityMin: {},
					velocityMax: {},
					accelerationMin: {},
					accelerationMax: {},
				},
				animations: [
					{
						name: 'idle',
						frames: colors[j].flatMap((p, i) => {
							return [
								{
									time: i * (1 / colors[j].length),
									position: {
										x: p.x * 0.1,
										y: p.y * 0.1,
										z: p.z * 0.1,
									},
									rotation: {
										w: 1,
									},
								},
								{
									time: (i + 1) * (1 / colors[j].length),
									position: {
										x: p.x * 0.1,
										y: p.y * 0.1,
										z: p.z * 0.1,
									},
									rotation: {
										w: 1,
									},
								},
							];
						}),
						speed: 1,
					},
				],
			};
			level_nodes.push(particlesNode);
		}
	} else if (mode === 'cubes') {
		level_nodes = pixels.map((pixel) => {
			return {
				levelNodeStatic: {
					material: 8,
					shape: 1000,
					position: {
						x: pixel.x,
						y: pixel.y,
						z: pixel.z,
					},
					color1: {
						r: pixel.r,
						g: pixel.g,
						b: pixel.b,
						a: 1,
					},
					rotation: {
						w: 1,
					},
					scale: {
						x: 1,
						y: 1,
						z: 1,
					},
					isNeon: true,
				},
			};
		});
	}

	return level_nodes;
}

function gammaToLinear(r, g, b) {
	r = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	g = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	b = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
	return { r, g, b, a: 1 };
}

export default {
	image,
};
