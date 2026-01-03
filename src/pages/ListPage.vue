<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

import GHLLogoIcon from '@/icons/GHLLogoIcon.vue';
import MapIcon from '@/icons/MapIcon.vue';
import PeopleIcon from '@/icons/PeopleIcon.vue';
import ListRow from '@/components/ListRow.vue';

export default {
	components: {
		GHLLogoIcon,
		MapIcon,
		PeopleIcon,
		ListRow,
	},
	data() {
		return {
			hardest_levels: [],
			featured_creators: [],
			all_metrics: {},
			top_metrics: [],
			weights: {
				level_records: 1, // 0.5, //     values time over skill
				level_finishes: 1, // 0.7, //    easy to get
				challenge_finishes: 1, // 1, //  good
				challenge_records: 1, // 2, //   most important
				featured_records: 1, // 0.9, //  less than challenge finishes
				sole_finishes: 1, // 1.5, //     very important
				challenge_created: 1, // 0.5, // largely dupes
				unbeaten_created: 1, // 1.5, //  very important
				hardest_created: 1, // 1, //     good
			},
		};
	},
	methods: {
		selectTab(id) {
			document
				.querySelector('.sort-active')
				.classList.remove('sort-active');
			const maps = document.getElementById('maps');
			const players = document.getElementById('players');
			const selected = document.getElementById(id + '-sort-btn');
			const list = document.getElementById(id);
			maps.style.display = 'none';
			players.style.display = 'none';
			list.style.display = 'flex';
			selected.classList.add('sort-active');
		},
		async fetchThen(filename, func) {
			let response = await fetch(
				`${this.$config.STATS_SERVER_URL}${filename}.json`,
			);
			if (!response.ok) {
				const error = await response.text();
				window.toast('Failed to load stat: ' + error, 'error');
				return;
			}
			const json = await response.json();
			func(json);
		},
		init() {
			(async () => {
				let featured_creators = [];
				let metrics = {};

				const checkMetric = (id, username) => {
					for (let featured_creator of featured_creators) {
						if (featured_creator.list_key.split(':')[1] == id) {
							username = featured_creator.title;
						}
					}
					if (!(id in metrics)) {
						metrics[id] = {
							score: 0,
							maps: 0,
							positions: {},
							username: username.split(' ')[0],
							// metrics
							level_records: 0,
							level_finishes: 0,
							challenge_finishes: 0,
							challenge_records: 0,
							featured_records: 0,
							sole_finishes: 0,
							challenge_created: 0,
							unbeaten_created: 0,
							hardest_created: 0,
						};
					}
				};

				await this.fetchThen('featured_creators', (data) => {
					featured_creators = data;
				});
				await Promise.all([
					this.fetchThen('hardest_levels_list', (data) => {
						this.hardest_levels = data;

						for (let level of data) {
							const identifier = level.id.split(':')[0];
							const username = level.creator ?? 'Unknown';

							checkMetric(identifier, username);

							metrics[identifier].hardest_created += 1;
						}
					}),
					this.fetchThen('user_finishes', (data) => {
						for (let identifier in data) {
							const username = data[identifier][1];

							checkMetric(identifier, username);

							metrics[identifier].level_finishes +=
								data[identifier][0];
						}
					}),
					this.fetchThen('sorted_leaderboard_records', (data) => {
						for (let key in data) {
							const identifier = key.split(':')[0];
							const username = data[key][2];

							checkMetric(identifier, username);

							metrics[identifier].level_records += data[key][0];
						}
					}),
					this.fetchThen('sole_victors', (data) => {
						for (let level of data) {
							if (level?.leaderboard?.length == 1) {
								const item = level.leaderboard[0];

								const identifier = item.user_id;
								const username = item.user_name;

								checkMetric(identifier, username);

								metrics[identifier].sole_finishes += 1;
							}
						}
					}),
					this.fetchThen('unbeaten_levels', (data) => {
						for (let level of data) {
							if (!('sole' in level)) {
								const id = level.identifier.split(':')[0];
								const username = level?.creators?.length
									? level.creators[0]
									: 'Unknown';

								checkMetric(id, username);

								metrics[id].unbeaten_created += 1;
							}
						}
					}),
					this.fetchThen('best_of_grab', (data) => {
						for (let level of data) {
							const leaderboard = level.leaderboard;
							const id = level.identifier.split(':')[0];
							const username = level?.creators?.length
								? level.creators[0]
								: 'Unknown';

							if (leaderboard.length > 0) {
								const item = leaderboard[0];
								checkMetric(item.user_id, item.user_name);

								if (
									level.list_key.includes('curated_challenge')
								) {
									metrics[
										item.user_id
									].challenge_records += 1;
								}
								metrics[item.user_id].featured_records += 1;
							}

							checkMetric(id, username);

							if (level.list_key.includes('curated_challenge')) {
								metrics[id].challenge_created += 1;

								for (let i = 0; i < leaderboard.length; i++) {
									const item = leaderboard[i];

									checkMetric(item.user_id, item.user_name);

									metrics[
										item.user_id
									].challenge_finishes += 1;
								}
							}
						}
					}),
				]);

				// adjust metrics
				const adjustments = {
					level_records: 1,
					level_finishes: 1,
					challenge_finishes: 1,
					challenge_records: 1,
					featured_records: 1,
					sole_finishes: 1,
					challenge_created: 1,
					unbeaten_created: 1,
					hardest_created: 1,
				};

				for (const key in adjustments) {
					// maximum of each metric
					adjustments[key] = Math.max(
						...Object.values(metrics).map(
							(values) => values[key] || 0,
						),
					);
					// adjust values
					Object.values(metrics).forEach(
						(values) =>
							(values[key] =
								(values[key] / adjustments[key]) *
								this.weights[key]),
					);
					// sort by metric and add positions
					// -1 for positions for values of 0
					Object.entries(metrics)
						.sort((a, b) => b[1][key] - a[1][key])
						.forEach(
							([id], i) =>
								(metrics[id].positions[key] =
									metrics[id][key] == 0 ? -1 : i),
						);
				}

				// accumulate scores
				Object.values(metrics).forEach((values) =>
					Object.keys(adjustments).forEach(
						(key) => (values.score += values[key]),
					),
				);

				// sort by score
				const sorted = Object.entries(metrics).sort((a, b) => {
					return b[1].score - a[1].score;
				});
				// top 100
				let top_metrics = sorted.slice(0, 100);

				this.top_metrics = top_metrics.map((metric) => ({
					user_id: metric[0],
					user_name: metric[1].username,
					positions: metric[1].positions,
					metrics: metric[1],
					score: metric[1].score,
					raw: Object.fromEntries(
						Object.entries(metric[1]).map(([key, value]) => [
							key,
							Math.round(
								(value / this.weights[key]) *
									adjustments[key] *
									100,
							) / 100,
						]),
					),
				}));
				this.all_metrics = metrics;
				this.featured_creators = featured_creators;
			})();
		},
		level_url(level_id) {
			return this.$config.GRAB_VIEWER_URL + level_id;
		},
		on_expand() {
			this.$refs.row.forEach((row) => {
				row.expanded = false;
			});
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
	},
	created() {
		document.title = 'GRAB Hardest Levels | GRAB Tools';
	},
	mounted() {
		this.init();
	},
};
</script>

<template>
	<main class="list-main">
		<section id="info">
			<GHLLogoIcon class="ghl-icon" />
			<h2>GRAB Hardest Levels List</h2>
		</section>
		<section id="sorters">
			<div class="list-sorting">
				<button
					class="sort-btn button-sml sort-active"
					id="maps-sort-btn"
					@click="selectTab('maps')"
				>
					Maps
					<MapIcon />
				</button>
				<button
					class="sort-btn button-sml"
					id="players-sort-btn"
					@click="selectTab('players')"
				>
					Players
					<PeopleIcon />
				</button>
			</div>
		</section>
		<section id="list-section">
			<div class="ghl-list-data" id="data">
				<div class="LeaderboardOutput" id="maps">
					<div
						v-for="(level, i) in hardest_levels"
						:key="level.identifier"
						class="leaderboard-item list-item"
					>
						<p>{{ i + 1 }}</p>
						<a :href="level_url(level.id)" target="_blank">
							{{ level.title }}
						</a>
						<p>{{ level.creator }}</p>
					</div>
				</div>
				<div
					style="display: none"
					class="LeaderboardOutput"
					id="players"
				>
					<ListRow
						v-for="(
							{
								user_id,
								user_name,
								positions,
								metrics,
								score,
								raw,
							},
							i
						) in top_metrics"
						:key="i"
						:position="i + 1"
						:user_id="user_id"
						:user_name="user_name"
						:positions="positions"
						:metrics="metrics"
						:score="score"
						:raw="raw"
						:weights="weights"
						@expand="on_expand"
						ref="row"
					/>
				</div>
			</div>
		</section>
		<section id="list-credit">
			<span>Organised by .index & Luhmao.</span>
			<span>
				Maintained by .index, Thezra, FitArtist, Caziggy, Mrs.Madlord,
				and luhmao.
			</span>
			<span>
				Assisted by Polaris, BurningAlpaca, Poggggg, littlebeastM8,
				EBspark, BWLBuck, iamaverage8, 13OliviA, and TronisRobot.
			</span>
		</section>
	</main>
