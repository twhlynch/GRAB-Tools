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
		document.title = 'Something went wrong';
	},
};
</script>

<template>
	<div id="error">error</div>
</template>

<style scoped>
#error {
}
</style>
