<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

import NavMenu from '#components/NavMenu.vue';

export default {
	components: {
		NavMenu,
	},
	data() {
		return {};
	},
	computed: {
		...mapState(useUserStore, ['isLoggedIn']),
	},
};
</script>

<template>
	<NavMenu />
	<router-view />
	<Toast />
</template>

<style scoped></style>
