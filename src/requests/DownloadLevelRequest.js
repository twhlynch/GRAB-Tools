import { GRAB_SERVER_URL } from '@/config';

/**
 * @param {String} level_id
 * @returns {Promise<ArrayBuffer | null>}
 */
export async function download_level_request(level_id) {
	const level_path = level_id.split(/[:/]/).slice(0, 3).join('/');

	const response = await fetch(`${GRAB_SERVER_URL}download/${level_path}`);

	if (response.status !== 200) {
		const text = await response.text();
		window.toast(`Error: ${text}`, 'error');
		return null;
	}

	return await response.arrayBuffer();
}
