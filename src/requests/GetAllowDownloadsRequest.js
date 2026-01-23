import { SERVER_URL } from '@/config';

/**
 * @returns {Promise<Array | null>}
 */
export async function get_allow_downloads_request(user_id) {
	const url = `${SERVER_URL}get_allow_downloads?user_id=${user_id}`;

	try {
		const response = await fetch(url);

		if (!response.ok) return null;

		return await response.json();
	} catch {
		return null;
	}
}
