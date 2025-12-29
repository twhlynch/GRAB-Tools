<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import GeneralPopup from './GeneralPopup.vue';

export default {
	components: {
		GeneralPopup,
	},
	methods: {
		logout() {
			const userStore = useUserStore();
			userStore.logout();
			this.$emit('update:visible', false);
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name', 'grab_id']),
	},
	props: {
		visible: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:visible'],
};
</script>

<template>
	<GeneralPopup
		:visible="visible"
		@update:visible="$emit('update:visible', $event)"
	>
		<span>{{ user_name }}</span>
		<button class="logout" @click="logout">Logout</button>
	</GeneralPopup>
</template>

<style scoped>
.logout {
	background-color: var(--red);
}
.verify {
	background-color: var(--blue);
}
</style>
