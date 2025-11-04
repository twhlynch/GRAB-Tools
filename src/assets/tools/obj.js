/**
 * @param {File} file - An obj file
 * @param {"spheres" | "particles"} mode - what is placed
 * @returns {Promise<Array<Object>>} - A list of level nodes
 */
async function obj(file, mode) {
	const text = await file.text();

	const model = obj_vertices(text);

	const nodes = [];

	if (mode === 'particles') {
		for (let i = 0; i < model.length; i++) {
			const rgb = [Math.random(), Math.random(), Math.random()];
			let node = {
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
					particlesPerSecond: 999,
					lifeSpan: {
						x: 5,
						y: 5,
					},
					startColor: {
						r: rgb[0],
						g: rgb[1],
						b: rgb[2],
						a: 1,
					},
					endColor: {
						r: rgb[0],
						g: rgb[1],
						b: rgb[2],
						a: 1,
					},
					startSize: {
						x: 0.1,
						y: 0.1,
					},
					endSize: {
						x: 0.1,
						y: 0.1,
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
						frames: model[i].map((p, j) => {
							return {
								time: j * (1 / model[i].length),
								position: {
									x: p[0],
									y: p[1],
									z: p[2],
								},
								rotation: {
									w: 1,
								},
							};
						}),
						speed: 1,
					},
				],
			};
			nodes.push(node);
		}
	} else {
		const flat = model.flat();
		for (let i = 0; i < flat.length; i++) {
			nodes.push({
				levelNodeStatic: {
					material: 8,
					position: {
						x: flat[i][0],
						y: flat[i][1],
						z: flat[i][2],
					},
					color1: {
						r: 1,
						g: 1,
						b: 1,
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
					shape: 1001,
				},
			});
		}
	}

	return nodes;
}

function obj_vertices(text) {
	const lines = text.split('\n');

	const model = [];
	let mesh = [];

	lines.forEach((line) => {
		if (line.startsWith('v ')) {
			const position = line.replace('v ', '').split(' ').map(parseFloat);
			mesh.push(position);
		} else if (line.startsWith('usemtl ') || line.startsWith('o ')) {
			if (mesh.length) {
				model.push(mesh);
				mesh = [];
			}
		}
	});
	if (mesh.length) model.push(mesh);

	return model;
}

export default {
	obj,
};
