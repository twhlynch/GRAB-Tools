import { useUserStore } from '@/stores/user';
import { user_info_request } from '@/requests/UserInfoRequest';
import { download_level_request } from '@/requests/DownloadLevelRequest';
import { level_details_request } from '@/requests/LevelDetailsRequest';

async function can_download_level(level_id) {
	const user = useUserStore();

	if (!user.is_logged_in) {
		window.toast('Login to download your levels', 'warning');
		return false;
	}

	const user_id = level_id.split(':')[0];

	const user_info = await user_info_request(user_id);
	if (user_info === null) return false;

	if (user.user_name !== user_info.user_name) {
		window.toast('You can only download your own levels', 'warning');
		return false;
	}

	return true;
}

async function download_level(level_id) {
	let [user_id, map_id, iteration] = level_id.split(':');

	if (!iteration) {
		const details = await level_details_request(level_id);
		if (details === null) return null;

		iteration = iteration || details.iteration;
	}

	const download_id = [user_id, map_id, iteration].join(':');

	const level = await download_level_request(download_id);

	return level;
}

export default {
	download_level,
	can_download_level,
};
