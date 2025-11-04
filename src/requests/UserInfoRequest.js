import { GRAB_SERVER_URL } from '@/config';

/**
 * @param {String} user_id
 * @returns {Promise<JSON | null>}
 */
export async function user_info_request(user_id) {
	const response = await fetch(
		`${GRAB_SERVER_URL}get_user_info?user_id=${user_id}`,
	);

	if (response.status !== 200) {
		const text = await response.text();
		window.toast(`Error: ${text}`, 'error');
		return null;
	}

	return await response.json();
}
