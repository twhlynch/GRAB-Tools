import { SERVER_URL } from '@/config';

/**
 * @returns {Promise<Array | null>}
 */
export async function get_hardest_levels_request() {
	const url = `${SERVER_URL}get_hardest_levels`;

	try {
		const response = await fetch(url);

		if (!response.ok) return null;

		return await response.json();
	} catch {
		return null;
	}
}
