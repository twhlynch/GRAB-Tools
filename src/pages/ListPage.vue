<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

import GHLLogoIcon from '@/icons/GHLLogoIcon.vue';
import MapIcon from '@/icons/MapIcon.vue';
import PeopleIcon from '@/icons/PeopleIcon.vue';

export default {
	components: {
		GHLLogoIcon,
		MapIcon,
		PeopleIcon,
	},
	data() {
		return {
			hardest_levels: [],
			featured_creators: [],
			metrics: {},
			top_metrics: [],
			labels: {
				records: 'Records',
				finishes: 'Finishes',
				challengeFinishes: 'Challenge Finishes',
				challengeFirsts: 'Challenge Records',
				featuredRecords: 'BOG Records',
				soleVictories: 'Sole Finishes',
				challengeMaps: 'Challenge Maps',
				unbeatenMaps: 'Unbeaten Maps',
				hardestMaps: 'Hardest Maps',
				unbeatenMapPlays: 'Unbeaten Maps Plays',
			},
			adjustmentMetrics: {
				records: 1,
				finishes: 1,
				challengeFinishes: 1,
				challengeFirsts: 1,
				featuredRecords: 1,
				soleVictories: 1,
				challengeMaps: 1,
				unbeatenMaps: 1,
				hardestMaps: 1,
				unbeatenMapPlays: 1,
			},
		};
	},
	methods: {
		getSuffix(number) {
			const suffixes = ['th', 'st', 'nd', 'rd'];
			const lastDigit = Math.abs(number) % 10;
			return suffixes[lastDigit < 4 ? lastDigit : 0];
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
		expand(element) {
			document.querySelectorAll('.list-item-expanded').forEach((e) => {
				e.classList.remove('list-item-expanded');
			});
			element.classList.add('list-item-expanded');
		},
		init() {
			return (async () => {
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
							records: 0,
							finishes: 0,
							challengeFinishes: 0,
							challengeFirsts: 0,
							challengeMaps: 0,
							soleVictories: 0,
							featuredRecords: 0,
							unbeatenMapPlays: 0,
							unbeatenMaps: 0,
							hardestMaps: 0,
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
							const username = level.creator || 'Unknown';

							checkMetric(identifier, username);

							metrics[identifier].hardestMaps += 1;
						}
					}),
					this.fetchThen('user_finishes', (data) => {
						for (let identifier in data) {
							const username = data[identifier][1];

							checkMetric(identifier, username);

							metrics[identifier].finishes += data[identifier][0];
						}
					}),
					this.fetchThen('sorted_leaderboard_records', (data) => {
						for (let key in data) {
							const identifier = key.split(':')[0];
							const username = data[key][2];

							checkMetric(identifier, username);

							metrics[identifier].records += data[key][0];
						}
					}),
					this.fetchThen('sole_victors', (data) => {
						for (let level of data) {
							if (level?.leaderboard?.length == 1) {
								const item = level.leaderboard[0];

								const identifier = item.user_id;
								const username = item.user_name;

								checkMetric(identifier, username);

								metrics[identifier].soleVictories += 1;
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

								metrics[id].unbeatenMaps += 1;
								metrics[id].unbeatenMapPlays +=
									level?.statistics?.total_played || 0;
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
									metrics[item.user_id].challengeFirsts += 1;
								}
								metrics[item.user_id].featuredRecords += 1;
							}

							checkMetric(id, username);

							if (level.list_key.includes('curated_challenge')) {
								metrics[id].challengeMaps += 1;

								let creatorFinished = false;
								for (let i = 0; i < leaderboard.length; i++) {
									const item = leaderboard[i];
									if (item.user_id === id) {
										creatorFinished = true;
									}

									checkMetric(item.user_id, item.user_name);
									metrics[
										item.user_id
									].challengeFinishes += 1;
								}
								if (!creatorFinished) {
									metrics[id].challengeFinishes += 1;
								}
							}
						}
					}),
				]);

				// adjust metrics
				const adjustmentMetrics = {
					records: 1,
					finishes: 1,
					challengeFinishes: 1,
					challengeFirsts: 1,
					featuredRecords: 1,
					soleVictories: 1,
					challengeMaps: 1,
					unbeatenMaps: 1,
					hardestMaps: 1,
					unbeatenMapPlays: 1,
				};

				for (const key in adjustmentMetrics) {
					// maximum of each metric
					adjustmentMetrics[key] = Math.max(
						...Object.values(metrics).map(
							(values) => values[key] || 0,
						),
					);
					// adjust values
					Object.values(metrics).forEach(
						(values) => (values[key] /= adjustmentMetrics[key]),
					);
					// sort by metric and add positions
					Object.entries(metrics)
						.sort((a, b) => b[1][key] - a[1][key])
						.forEach(([id], i) => (metrics[id].positions[key] = i));
				}

				// accumulate scores
				Object.values(metrics).forEach((values) =>
					Object.keys(adjustmentMetrics).forEach(
						(key) => (values.score += values[key]),
					),
				);

				// sort by score
				const sorted = Object.entries(metrics).sort((a, b) => {
					return b[1].score - a[1].score;
				});
				// top 100
				let top_metrics = sorted.slice(0, 100);

				this.adjustmentMetrics = adjustmentMetrics;
				this.top_metrics = top_metrics;
				this.metrics = metrics;
				this.featured_creators = featured_creators;
			})();
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_info.user_id']),
	},

	created() {
		document.title = 'GRAB Hardest Levels | GRAB Tools';
	},
	async mounted() {
		await this.init();

		const maps = document.getElementById('maps');
		const players = document.getElementById('players');

		document.getElementById('sorters').addEventListener('click', (e) => {
			const id = e.target.id;
			if (id.includes('sort-btn')) {
				document
					.querySelector('.sort-active')
					.classList.remove('sort-active');
				maps.style.display = 'none';
				players.style.display = 'none';
				const list = document.getElementById(id.split('-')[0]);
				list.style.display = 'flex';
				e.target.classList.add('sort-active');
			}
		});
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
				>
					Maps
					<MapIcon />
				</button>
				<button class="sort-btn button-sml" id="players-sort-btn">
					Players
					<PeopleIcon />
				</button>
			</div>
		</section>
		<section id="list-section">
			<div class="listData" id="data">
				<div class="LeaderboardOutput" id="maps">
					<div
						v-for="(level, i) in this.hardest_levels"
						:key="level.identifier"
						class="leaderboard-item list-item"
					>
						<p>{{ i + 1 }}</p>
						<a
							:href="`https://grabvr.quest/levels/viewer?level=${level.id}`"
							target="_blank"
							>{{ level.title }}</a
						>
						<p>{{ level.creator }}</p>
					</div>
				</div>
				<div
					style="display: none"
					class="LeaderboardOutput"
					id="players"
				>
					<div
						v-for="(item, i) in this.top_metrics"
						:key="item[0]"
						class="leaderboard-item list-item"
						@click="expand($event.currentTarget)"
					>
						<p>{{ i + 1 }}</p>
						<a
							:href="`https://grabvr.quest/levels?tab=tab_other_user&user_id=${item[0]}`"
							target="_blank"
							>{{ item[1].username }}</a
						>
						<div class="list-chart">
							<div
								v-for="(pos, key) in this.metrics[item[0]]
									.positions"
								:key="key + '-'"
								class="metric-bar"
							>
								<div
									:class="`metric-bar-fill${
										this.metrics[item[0]].positions[key] ==
										0
											? ' metric-bar-first'
											: ''
									}`"
									:style="`height: ${
										100 * this.metrics[item[0]][key]
									}%`"
								></div>
								<span class="metric-bar-label">
									{{ this.labels[key] }}<br />{{
										this.metrics[item[0]][key] == 0
											? 'N/a'
											: this.metrics[item[0]].positions[
													key
											  ] + 1
									}}{{
										this.metrics[item[0]][key] == 0
											? ''
											: this.getSuffix(
													this.metrics[item[0]]
														.positions[key] + 1,
											  )
									}}
								</span>
							</div>
						</div>
						<p>
							{{
								(Math.round(item[1].score * 100) / 100)
									.toString()
									.padEnd(2, '.')
									.padEnd(4, '0')
							}}
							<span class="metric-data">{{
								JSON.stringify(metrics[item[0]], null, 2)
							}}</span>
						</p>
						<div class="list-item-expanded-content">
							<div class="list-chart">
								<template
									v-for="(pos, key) in this.metrics[item[0]]
										.positions"
									:key="key + item[0]"
								>
									<span class="metric-bar-label">
										{{ this.labels[key] }}:
										{{
											this.metrics[item[0]][key] == 0
												? 'N/a'
												: this.metrics[item[0]]
														.positions[key] + 1
										}}{{
											this.metrics[item[0]][key] == 0
												? ''
												: this.getSuffix(
														this.metrics[item[0]]
															.positions[key] + 1,
												  )
										}}
										[{{
											'+' +
											(
												Math.round(
													this.metrics[item[0]][key] *
														100,
												) / 100
											)
												.toString()
												.padEnd(2, '.')
												.padEnd(4, '0')
										}}]
										{{
											this.metrics[item[0]][key] == 0
												? ''
												: '(' +
												  (
														Math.round(
															this.metrics[
																item[0]
															][key] *
																this
																	.adjustmentMetrics[
																	key
																] *
																100,
														) / 100
												  ).toString() +
												  ')'
										}}
									</span>
									<div class="metric-bar">
										<div
											:class="`metric-bar-fill${
												this.metrics[item[0]].positions[
													key
												] == 0
													? ' metric-bar-first'
													: ''
											}`"
											:style="`width: ${
												100 * this.metrics[item[0]][key]
											}%`"
										></div>
									</div>
								</template>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section id="list-credit">
			<span>Organised by .index & Luhmao.</span>
			<span
				>Maintained by .index, Thezra, FitArtist, Caziggy, Mrs. Madlord,
				and luhmao.</span
			>
			<span
				>Assisted by Polaris, BurningAlpaca, Poggggg, littlebeastM8,
				EBspark, BWLBuck, iamaverage8, 13OliviA, and TronisRobot.</span
			>
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
		height: 18px;
	}
}
</style>
<style scoped>
.list-main {
	width: min(800px, 90%);
}
.listData,
.listData #maps,
#players {
	width: 100%;
}
.listData .leaderboard-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
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
.list-item {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
}
.list-item p:nth-last-child(2) {
	min-width: 40px;
	text-align: end;
}
.list-item p:first-child {
	font-size: 18px;
	font-weight: 600;
	color: #2976d4;
	margin-bottom: 0;
}
.list-item p:nth-child(2),
.list-item a:nth-child(2) {
	font-size: 14px;
	font-weight: 400;
	margin-top: 0;
	margin-right: auto;
	color: var(--text-color-default);
}
#list-credit {
	display: flex;
	flex-direction: column;
	gap: 5px;
	align-items: center;
	font-size: 12px;
	color: var(--text-color-alt);
}
.metric-data {
	display: none;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 100;
	background-color: var(--background-color-alt);
	padding: var(--padding-secondary);
	border-radius: var(--border-radius);
	white-space: pre;
	font-size: 0.5rem;
}
.list-sorting {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	max-width: 90%;
	margin-inline: auto;
}
.list-sorting > .button-sml {
	gap: 5px;
}
.sort-active {
	background-color: #1b5eb135;
	border: solid 2px #2063b570;
}
#sorters {
	padding-bottom: 0;
}

.list-chart {
	width: fit-content;
	position: relative;
	display: flex;
	flex-direction: row;
	gap: 6px;
	height: 20px;
}
.list-item-expanded-content .list-chart {
	height: fit-content;
	width: 100%;
	display: grid;
	grid-template-columns: 1fr 2fr 1fr 2fr;
	gap: 6px;
	align-items: center;
}
@media screen and (max-width: 730px) {
	.list-item-expanded-content .list-chart {
		grid-template-columns: 1fr 2fr;
	}
}
.metric-bar {
	height: 100%;
	width: 5px;
	background-color: #d65151a0;
	border-radius: 5px;
	/* overflow: hidden; */
	display: flex;
	align-items: flex-end;
}
.list-item-expanded-content .metric-bar {
	position: relative;
	width: 100%;
	min-height: 5px;
	height: 8px;
	border-radius: 5px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
}
.metric-bar-fill {
	border-radius: 5px;
	width: 100%;
	background-color: #51d677a0;
}
.list-item-expanded-content .metric-bar-fill {
	height: 100%;
}
.metric-bar-label {
	display: none;
	position: absolute;
	height: 100%;
	right: 100%;
	transform: translateX(-10px);
	white-space: nowrap;

	align-items: center;
	justify-content: center;
	text-align: center;
	font-size: 10px;
	padding: 5px;
	border-radius: 10px;
	color: var(--text-color-default) !important;
}
.list-item-expanded-content .metric-bar-label {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-end;
	position: static;
	text-align: right;
	width: 100%;
	transform: none;
	font-size: 10px !important;
}
.metric-bar:hover .metric-bar-label {
	display: flex;
}
.metric-bar-first {
	box-shadow: 0 0 4px #ff07;
}
.list-item-expanded {
	flex-wrap: wrap;
}
.list-item-expanded-content {
	display: none;

	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
	padding: 5px;
	flex-basis: 100%;
}
.list-item-expanded .list-item-expanded-content {
	display: flex;
}
</style>
