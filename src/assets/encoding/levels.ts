import { load } from '@/assets/encoding/root';
import { DOMAIN, FORMAT_VERSION } from '@/config';
import { Color, Level, LevelNode } from '@/generated/proto';

export async function decodeLevel(buffer: Blob): Promise<Level | null> {
	try {
		const data: ArrayBuffer = await new Promise<ArrayBuffer>(
			(resolve, reject) => {
				const reader = new FileReader();

				reader.onload = () => {
					const result = reader.result;

					if (result instanceof ArrayBuffer) {
						resolve(result);
					} else {
						reject(new Error('Unexpected FileReader result type'));
					}
				};

				reader.onerror = () => {
					reject(reader.error ?? new Error('FileReader error'));
				};

				reader.readAsArrayBuffer(buffer);
			},
		);

		const root = load();

		const message = root.lookupType('COD.Level.Level');
		const decoded = message.decode(new Uint8Array(data));

		const level: Level = message.toObject(decoded);

		return level;
	} catch (e) {
		if (e instanceof Error) {
			e.message = 'Invalid level data: ' + e.message;
			window.toast(e, 'error');
		}
		return null;
	}
}

export async function encodeLevel(level: Level): Promise<ArrayBuffer | null> {
	const root = load();
	const message = root.lookupType('COD.Level.Level');

	const errMsg = message.verify(level);
	if (errMsg) {
		window.toast(errMsg, 'error');
		return null;
	}

	return message.encode(message.fromObject(level)).finish();
}

export function downloadLevel(
	level: ArrayBuffer,
	name: string = Date.now().toString().slice(0, -3),
) {
	const blob = new Blob([level], {
		type: 'application/octet-stream',
	});

	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.level';
	link.click();
}

export function downloadJSON(
	json: Level,
	name: string = Date.now().toString().slice(0, -3),
) {
	const blob = new Blob([JSON.stringify(json, null, 2)], {
		type: 'application/json',
	});

	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.json';
	link.click();
}

export function createLevel(
	nodes: Array<LevelNode> = [],
	title = 'New Level',
	description = 'Made with GRAB Tools',
	creators: Array<string> | string = [DOMAIN],
	checkpoints = 10,
	horizon = {
		a: 1.0,
		b: 0.9574,
		g: 0.9574,
		r: 0.916,
	},
	zenith = {
		a: 1.0,
		b: 0.73,
		g: 0.476,
		r: 0.28,
	},
	sunAltitude = 45,
	sunAzimuth = 315,
	sunSize = 1,
	fogDensity = 0,
): Level {
	if (Array.isArray(creators)) {
		creators = creators.join(', ');
	}
	return {
		formatVersion: FORMAT_VERSION,
		title: title,
		creators: creators,
		description: description,
		tags: [],
		maxCheckpointCount: checkpoints,
		defaultSpawnPointID: 0,
		unlisted: false,
		showReplays: true,
		complexity: 0,
		ambienceSettings: ambienceSettings(
			horizon,
			zenith,
			sunAltitude,
			sunAzimuth,
			sunSize,
			fogDensity,
		),
		levelNodes: nodes,
	};
}

export function ambienceSettings(
	horizon: Color,
	zenith: Color,
	sunAltitude: number,
	sunAzimuth: number,
	sunSize: number,
	fogDensity: number,
) {
	if (
		!(
			horizon ||
			zenith ||
			sunAzimuth ||
			sunAltitude ||
			sunSize ||
			fogDensity
		)
	) {
		horizon = {
			a: 1.0,
			b: 0.9574,
			g: 0.9574,
			r: 0.916,
		};
		zenith = {
			a: 1.0,
			b: 0.73,
			g: 0.476,
			r: 0.28,
		};
		sunAltitude = 45;
		sunAzimuth = 315;
		sunSize = 1;
		fogDensity = 0;
	}
	return {
		skyHorizonColor: horizon ?? { r: 0, g: 0, b: 0 },
		skyZenithColor: zenith ?? { r: 0, g: 0, b: 0 },
		sunAltitude: sunAltitude ?? 0,
		sunAzimuth: sunAzimuth ?? 0,
		sunSize: sunSize ?? 0,
		fogDensity: fogDensity ?? 0,
	};
}
