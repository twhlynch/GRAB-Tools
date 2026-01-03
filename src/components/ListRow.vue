<script>
export default {
	props: {
		position: Number,
		user_id: String,
		user_name: String,
		positions: Object,
		metrics: Object,
		score: Number,
		raw: Object,
		weights: Object,
	},
	data() {
		return {
			expanded: false,
			labels: {
				level_records: 'Records',
				level_finishes: 'Finishes',
				challenge_finishes: 'Challenge Finishes',
				challenge_records: 'Challenge Records',
				featured_records: 'BOG Records',
				sole_finishes: 'Sole Finishes',
				challenge_created: 'Challenge Maps',
				unbeaten_created: 'Unbeaten Maps',
				hardest_created: 'Hardest Maps',
			},
		};
	},
	emits: ['expand'],
	methods: {
		getSuffix(number) {
			const suffixes = ['th', 'st', 'nd', 'rd'];
			if (number >= 11 && number <= 19) return 'th';
			const lastDigit = Math.abs(number) % 10;
			return suffixes[lastDigit < 4 ? lastDigit : 0];
		},
		user_url(user_id) {
			return this.$config.GRAB_USER_URL + user_id;
		},
		metric_bar_class(position) {
			const classes = [];
			classes.push('metric-bar-fill');
			if (position === 0) classes.push('metric-bar-first');
			return classes.join(' ');
		},
		format_score(score) {
			return String(Math.round(score * 100) / 100)
				.padEnd(2, '.')
				.padEnd(4, '0');
		},
		format_position(position) {
			return position == -1
				? 'N/a'
				: `${position + 1}${this.getSuffix(position + 1)}`;
		},
		expand() {
			this.$emit('expand');
			this.expanded = true;
		},
	},
};
</script>
<template>
	<div class="leaderboard-item list-item" @click="expand">
		<p>{{ position }}</p>
		<a :href="user_url(user_id)" target="_blank">
			{{ user_name }}
		</a>
		<div class="list-chart">
			<div
				v-for="(position, key) in positions"
				:key="key"
				class="metric-bar"
			>
				<div
					:class="metric_bar_class(position)"
					:style="`height: ${(100 * metrics[key]) / weights[key]}%`"
				></div>
				<span class="metric-bar-label">
					{{ labels[key] }}
					<br />
					{{ format_position(position) }}
				</span>
			</div>
		</div>
		<p>{{ format_score(score) }}</p>
		<div v-if="expanded" class="list-item-expanded-content">
			<div class="list-chart">
				<template v-for="(position, key) in positions" :key="key">
					<span class="metric-bar-label">
						{{ labels[key] }}:
						{{ format_position(position) }}
						{{ `[+${format_score(metrics[key])}]` }}
						{{ `(${raw[key]})` }}
					</span>
					<div class="metric-bar">
						<div
							:class="metric_bar_class(position)"
							:style="`width: ${
								(100 * metrics[key]) / weights[key]
							}%`"
						></div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>
<style scoped>
.list-item:has(.list-item-expanded-content) {
	flex-wrap: wrap;
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
.list-item-expanded-content {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
	padding: 5px;
	flex-basis: 100%;
}
</style>
