import protobuf from 'protobufjs';

/**
 * @returns {Promise<protobuf.Root>} - The level message root
 */
async function load() {
	if (window._root === undefined) {
		const root = await protobuf.load('proto/proto.proto');
		window._root = root;
	}

	return window._root;
}

/**
 * @param {ArrayBuffer} buffer - A level as a buffer
 * @returns {Promise<Object>} - A level decoded to json
 */
async function decodeLevel(buffer) {
	const data = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsArrayBuffer(buffer);
	});

	const root = await load();
	const message = root.lookupType('COD.Level.Level');
	const decoded = message.decode(new Uint8Array(data));

	return message.toObject(decoded);
}

/**
 * @param {Object} level - A level as json
 * @returns {Promise<ArrayBuffer>} - A level encoded as a buffer
 */
async function encodeLevel(level) {
	const root = await load();
	const message = root.lookupType('COD.Level.Level');

	const errMsg = message.verify(level);
	if (errMsg) {
		window.toast(errMsg, 'error');
		return null;
	}

	return message.encode(message.fromObject(level)).finish();
}

/**
 * @param {ArrayBuffer} buffer - A level as a buffer
 */
function downloadLevel(buffer, name = Date.now().toString().slice(0, -3)) {
	let blob = new Blob([buffer], {
		type: 'application/octet-stream',
	});

	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.level';
	link.click();
}

/**
 * @param {JSON} json - A level as json
 */
function downloadJSON(json, name = Date.now().toString().slice(0, -3)) {
	let blob = new Blob([JSON.stringify(json, null, 2)], {
		type: 'application/json',
	});

	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.json';
	link.click();
}

/**
 * @returns {Array<Object>} - A level json
 */
function createLevel(
	nodes = [],
	title = 'New Level',
	description = 'Made with GRAB Tools',
	creators = ['grabvr.tools'],
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
) {
	if (Array.isArray(creators)) {
		creators = creators.join(', ');
	}
	return {
		formatVersion: 17,
		title: title,
		creators: creators,
		description: description,
		tags: [],
		maxCheckpointCount: checkpoints,
		defaultSpawnPointID: 0,
		unlisted: false,
		showReplays: true,
		complexity: 0,
		ambienceSettings: {
			skyHorizonColor: horizon,
			skyZenithColor: zenith,
			sunAltitude: sunAltitude,
			sunAzimuth: sunAzimuth,
			sunSize: sunSize,
			fogDensity: fogDensity,
		},
		levelNodes: nodes,
	};
}

export default {
	decodeLevel,
	encodeLevel,
	load,
	createLevel,
	downloadLevel,
	downloadJSON,
};
