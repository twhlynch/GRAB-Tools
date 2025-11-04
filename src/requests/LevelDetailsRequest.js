import { GRAB_SERVER_URL } from '@/config';

/**
 * @param {String} level_id
 * @returns {Promise<JSON | null>}
 */
export async function level_details_request(level_id) {
	const level_path = level_id.split(/[:/]/).slice(0, 2).join('/');

	const response = await fetch(`${GRAB_SERVER_URL}details/${level_path}`);

	if (response.status !== 200) {
		const text = await response.text();
		window.toast(`Error: ${text}`, 'error');
		return null;
	}

	return await response.json();
}
