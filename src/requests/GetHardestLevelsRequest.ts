import { SERVER_URL } from '@/config';

interface ListRow {
	position: number;
	level_id: string;
	title: string;
	creators: string;
}

export async function get_hardest_levels_request() {
	const url = `${SERVER_URL}get_hardest_levels`;

	try {
		const response = await fetch(url);

		if (!response.ok) return null;

		return (await response.json()) as ListRow[];
	} catch {
		return null;
	}
}
