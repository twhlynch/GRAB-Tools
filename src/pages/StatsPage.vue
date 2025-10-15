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
		...mapState(useUserStore, [
			'isModerator',
			'accessToken',
			'isLoggedIn', //
		]),
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
