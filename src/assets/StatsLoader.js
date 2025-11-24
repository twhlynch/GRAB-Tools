import { stats_data_request } from '@/requests/StatsDataRequest';

const stats = {};

/**
 * @brief retrieve the stats for a given key
 */
function load(key) {
	if (!stats[key]) {
		stats[key] = _load(key);
	}
	return stats[key];
}

async function load_multiple(keys) {
	await Promise.all(keys.map(load));
}

async function _load(key) {
	const data = await stats_data_request(key);
	return data;
}

// MARK: getters

async function get_trending_maps() {
	const data = await load('all_verified');
	const sorted = [...data].sort((a, b) => b.change - a.change);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(entry.change)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_weekly_trending_maps() {
	const data = await load('all_verified');

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort((a, b) => b.statistics.total_played - a.statistics.total_played)
		.filter(
			(map) => new Date() - new Date(map.creation_timestamp) < 7 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_monthly_trending_maps() {
	const data = await load('all_verified');

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort((a, b) => b.statistics.total_played - a.statistics.total_played)
		.filter(
			(map) => new Date() - new Date(map.creation_timestamp) < 30 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_yearly_trending_maps() {
	const data = await load('all_verified');

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort((a, b) => b.statistics.total_played - a.statistics.total_played)
		.filter(
			(map) => new Date() - new Date(map.creation_timestamp) < 365 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_trending_creators() {}
async function get_unbeaten_maps() {
	const data = await load('unbeaten_levels');
	return data.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_unbeaten_maps_by_creation() {
	const data = await load('unbeaten_levels');
	const sorted = [...data].sort(
		(a, b) => a.creation_timestamp - b.creation_timestamp,
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.creation_timestamp)} days`,
		};
	});
}
async function get_unbeaten_maps_by_update() {
	const data = await load('unbeaten_levels');
	const sorted = [...data].sort(
		(a, b) => a.update_timestamp - b.update_timestamp,
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.update_timestamp)} days`,
		};
	});
}
async function get_sole_beaten_maps() {}
async function get_unbeaten_creators() {}
async function get_search_stats() {}
async function get_most_verified_players() {}
async function get_most_plays_creators() {}
async function get_most_played_maps() {
	const data = await load('all_verified');
	const sorted = [...data].sort(
		(a, b) => b.statistics.total_played - a.statistics.total_played,
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(entry?.statistics?.total_played)} plays`,
		};
	});
}
async function get_most_liked_maps() {
	const data = await load('all_verified');
	const sorted = [...data]
		.sort(
			(a, b) =>
				b.statistics.liked *
					b.statistics.difficulty *
					b.statistics.total_played -
				a.statistics.liked *
					a.statistics.difficulty *
					a.statistics.total_played,
		)
		.filter(
			(map) =>
				map.statistics.total_played > 2000 &&
				map.statistics.total_played * map.statistics.difficulty > 10,
		);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				Math.round(
					entry?.statistics?.liked *
						entry?.statistics?.total_played *
						entry?.statistics?.difficulty,
				),
			)} (${Math.round(100 * entry?.statistics?.liked)}%)`,
		};
	});
}
async function get_most_disliked_maps() {
	const data = await load('all_verified');
	const sorted = [...data]
		.sort(
			(a, b) =>
				(1 - b.statistics.liked) *
					b.statistics.difficulty *
					b.statistics.total_played -
				(1 - a.statistics.liked) *
					a.statistics.difficulty *
					a.statistics.total_played,
		)
		.filter(
			(map) =>
				map.statistics.total_played > 2000 &&
				map.statistics.total_played * map.statistics.difficulty > 10,
		);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				Math.round(
					(1 - entry?.statistics?.liked) *
						entry?.statistics?.total_played *
						entry?.statistics?.difficulty,
				),
			)} (${Math.round(100 - 100 * entry?.statistics?.liked)}%)`,
		};
	});
}
async function get_longest_time_maps() {
	const data = await load('all_verified');
	const sorted = [...data]
		.sort((a, b) => b.statistics.time - a.statistics.time)
		// ignore 'the fall out...' 1 week bugged time
		.filter((m) => m.identifier !== '2c2jxd1bl88kk3c9d407z:1717100734');

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${Math.round(entry?.statistics?.time)}s`,
		};
	});
}
async function get_daily_map() {}
async function get_most_featured_creators() {}
async function get_best_of_grab() {}
async function get_all_completions() {}
async function get_easy_completions() {}
async function get_medium_completions() {}
async function get_hard_completions() {}
async function get_very_hard_completions() {}
async function get_global_stats() {}
async function get_most_records() {}
async function get_most_completions() {}
async function get_most_first_completions() {}
async function get_most_playtime() {}
async function get_most_sole_completions() {}
async function get_most_tipped_maps() {}
async function get_most_tipped_creators() {}
async function get_personalised_stats() {}

// MARK: util

function format_number(x) {
	let parts = x.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}
function number_suffix(number) {
	const num = Math.abs(number) | 0;
	const mod100 = num % 100;
	if (mod100 >= 11 && mod100 <= 13) return 'th';
	return { 1: 'st', 2: 'nd', 3: 'rd' }[num % 10] || 'th';
}
function timestamp_days(timestamp) {
	const day = 1000 * 60 * 60 * 24;
	return Math.round((new Date() - new Date(timestamp)) / day);
}

export default {
	load,
	load_multiple,
	// getters
	get_trending_maps,
	get_weekly_trending_maps,
	get_monthly_trending_maps,
	get_yearly_trending_maps,
	get_trending_creators,
	get_unbeaten_maps,
	get_unbeaten_maps_by_creation,
	get_unbeaten_maps_by_update,
	get_sole_beaten_maps,
	get_unbeaten_creators,
	get_search_stats,
	get_most_verified_players,
	get_most_plays_creators,
	get_most_played_maps,
	get_most_liked_maps,
	get_most_disliked_maps,
	get_longest_time_maps,
	get_daily_map,
	get_most_featured_creators,
	get_best_of_grab,
	get_all_completions,
	get_easy_completions,
	get_medium_completions,
	get_hard_completions,
	get_very_hard_completions,
	get_global_stats,
	get_most_records,
	get_most_completions,
	get_most_first_completions,
	get_most_playtime,
	get_most_sole_completions,
	get_most_tipped_maps,
	get_most_tipped_creators,
	get_personalised_stats,
};
