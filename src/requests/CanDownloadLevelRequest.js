import { SERVER_URL } from '@/config';

/**
 * @param {String} level_id
 * @returns {Promise<Boolean | null>}
 */
export async function can_download_level_request(level_id) {
	const url = `${SERVER_URL}can_download_level?level_id=${level_id}`;

	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			return null;
		}

		return (await response.json()).allow;
	} catch {
		return null;
	}
}
