import { FORMAT_VERSION, GRAB_SERVER_URL } from '@/config';

/**
 * @param {String} user_id
 * @returns {Promise<JSON | null>}
 */
export async function list_request(type) {
	const url = `${GRAB_SERVER_URL}list?type=${type}&max_format_version=${FORMAT_VERSION}`;

	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			const text = await response.text();
			window.toast(`Error: ${text}`, 'error');
			return null;
		}

		return await response.json();
	} catch {
		window.toast(`Error: Failed to load levels`, 'error');
		return null;
	}
}
