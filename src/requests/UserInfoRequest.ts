import { GRAB_SERVER_URL } from '@/config';
import { safe_fetch_json } from './RequestUtils';

export async function user_info_request(
	user_id: string,
): Promise<UserInfo | null> {
	const url = `${GRAB_SERVER_URL}get_user_info?user_id=${user_id}`;
	const data = await safe_fetch_json<UserInfo>(url);
	return data;
}
