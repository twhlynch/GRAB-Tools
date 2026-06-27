import { GRAB_SERVER_URL } from '@/config';

export async function download_level_request(level_id: string) {
	const level_path = level_id.split(/[:/]/).slice(0, 3).join('/');
	const url = `${GRAB_SERVER_URL}download/${level_path}`;

	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			const text = await response.text();
			window.toast(`Error: ${text}`, 'error');
			return null;
		}

		return await response.arrayBuffer();
	} catch {
		window.toast(`Error: Failed to download map`, 'error');
		return null;
	}
}
