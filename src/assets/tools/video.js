import encoding from '#assets/tools/encoding.js';

const VIDEO_SERVER_URL = 'https://dotindex.pythonanywhere.com/process_video';

async function video(file) {
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
