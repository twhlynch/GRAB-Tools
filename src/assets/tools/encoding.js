import protobuf from 'protobufjs';

async function load() {
	if (window._root === undefined) {
		const root = await protobuf.load('proto/proto.proto');
		window._root = root;
	}

	return window._root;
}

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

function downloadLevel(buffer, name = Date.now().toString().slice(0, -3)) {
	let blob = new Blob([buffer], {
		type: 'application/octet-stream',
	});

	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = name + '.level';
	link.click();
}

function createLevel(
	nodes = [],
	title = 'New Level',
	description = '',
	creators = ['.index'],
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
) {
	if (Array.isArray(creators)) {
		creators = creators.join(', ');
	}
	return {
		ambienceSettings: {
			skyHorizonColor: horizon,
			skyZenithColor: zenith,
			sunAltitude: sunAltitude,
			sunAzimuth: sunAzimuth,
			sunSize: sunSize,
		},
		complexity: 0,
		creators: creators,
		description: description,
		formatVersion: 12,
		levelNodes: nodes,
		maxCheckpointCount: checkpoints,
		title: title,
	};
}

export default {
	decodeLevel,
	encodeLevel,
	load,
	createLevel,
	downloadLevel,
};
