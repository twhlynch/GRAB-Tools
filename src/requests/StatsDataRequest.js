import { STATS_SERVER_URL } from '@/config';

/**
 * @param {String} key
 * @returns {Promise<JSON | null>}
 */
export async function stats_data_request(key) {
	const update_hour = 5 + 1;
	const now = Date.now();
	const current_date = new Date(now);
	const days_since_epoch = Math.floor(now / (24 * 60 * 60 * 1000));
	const current_hours = current_date.getUTCHours();
	const current_minutes = current_date.getUTCMinutes();
	const is_past =
		current_hours > update_hour ||
		(current_hours === update_hour && current_minutes > 0);
	const cache_value = is_past ? days_since_epoch + 1 : days_since_epoch;

	const url = `${STATS_SERVER_URL}${key}.json?cache=${cache_value}`;

	const response = await fetch(url);

	if (response.status !== 200) {
		window.toast(`Error: Failed to load stats`, 'error');
		return null;
	}

	return await response.json();
}
