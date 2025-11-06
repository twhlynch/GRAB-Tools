import encoding from '@/assets/tools/encoding.js';

const VIDEO_SERVER_URL = 'https://dotindex.pythonanywhere.com/process_video';

/**
 * @param {File} file - A video file
 * @param {Number} width - Output width
 * @param {Number} height - Output height
 * @returns {Promise<Array<Object>>} - A list of level nodes
 */
async function video(file, width, height) {
	if (!window.MediaStreamTrackProcessor) {
		window.toast(
			'MediaStreamTrackProcessor not available on firefox, using server fallback',
			'warning',
		);
		return fallback_video(file);
	}

	const video_data = await read_video(file);
	const level_nodes = await build_video(video_data, width, height);

	return level_nodes;
}

async function read_video(file) {
	const buffer = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async () => {
			const buffer = new Uint8Array(reader.result);
			resolve(buffer);
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});

	const blob = new Blob([buffer], {
		type: 'video/mp4',
	});
	const video = document.createElement('video');
	video.src = window.URL.createObjectURL(blob);
	video.muted = true;

	await video.play();
	const [track] = video.captureStream().getVideoTracks();
	video.onended = () => track.stop();

	// eslint-disable-next-line no-undef
	const processor = new MediaStreamTrackProcessor(track); // fuck firefox
	const video_reader = processor.readable.getReader();

	const frames = [];

	let finished = false;
	while (!finished) {
		const { done, value } = await video_reader.read();
		finished = done;

		if (value) {
			frames.push(await createImageBitmap(value));
			console.log(
				`Reading Video: ${Math.round(
					(video.currentTime / video.duration) * 100,
				)}%`,
			);
			value.close();
		}
	}

	return frames;
}

async function build_video(frames, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');

	const level_nodes = [];
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
	level_nodes.push({
		levelNodeStatic: {
			material: 8,
			shape: 1000,
			color1: { r: 1, g: 1, b: 1 },
			rotation: { w: 1 },
			scale: { x: width, y: height, z: 0.01 },
			position: { x: width / 2 - 0.5, y: -(height / 2 - 0.5) },
		},
	});

	for (let i in frames) {
		const frame = frames[i];
		// these may be redundant
		ctx.drawImage(frame, 0, 0, width, height);
		const imageData = ctx.getImageData(0, 0, width, height);

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const index = x + y * width;
				const data_index = index * 4;
				const r = imageData.data[data_index] / 255;
				const g = imageData.data[data_index + 1] / 255;
				const b = imageData.data[data_index + 2] / 255;
				const brightness = Math.sqrt(
					0.299 * Math.pow(r, 2) +
						0.587 * Math.pow(g, 2) +
						0.114 * Math.pow(b, 2),
				);
				const z = Math.round(brightness * 0.5 * 1000) / 1000;
				const pixel_frames = level_nodes[index].animations[0].frames;
				let last_frame = pixel_frames[pixel_frames.length - 1];
				const is_dupe =
					pixel_frames.length >= 1 && z === last_frame.position.z;
				const has_dedupe =
					pixel_frames.length >= 2 &&
					z === pixel_frames[pixel_frames.length - 2].position.z;

				if (is_dupe) {
					if (!has_dedupe) {
						pixel_frames.push({
							time: last_frame.time,
							position: { z: last_frame.position.z },
							rotation: { w: 1 },
						});
						last_frame = pixel_frames[pixel_frames.length - 1];
					}
					last_frame.time = i * (1 / 24);
				} else {
					pixel_frames.push({
						time: i * (1 / 24),
						position: { z },
						rotation: { w: 1 },
					});
				}
			}
		}
	}

	return level_nodes;
}

/**
 * @param {File} file - A video file
 * @returns {Promise<Array<Object>>} - A list of level nodes
 */
async function fallback_video(file) {
	const formData = new FormData();
	formData.append('file', file);

	let response;
	try {
		response = await fetch(VIDEO_SERVER_URL, {
			method: 'POST',
			body: formData,
		});
	} catch (e) {
		window.toast('Error making request: ' + e.message, 'error');
		return null;
	}

	if (!response.ok) {
		const error = await response.text();
		window.toast('Error processing video: ' + error, 'error');
		return null;
	}

	const result = await response.arrayBuffer();
	const level = await encoding.decodeLevel(result);

	if (!level.levelNodes?.length) {
		window.toast('Video returned has no nodes', 'error');
		return null;
	}

	return level.levelNodes;
}

export default {
	video,
};
