import { SERVER_URL } from '@/config';
import { useUserStore } from '@/stores/user';

/**
 * @returns {Promise<boolean | null>}
 */
export async function add_hardest_level_request(level_id, position) {
	const user = useUserStore();
	const url = `${SERVER_URL}add_hardest_level?level_id=${level_id}&position=${position}&access_token=${user.access_token}`;

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
