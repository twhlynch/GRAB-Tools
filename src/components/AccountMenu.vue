<script>
import { mapActions, mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import GeneralPopup from './GeneralPopup.vue';
import VerifyMenu from './VerifyMenu.vue';

export default {
	components: {
		GeneralPopup,
		VerifyMenu,
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
	data() {
		return {
			show_verify_menu: false,
		};
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
		<div class="header">
			<span>{{ user_name }}</span>
			<span class="grab-id">{{ grab_id ?? 'unverified' }}</span>
		</div>
		<button class="logout" @click="logout">Logout</button>
		<button
			class="verify"
			v-if="!grab_id && false"
			@click="show_verify_menu = true"
		>
			Verify Account
		</button>
		<VerifyMenu v-model:visible="show_verify_menu" />
	</GeneralPopup>
</template>

<style scoped>
.logout {
	background-color: var(--red);
}
.verify {
	background-color: var(--blue);
}
.header {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding-inline: 0.5rem;
}
.grab-id {
	opacity: 0.5;
}
</style>
