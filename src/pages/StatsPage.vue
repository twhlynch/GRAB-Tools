<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

export default {
	components: {},

	data() {
		return {
			test: undefined,
		};
	},

	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_info.user_id']),
	},

	methods: {},
	created() {
		document.title = 'Stats | GRAB Tools';
	},
};
</script>

<template>
	<div id="stats">stats</div>
</template>

<style scoped>
#stats {
}
</style>
