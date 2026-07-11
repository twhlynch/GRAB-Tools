import { STATS_URL } from '@/config';

const cache: Record<string, Promise<unknown>> = {};

async function stats_data_request<T>(key: string): Promise<T | null> {
	if (cache[key]) return cache[key] as T;

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

	const url = `${STATS_URL}${key}?cache=${cache_value}`;

	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			window.toast(`Error: Failed to load ${key} stats`, 'error');
			return null;
		}

		cache[key] = await response.json();
		return cache[key] as T;
	} catch {
		window.toast(`Error: Failed to load ${key} stats`, 'error');
		return null;
	}
}

export interface StatsPlacement {
	best_time: number;
	timestamp: string;
	user_id: string;
	user_name: string;
	is_verification?: boolean;
}

export interface StatsStatistics {
	total_played_count?: number;
	total_finished_count?: number;
	played_count?: number;
	finished_count?: number;
	rated_count?: number;
	liked_count?: number;
	tipped_amount?: number;
	tipped_count?: number;
	average_time?: number;
}

export interface StatsLevelStatistics {
	total_played?: number;
	difficulty?: number;
	liked?: number;
	time?: number;
	difficulty_string?: string;
}

export interface StatsLevel {
	identifier: string;
	iteration?: number;
	complexity?: number;
	title?: string;
	creators?: string[];
	curated_listings?: string[];
	update_timestamp?: number;
	creation_timestamp?: number;
	statistics?: StatsLevelStatistics;
	change?: number;
	image_iteration?: number;
	unbeaten?: boolean;
	list_key?: string;
}

export async function all_verified_data_request() {
	return await stats_data_request<StatsLevel[]>('all_verified');
}
export async function best_of_grab_data_request() {
	return await stats_data_request<StatsLevel[]>('best_of_grab');
}
export async function most_verified_data_request() {
	return await stats_data_request<
		Record<
			string,
			{ count: number; user_name: string; levels: number; change: number }
		>
	>('most_verified');
}
export async function most_plays_data_request() {
	return await stats_data_request<
		Record<
			string,
			{
				plays: number;
				count: number;
				user_name: string;
				levels: number;
				change: number;
			}
		>
	>('most_plays');
}
export async function level_counts_data_request() {
	return await stats_data_request<{ levels: number }>('level_counts');
}
export async function statistics_data_request() {
	return await stats_data_request<Record<string, StatsStatistics>>(
		'statistics',
	);
}
export async function user_finishes_data_request() {
	const result =
		await stats_data_request<Record<string, [number, string, number]>>(
			'user_finishes',
		);
	if (!result) return null;

	return Object.fromEntries(
		Object.entries(result).map(
			([user_id, [finish_count, user_name, total_time]]) => [
				user_id,
				{ finish_count, user_name, total_time },
			],
		),
	);
}
export async function sorted_leaderboard_records_data_request() {
	const result = await stats_data_request<
		Record<string, [number, string[], string]>
	>('sorted_leaderboard_records');
	if (!result) return null;

	return Object.fromEntries(
		Object.entries(result).map(
			([user_id, [record_count, identifier, user_name]]) => [
				user_id,
				{ record_count, identifier, user_name },
			],
		),
	);
}
export async function sole_victors_data_request() {
	return await stats_data_request<
		(StatsLevel & { leaderboard: StatsPlacement[] })[]
	>('sole_victors');
}
export async function difficulty_records_data_request() {
	return await stats_data_request<
		Record<string, Record<string, { levels: number; user_name: string }>>
	>('difficulty_records');
}
export async function difficulty_lengths_data_request() {
	return await stats_data_request<Record<string, { level_count: number }>>(
		'difficulty_lengths',
	);
}
export async function timestamps_data_data_request() {
	const result = await stats_data_request<string[]>('timestamps_data');
	if (!result) return null;

	return result.map((item) => {
		const parts = item.split(':') as [string, string, string];
		return {
			user_id: parts[0],
			latest: Number(parts[1]),
			oldest: Number(parts[2]),
		};
	});
}
export async function featured_creators_data_request() {
	return await stats_data_request<{ title: string; list_key: string }[]>(
		'featured_creators',
	);
}
