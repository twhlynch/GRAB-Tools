<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

export default {
	props: {
		list: Array,
	},
	methods: {
		level_url(level_id) {
			return this.$config.GRAB_VIEWER_URL + level_id;
		},
		user_class(id) {
			return (
				this.is_logged_in &&
				this.grab_id === id.split(':')[0] &&
				'personal'
			);
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'grab_id']),
	},
};
</script>

<template>
	<div>
		<div
			v-for="({ title, creator, id }, i) in list"
			:key="i"
			:class="['leaderboard-item', 'list-item', user_class(id)]"
		>
			<p>{{ i + 1 }}</p>
			<a :href="level_url(id)" target="_blank">{{ title }}</a>
			<p>{{ creator }}</p>
		</div>
	</div>
</template>

<style scoped></style>
