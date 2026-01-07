import { SERVER_URL } from '@/config';
import { useUserStore } from '@/stores/user';

/**
 * @param {String | null} level_url
 * @param {String | null} access_token
 * @returns {Promise<Boolean>}
 */
export async function verify_account_request(level_url, access_token) {
	if (!level_url && !access_token) return;

	let url = `${SERVER_URL}verify_account`;

	if (access_token) {
		url += `?token=${access_token}`;
	} else if (level_url) {
		const params = new URLSearchParams(level_url);
		url += `?level_id=${params.get('level')}`;
	}

	const userStore = useUserStore();
	url += `&access_token=${userStore.access_token}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const text = await response.text();
			window.toast(`Error: ${text}`, 'error');
			return false;
		}

		const json = await response.json();
		userStore.grab_id = json.grab_id;

		return true;
	} catch {
		window.toast(`Error: Failed to verify`, 'error');
		return false;
	}
}
