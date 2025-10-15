<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

export default {
	components: {},
	data() {
		return {};
	},
	computed: {
		...mapState(useUserStore, ['isLoggedIn']),
	},
};
</script>

<template>
	<router-view />
	<Toast />
</template>

<style scoped></style>
