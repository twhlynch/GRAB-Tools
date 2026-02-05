import { GRAB_SERVER_URL } from '@/config';
import { clean_level_id, safe_fetch_json } from './RequestUtils';

export async function level_details_request(
	level_id: string,
): Promise<LevelDetails | null> {
	const level_path = clean_level_id(level_id, '/');
	const url = `${GRAB_SERVER_URL}details/${level_path}`;
	const data = await safe_fetch_json<LevelDetails>(url);
	return data;
}
