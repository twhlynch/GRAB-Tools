import { all_verified_data_request } from '@/requests/StatsDataRequest';

/* eslint-disable @typescript-eslint/no-empty-function */

// MARK: getters

async function get_trending_maps() {
	const data = (await all_verified_data_request()) ?? [];
	const sorted = [...data].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(entry.change ?? 0)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_weekly_trending_maps() {
	const data = (await all_verified_data_request()) ?? [];

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort(
			(a, b) =>
				(b.statistics?.total_played ?? 0) -
				(a.statistics?.total_played ?? 0),
		)
		.filter(
			(map) =>
				new Date().getTime() -
					new Date(map.creation_timestamp ?? 0).getTime() <
				7 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_monthly_trending_maps() {
	const data = (await all_verified_data_request()) ?? [];

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort(
			(a, b) =>
				(b.statistics?.total_played ?? 0) -
				(a.statistics?.total_played ?? 0),
		)
		.filter(
			(map) =>
				new Date().getTime() -
					new Date(map.creation_timestamp ?? 0).getTime() <
				30 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_yearly_trending_maps() {
	const data = (await all_verified_data_request()) ?? [];

	const day = 24 * 60 * 60 * 1000;
	const sorted = [...data]
		.sort(
			(a, b) =>
				(b.statistics?.total_played ?? 0) -
				(a.statistics?.total_played ?? 0),
		)
		.filter(
			(map) =>
				new Date().getTime() -
					new Date(map.creation_timestamp ?? 0).getTime() <
				365 * day,
		);

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				entry.statistics?.total_played ?? 0,
			)} plays`,
			extra: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_trending_creators() {}
async function get_unbeaten_maps() {
	const data = ((await all_verified_data_request()) ?? []).filter(
		(level) => level.unbeaten,
	);
	return data.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_unbeaten_maps_by_creation() {
	const data = ((await all_verified_data_request()) ?? []).filter(
		(level) => level.unbeaten,
	);
	const sorted = [...data].sort(
		(a, b) => (a.creation_timestamp ?? 0) - (b.creation_timestamp ?? 0),
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.creation_timestamp ?? 0)} days`,
		};
	});
}
async function get_unbeaten_maps_by_update() {
	const data = ((await all_verified_data_request()) ?? []).filter(
		(level) => level.unbeaten,
	);
	const sorted = [...data].sort(
		(a, b) => (a.update_timestamp ?? 0) - (b.update_timestamp ?? 0),
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${timestamp_days(entry.update_timestamp ?? 0)} days`,
		};
	});
}
async function get_sole_beaten_maps() {}
async function get_unbeaten_creators() {}
async function get_search_stats() {}
async function get_most_verified_players() {}
async function get_most_plays_creators() {}
async function get_most_played_maps() {
	const data = (await all_verified_data_request()) ?? [];

	const sorted = [...data].sort(
		(a, b) =>
			(b.statistics?.total_played ?? 0) -
			(a.statistics?.total_played ?? 0),
	);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(entry.statistics?.total_played ?? 0)} plays`,
		};
	});
}
async function get_most_liked_maps() {
	const data = (await all_verified_data_request()) ?? [];
	const sorted = [...data]
		.sort(
			(a, b) =>
				(b.statistics?.liked ?? 0) *
					(b.statistics?.difficulty ?? 0) *
					(b.statistics?.total_played ?? 0) -
				(a.statistics?.liked ?? 0) *
					(a.statistics?.difficulty ?? 0) *
					(a.statistics?.total_played ?? 0),
		)
		.filter(
			(map) =>
				(map.statistics?.total_played ?? 0) > 2000 &&
				(map.statistics?.total_played ?? 0) *
					(map.statistics?.difficulty ?? 0) >
					10,
		);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				Math.round(
					(entry.statistics?.liked ?? 0) *
						(entry.statistics?.total_played ?? 0) *
						(entry.statistics?.difficulty ?? 0),
				),
			)} (${Math.round(100 * (entry.statistics?.liked ?? 0))}%)`,
		};
	});
}
async function get_most_disliked_maps() {
	const data = (await all_verified_data_request()) ?? [];
	const sorted = [...data]
		.sort(
			(a, b) =>
				(1 - (b.statistics?.liked ?? 0)) *
					(b.statistics?.difficulty ?? 0) *
					(b.statistics?.total_played ?? 0) -
				(1 - (a.statistics?.liked ?? 0)) *
					(a.statistics?.difficulty ?? 0) *
					(a.statistics?.total_played ?? 0),
		)
		.filter(
			(map) =>
				(map.statistics?.total_played ?? 0) > 2000 &&
				(map.statistics?.total_played ?? 0) *
					(map.statistics?.difficulty ?? 0) >
					10,
		);
	return sorted.map((entry) => {
		return {
			...entry,
			value: `${format_number(
				Math.round(
					(1 - (entry.statistics?.liked ?? 0)) *
						(entry.statistics?.total_played ?? 0) *
						(entry.statistics?.difficulty ?? 0),
				),
			)} (${Math.round(100 - 100 * (entry.statistics?.liked ?? 0))}%)`,
		};
	});
}
async function get_longest_time_maps() {
	const data = (await all_verified_data_request()) ?? [];
	const sorted = [...data]
		.sort((a, b) => (b.statistics?.time ?? 0) - (a.statistics?.time ?? 0))
		// ignore 'the fall out...' 1 week bugged time
		.filter((m) => m.identifier !== '2c2jxd1bl88kk3c9d407z:1717100734');

	return sorted.map((entry) => {
		return {
			...entry,
			value: `${Math.round(entry.statistics?.time ?? 0)}s`,
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

function format_number(x: number) {
	const parts = x.toString().split('.');
	parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}
// function number_suffix(number: number) {
// 	const num = Math.abs(number) | 0;
// 	const mod100 = num % 100;
// 	if (mod100 >= 11 && mod100 <= 13) return 'th';
// 	return { 1: 'st', 2: 'nd', 3: 'rd' }[num % 10] || 'th';
// }
function timestamp_days(timestamp: number) {
	const day = 1000 * 60 * 60 * 24;
	return Math.round(
		(new Date().getTime() - new Date(timestamp).getTime()) / day,
	);
}

export default {
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
