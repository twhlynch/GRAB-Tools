import { SERVER_URL } from '@/config';

export async function get_allow_downloads_request(user_id: string) {
	const url = `${SERVER_URL}get_allow_downloads?user_id=${user_id}`;

	try {
		const response = await fetch(url);

		if (!response.ok) return null;

		return (await response.json()) as {
			user: boolean;
			levels: {
				level_id: string;
				allow: boolean;
			}[];
		};
	} catch {
		return null;
	}
}
