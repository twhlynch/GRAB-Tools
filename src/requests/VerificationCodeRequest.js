import { SERVER_URL } from '@/config';
import { useUserStore } from '@/stores/user';

/**
 * @returns {Promise<String | null>}
 */
export async function verification_code_request() {
	const userStore = useUserStore();
	let url = `${SERVER_URL}get_verification_code?access_token=${userStore.access_token}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const text = await response.text();
			window.toast(`Error: ${text}`, 'error');
			return null;
		}

		const json = await response.json();
		return json.code;
	} catch {
		window.toast(`Error: Failed to get code`, 'error');
		return null;
	}
}
