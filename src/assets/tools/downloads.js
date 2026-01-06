import { useUserStore } from '@/stores/user';
import { user_info_request } from '@/requests/UserInfoRequest';
import { download_level_request } from '@/requests/DownloadLevelRequest';
import { level_details_request } from '@/requests/LevelDetailsRequest';
import { can_download_level_request } from '@/requests/CanDownloadLevelRequest';
import { stats_data_request } from '@/requests/StatsDataRequest';

async function can_download_level(level_id) {
	const user = useUserStore();

	if (!user.is_logged_in) {
		window.toast('Login to download levels', 'warning');
		return false;
	}

	const user_id = level_id.split(':')[0];

	// can always download own levels
	if (user.grab_id === user_id) return true;

	// trust level flags first
	const level_details = await level_details_request(level_id);
	if (!level_details) {
		window.toast('Failed to get level info', 'warning');
		return false;
	}

	const { description, curated_listings } = level_details;

	if (description?.includes?.('[gt-dl]')) return true;
	if (description?.includes?.('[gt-nodl]')) {
		window.toast('Not permitted to download this level', 'warning');
		return false;
	}

	// then check server
	const can_download = await can_download_level_request(level_id);
	if (can_download) return true;
	if (can_download === false) {
		window.toast('Not permitted to download this level', 'warning');
		return false;
	}

	// then challenge and ooak
	if (curated_listings?.includes?.('challenge')) return true;
	if (curated_listings?.includes?.('one_of_a_kind')) return true;

	// check hardest levels list
	const hardest_list = await stats_data_request('hardest_levels_list');
	if (hardest_list?.find((level) => level.id === level_id)) return true;

	// if in doubt match username
	const user_info = await user_info_request(user_id);
	if (user.user_name === user_info?.user_name) return true;

	// default to false
	window.toast('Not permitted to download this level', 'warning');
	return false;
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

async function try_download_level(level_id) {
	if (level_id.includes('level=')) {
		const params = new URLSearchParams(level_id.split('?')[1]);
		const level = params.get('level');
		if (!level) {
			window.toast('Invalid level url', 'warning');
			return null;
		}
		level_id = level;
	}

	if (await can_download_level(level_id)) {
		return await download_level(level_id);
	}
	return null;
}

export default {
	download_level,
	can_download_level,
	try_download_level,
};
