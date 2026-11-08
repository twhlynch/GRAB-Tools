import { LevelNodeObject } from '@/common/levelNodes';
import {
	LevelNodeLight,
	LevelNodeLightType,
} from '@grab-tools/lib/generated/proto';
import {
	DataTexture,
	FloatType,
	MathUtils,
	Quaternion,
	RGBAFormat,
	Vector3,
} from 'three';

export interface LightData {
	object: LevelNodeObject<LevelNodeLight>;
	type: LevelNodeLightType;
	color: [number, number, number, number];
	intensity: number;
	range: number;
	angle: number;
	distanceFalloff: number;
	coneFalloff: number;
}

export class Lights {
	max = 1024;
	data: Float32Array<ArrayBuffer>;
	texture: DataTexture;
	lights: LightData[] = [];
	pointCount = { value: 0 };
	spotCount = { value: 0 };

	constructor() {
		this.data = new Float32Array(3 * this.max * 4);
		this.texture = new DataTexture(
			this.data,
			3,
			this.max,
			RGBAFormat,
			FloatType,
		);
		this.texture.needsUpdate = true;
	}

	add(object: LevelNodeObject<LevelNodeLight>, node: LevelNodeLight) {
		const c = node.color;
		// rgb or default to all 1s
		let color: [number, number, number, number] = c
			? [c.r ?? 0, c.g ?? 0, c.b ?? 0, c.a ?? 0]
			: [1, 1, 1, 1];

		// any nonfinite defaults back to all 1s
		if (!color.every(Number.isFinite)) color = [1, 1, 1, 1];

		// clamp rgb to 0-1
		color = color.map((v, i) =>
			i < 3 ? Math.min(Math.max(v, 0), 1) : v,
		) as [number, number, number, number];

		const clamp = (v: number, lo: number, hi: number, nonFinite: number) =>
			!Number.isFinite(v) ? nonFinite : Math.min(Math.max(v, lo), hi);

		this.lights.push({
			object,
			type: node.type ?? LevelNodeLightType.POINT,
			color,
			intensity: clamp(node.intensity ?? 0, 0, 10, 0),
			range: clamp(node.range ?? 0, 0, 100, 0),
			angle: clamp(node.angle ?? 0, 1, 89, 1),
			distanceFalloff: clamp(node.distanceFalloffShape ?? 3, 1, 9, 3),
			coneFalloff: clamp(node.coneFalloffShape ?? 0, 0, 8, 0),
		});
	}

	update() {
		const points = this.lights.filter(
			(light) =>
				light.type === LevelNodeLightType.POINT &&
				light.intensity > 1e-7,
		);
		const spots = this.lights.filter(
			(light) =>
				light.type === LevelNodeLightType.SPOT &&
				light.intensity > 1e-7,
		);
		const all = [...points, ...spots].slice(0, this.max);

		const position = new Vector3();
		const rotation = new Quaternion();
		const forward = new Vector3();

		all.forEach((light, i) => {
			light.object.getWorldPosition(position);
			light.object.getWorldQuaternion(rotation);

			const offset = i * 12;

			this.data.set(
				// xyz is position
				[position.x, position.y, position.z, light.range],
				// w is range
				offset,
			);

			const w =
				light.type === LevelNodeLightType.SPOT
					? Math.round(light.distanceFalloff * 10) * 100 +
						Math.round(light.coneFalloff * 10)
					: light.distanceFalloff;

			this.data.set(
				// xyz is rgb * intensity
				[
					light.color[0] * light.intensity,
					light.color[1] * light.intensity,
					light.color[2] * light.intensity,
					// w is the falloff shape
					w,
				],
				offset + 4,
			);

			forward.set(0, 0, -1).applyQuaternion(rotation);
			this.data.set(
				// xyz is the forward direction of the light
				[
					forward.x,
					forward.y,
					forward.z,
					Math.cos(light.angle * MathUtils.DEG2RAD),
				],
				// w is the cosine of the angle in radians
				offset + 8,
			);
		});

		this.pointCount.value = Math.min(points.length, this.max);
		this.spotCount.value = Math.max(0, all.length - this.pointCount.value);
		this.texture.needsUpdate = true;
	}
}
