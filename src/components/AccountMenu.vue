<script>
import DownloadsMenu from '@/components/DownloadsMenu.vue';
import GeneralPopup from '@/components/GeneralPopup.vue';
import VerifyMenu from '@/components/VerifyMenu.vue';
import { useUserStore } from '@/stores/user';
import { mapState } from 'pinia';

export default {
	components: {
		GeneralPopup,
		VerifyMenu,
		DownloadsMenu,
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
			show_downloads_menu: false,
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
		<button class="verify" v-if="!grab_id" @click="show_verify_menu = true">
			Verify Account
		</button>
		<button
			class="downloads"
			v-if="grab_id"
			@click="show_downloads_menu = true"
		>
			Manage Downloads
		</button>
		<VerifyMenu v-model:visible="show_verify_menu" />
		<DownloadsMenu v-model:visible="show_downloads_menu" />
	</GeneralPopup>
</template>

<style scoped>
.logout {
	background-color: var(--red);
}
.verify {
	background-color: var(--blue);
}
.downloads {
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
