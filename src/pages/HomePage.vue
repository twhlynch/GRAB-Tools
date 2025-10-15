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
		document.title = 'GRAB Tools';
	},
};
</script>

<template>
	<div id="home">home</div>
</template>

<style scoped>
#home {
}
</style>
