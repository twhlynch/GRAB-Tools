import { SERVER_URL } from '@/config';
import { useUserStore } from '@/stores/user';

/**
 * @returns {Promise<boolean | null>}
 */
export async function remove_hardest_level_request(level_id) {
	const user = useUserStore();
	const url = `${SERVER_URL}remove_hardest_level?level_id=${level_id}&access_token=${user.access_token}`;

	try {
		const response = await fetch(url);

		const text = await response.text();
		if (!response.ok) {
			window.toast('Error: ' + text);
			return null;
		}

		return true;
	} catch {
		return null;
	}
}