</template>

<style>
.list-main {
	.ghl-icon svg,
	.ghl-icon {
		width: 50px;
		height: 50px;
		color: #ffdf5b;
	}
	.sort-btn svg {
		width: 18px;
		height: 18pxghl-list-data;
	}
}
</style>
<style scoped>
.list-main {
	width: min(800px, 90%);
}
.ghl-list-data,
#maps,
#players {
	width: 100%;
}
#judges {
	margin-inline: auto;
}
#maps,
#players {
	display: flex;
}
#info {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: center;
}
#list-credit {
	display: flex;
	flex-direction: column;
	gap: 5px;
	align-items: center;
	font-size: 12px;
	color: var(--text-color-alt);
}
#sorters {
	padding-bottom: 0;

	.list-sorting {
		display: flex;
		flex-direction: row;
		gap: 5px;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		max-width: 90%;
		margin-inline: auto;

		& > .button-sml {
			gap: 5px;

			&.sort-active {
				background-color: #1b5eb135;
				border: solid 2px #2063b570;
			}
		}
	}
}

:global(.ghl-list-data .leaderboard-item) {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
:global(.ghl-list-data .list-item) {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
}
:global(.ghl-list-data .list-item p:first-child) {
	font-size: 18px;
	font-weight: 600;
	color: #2976d4;
	margin-bottom: 0;
}
:global(.ghl-list-data .list-item p:nth-child(2)),
:global(.ghl-list-data .list-item a:nth-child(2)) {
	font-size: 14px;
	font-weight: 400;
	margin-top: 0;
	margin-right: auto;
	color: var(--text-color-default);
}
</style>
