<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import UserIcon from '@/icons/UserIcon.vue';

export default {
	components: {
		UserIcon,
	},
	data() {
		return {
			origin: this.$config.LIVE_PAGE_URL,
		};
	},
	methods: {
		logout() {
			const userStore = useUserStore();
			userStore.logout();
		},
	},

	async mounted() {
		this.origin = location.origin + '/';

		if (window.location.hash.length > 0) {
			try {
				const hash = this.$route.hash.substring(1);
				const data = atob(hash);
				const auth_info = JSON.parse(data);
				this.$router.replace({ path: this.$route.path });
				const userStore = useUserStore();
				await userStore.login(auth_info);
			} catch {
				// ignore since its probably and actual element id hash
			}
		}
	},

	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
	},
};
</script>

<template>
	<div class="login-button">
		<button v-if="is_logged_in" class="button-sml" @click="logout">
			<UserIcon />
			{{ user_name }}
		</button>
		<a
			:href="`https://auth.oculus.com/sso/?organization_id=264907536624075&redirect_uri=${origin}`"
			v-else
			class="button-sml"
		>
			<UserIcon />
			<span class="login-text-long">Meta Login</span>
			<span class="login-text-short">Login</span>
		</a>
	</div>
</template>

<style>
/* use css variables instead of manual scopes */
.login-button {
	svg {
		height: 16px;
		width: 16px;
	}
}
</style>
<style scoped>
.login-text-short {
	display: none;
}
@media screen and (max-width: 512px) {
	.login-text-long {
		display: none;
	}
	.login-text-short {
		display: inline;
	}
}
</style>
