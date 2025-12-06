import { LOGGING_URL } from '@/config';
import { useUserStore } from '@/stores/user';

// LOGIN, LOGOUT, MIMIC, EDIT, BLOCKED, DOWNLOAD
export async function LogEvent(
	action,
	level_id = null,
	user_id = null,
	user_name = null,
) {
	const user = useUserStore();
	if (!user_name) user_name = user.user_name;
	if (!user_id) user_id = user.user_info?.user_id;
	if (!user_id) user_id = user.meta_id; // fallback

	// dearest data miner, please don't abuse this.
	try {
		fetch(LOGGING_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				...(action && { action }),
				...(user_id && { user_id }),
				...(user_name && { user_name }),
				...(level_id && { level_id }),
			}),
		});
	} catch {
		// idc
	}
}
