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
		document.title = 'Tools | GRAB Tools';
	},
};
</script>

<template>
	<div id="tools">tools</div>
</template>

<style scoped>
#tools {
}
</style>
