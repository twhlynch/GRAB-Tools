<script>
import GHLLogoIcon from '@/icons/GHLLogoIcon.vue';
import MapIcon from '@/icons/MapIcon.vue';
import PeopleIcon from '@/icons/PeopleIcon.vue';
import ListRow from '@/components/ListRow.vue';
import HardestLevelsList from '@/components/HardestLevelsList.vue';
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import { add_hardest_level_request } from '@/requests/AddHardestLevelRequest';
import { get_hardest_levels_request } from '@/requests/GetHardestLevelsRequest';

export default {
	components: {
		GHLLogoIcon,
		MapIcon,
		PeopleIcon,
		ListRow,
		HardestLevelsList,
	},
	data() {
		return {
			tab: 'maps',
			hardest_levels: [],
			featured_creators: [],
			all_metrics: {},
			top_metrics: [],
			query: '',
			add_level_id: '',
			add_level_position: '',
			// prettier-ignore
			weights: {
				level_records:      0.7, // 0.70 1.20 0.50 0.80 0.60
				level_finishes:     0.5, // 0.50 0.40 0.30 0.40 0.40
				challenge_finishes: 1.2, // 1.00 0.90 1.00 0.97 1.00
				challenge_records:  2.0, // 2.00 2.50 2.00 2.17 2.00
				featured_records:   0.9, // 0.90 1.60 1.00 1.17 0.95
				sole_finishes:      1.5, // 1.50 2.00 1.25 1.58 1.37
				challenge_created:  0.5, // 0.50 0.40 0.75 0.55 0.62
				unbeaten_created:   1.5, // 1.50 2.20 1.50 1.73 1.50
				hardest_created:    2.0, // 1.00 1.00 2.50 1.50 1.75
				hardest_created_placement: 1.0,
			},
		};
	},
	computed: {
		...mapState(useUserStore, [
			'is_logged_in',
			'grab_id',
			'is_list_moderator',
		]),
	},
	methods: {
		selectTab(id) {
			document
				.querySelector('.sort-active')
				.classList.remove('sort-active');
			const selected = document.getElementById(id + '-sort-btn');
			selected.classList.add('sort-active');
			this.tab = id;
		},
		async fetchThen(filename, func) {
			let response = await fetch(
				`${this.$config.STATS_URL}${filename}.json`,
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
							raw: {
								hardest_created_placement: 0,
							},
							username: (username ?? 'Unknown').split(' ')[0],
							// metrics
							...Object.fromEntries(
								Object.keys(this.weights).map((k) => [k, 0]),
							),
							hardest_created_placement: 0,
						};
					}
				};

				await this.fetchThen('featured_creators', (data) => {
					featured_creators = data;
				});

				await Promise.all([
					get_hardest_levels_request().then((data) => {
						this.hardest_levels = data.sort(
							(a, b) => a.position - b.position,
						);

						for (let i = 0; i < Math.min(100, data.length); i++) {
							const { level_id, creators } = data[i];

							const identifier = level_id.split(':')[0];

							checkMetric(identifier, creators);

							metrics[identifier].hardest_created += 1;
							if (
								metrics[identifier]
									.hardest_created_placement === 0
							) {
								metrics[identifier].hardest_created_placement =
									1 - (i + 1 - 1) * 0.01;
								metrics[
									identifier
								].raw.hardest_created_placement = i + 1;
							}
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
								const username = level?.creators?.[0];

								checkMetric(id, username);

								metrics[id].unbeaten_created += 1;
							}
						}
					}),
					this.fetchThen('best_of_grab', (data) => {
						for (let level of data) {
							const leaderboard = level.leaderboard;
							const id = level.identifier.split(':')[0];
							const username = level?.creators?.[0];
							const is_challenge =
								level.list_key.includes('curated_challenge');

							if (leaderboard.length > 0) {
								const item = leaderboard[0];
								checkMetric(item.user_id, item.user_name);

								if (is_challenge) {
									metrics[
										item.user_id
									].challenge_records += 1;
								}
								metrics[item.user_id].featured_records += 1;
							}

							checkMetric(id, username);

							if (is_challenge) {
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
				const adjustments = {};

				for (const key in this.weights) {
					if (key !== 'hardest_created_placement') {
						// save raw value
						Object.values(metrics).forEach((values) => {
							values.raw[key] = values[key];
						});
						// mon / max
						adjustments[key] = {
							max: Math.max(
								...Object.values(metrics).map(
									(values) => values[key] || 0,
								),
							),
							min: Math.min(
								...Object.values(metrics).map(
									(values) => values[key] || 0,
								),
							),
						};
						// adjust values
						Object.values(metrics).forEach((values) => {
							const { max, min } = adjustments[key];
							const value = values[key];
							const alpha = 0.7;
							const weight = this.weights[key];
							const t = (value - min) / (max - min);

							const inverse_power =
								(1 - Math.pow(1 - t, 0.6)) * weight;
							const step = t * t * (3 - 2 * t) * weight;
							const power = Math.pow(t, 0.6) * weight;
							const stepp =
								t * t * t * (t * (t * 6 - 15) + 10) * weight;

							values[key] = power;

							// values[key] = Math.pow(t, alpha) * weight;
							// values[key] = t * weight;
							// values[key] = Math.pow(t, alpha) * weight;
							// values[key] = Math.sqrt(t) * weight;
							// values[key] = t * t * (3 - 2 * t) * weight;
							// values[key] = t * t * t * (t * (t * 6 - 15) + 10) * weight;
							// values[key] = (Math.log1p(t) / Math.log(2)) * weight;
							// values[key] = (1 - Math.exp(-alpha * t)) * weight;
							// values[key] = (1 - Math.pow(1 - t, alpha)) * weight;
							// values[key] = (t * 0.4 + Math.pow(t, alpha) * 0.6) * weight;
							// values[key] = (0.2 + 0.8 * Math.pow(t, alpha)) * weight;
						});
					}
					// sort by metric and add positions
					// -1 for positions for values of 0
					Object.entries(metrics)
						.sort((a, b) => b[1][key] - a[1][key])
						.forEach(([id], i) => {
							metrics[id].positions[key] =
								metrics[id][key] == 0 ? -1 : i;
						});
				}

				// accumulate scores
				Object.values(metrics).forEach((values) => {
					Object.keys(adjustments).forEach((key) => {
						values.score += values[key];
					});
					if (values.hardest_created_placement !== 0) {
						values.score += values.hardest_created_placement;
					}
				});

				// sort by score
				const sorted = Object.entries(metrics).sort((a, b) => {
					return b[1].score - a[1].score;
				});
				this.all_metrics = sorted.map((metric, i) => ({
					user_id: metric[0],
					user_name: metric[1].username,
					positions: metric[1].positions,
					metrics: metric[1],
					score: metric[1].score,
					raw: metric[1].raw,
					position: i + 1,
				}));
				// top 100
				let top_metrics = this.all_metrics.slice(0, 100);
				if (
					this.is_logged_in &&
					!top_metrics.find((m) => m.user_id === this.grab_id)
				) {
					const own_metric = this.all_metrics.find(
						(m) => m.user_id === this.grab_id,
					);
					if (own_metric) top_metrics.push(own_metric);
				}
				this.top_metrics = top_metrics;
				this.featured_creators = featured_creators;
			})();
		},
		query_user() {
			if (!this.query?.length) return;

			if (
				!this.top_metrics.find(
					(m) =>
						m.user_id === this.query ||
						m.user_name.toLowerCase() === this.query.toLowerCase(),
				)
			) {
				const query_metric = this.all_metrics.find(
					(m) =>
						m.user_id === this.query ||
						m.user_name.toLowerCase() === this.query.toLowerCase(),
				);

				if (query_metric) this.top_metrics.push(query_metric);
				else window.toast('Failed to find user');
			}
			requestAnimationFrame(() => {
				this.$refs.players.scrollTo({
					top: this.$refs.players.scrollHeight,
					behavior: 'smooth',
				});
			});
			this.query = '';
		},
		async add_level() {
			if (!this.add_level_id?.length || !this.add_level_position) return;

			let level_id = this.add_level_id;
			let position = this.add_level_position;
			if (level_id.includes('https')) {
				level_id = level_id.split('level=')[1];
			}

			this.add_level_id = '';
			this.add_level_position = '';

			const success = await add_hardest_level_request(level_id, position);

			if (success) window.toast(`Added level`);

			await this.update_levels();
		},
		async update_levels() {
			const list = await get_hardest_levels_request();
			this.hardest_levels = list.sort((a, b) => a.position - b.position);
		},
		on_expand() {
			this.$refs.row.forEach((row) => {
				row.expanded = false;
			});
		},
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
					<MapIcon class="sort-icon" />
				</button>
				<button
					class="sort-btn button-sml"
					id="players-sort-btn"
					@click="selectTab('players')"
				>
					Players
					<PeopleIcon class="sort-icon" />
				</button>
			</div>
		</section>
		<section id="list-section">
			<div class="ghl-list-data" id="data">
				<div
					class="controls"
					v-show="tab === 'maps' && is_list_moderator"
				>
					<input
						type="text"
						placeholder="Level ID or URL"
						autocapitalize="false"
						autocorrect="false"
						v-model="add_level_id"
						@keyup.enter="add_level"
					/>
					<input
						type="number"
						placeholder="Position"
						v-model="add_level_position"
						@keyup.enter="add_level"
					/>
					<button @click="add_level">Add Level</button>
				</div>
				<HardestLevelsList
					class="LeaderboardOutput"
					v-show="tab === 'maps'"
					:list="hardest_levels"
					@update="update_levels"
				/>
				<div
					class="LeaderboardOutput"
					v-show="tab === 'players'"
					ref="players"
				>
					<ListRow
						v-for="{
							user_id,
							user_name,
							positions,
							metrics,
							score,
							raw,
							position,
						} in top_metrics"
						:key="user_id"
						:position="position"
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
				<div v-show="tab === 'players'" class="query-container">
					<input
						type="text"
						v-model="query"
						placeholder="User ID or username"
						autocapitalize="false"
						autocorrect="false"
						@keyup.enter="query_user"
					/>
					<button @click="query_user">Query User</button>
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

<style scoped>
.ghl-icon {
	width: 50px;
	height: 50px;
	color: #ffdf5b;
}
.sort-icon {
	width: 18px;
	height: 18px;
}
.list-main {
	width: min(800px, 90%);
}
.ghl-list-data,
.LeaderboardOutput {
	width: 100%;
}
#judges {
	margin-inline: auto;
}
.LeaderboardOutput {
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
.query-container,
.controls {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 5px;
	margin-inline: 10px;
	padding: 5px;
	background: #2e5d9740;
	border-radius: 5px;
	margin-block: 5px;

	input {
		padding: 5px 10px;
		background: #2e5d9740;
		border-radius: 5px;
		width: 80%;
		color: var(--text-color-default);
	}

	button {
		padding: 5px 10px;
		background: #2e5d9740;
		border-radius: 5px;
		width: 20%;
		min-width: fit-content;
		color: var(--text-color-default);
		cursor: pointer;
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
:global(.ghl-list-data a) {
	font-size: 14px;
	font-weight: 400;
	margin-top: 0;
	color: var(--text-color-default);
}
:global(.ghl-list-data .divider) {
	margin-right: auto;
}
:global(.ghl-list-data .personal) {
	box-shadow: inset 0 0 40px #306a40a0;
	border: 2px solid #1d843aa0;
}
</style>
