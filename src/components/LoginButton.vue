<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import UserIcon from '@/icons/UserIcon.vue';
import AccountMenu from './AccountMenu.vue';

export default {
	components: {
		UserIcon,
		AccountMenu,
	},
	data() {
		return {
			origin: this.$config.PAGE_URL,
			show_menu: false,
		};
	},
	methods: {
		logout() {
			const userStore = useUserStore();
			userStore.logout();
			this.show_menu = false;
		},
		open_menu() {
			this.show_menu = true;
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
				// ignore since its probably an actual element id hash
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
		<button v-if="is_logged_in" class="button-sml" @click="open_menu">
			<UserIcon class="user-icon" />
			{{ user_name }}
		</button>
		<a
			:href="`https://auth.oculus.com/sso/?organization_id=264907536624075&redirect_uri=${origin}`"
			v-else
			class="button-sml"
		>
			<UserIcon class="user-icon" />
			<span class="login-text-long">Meta Login</span>
			<span class="login-text-short">Login</span>
		</a>
		<AccountMenu v-model:visible="show_menu" />
	</div>
</template>

<style scoped>
.user-icon {
	height: 16px;
	width: 16px;
}
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
.account-menu {
	z-index: 3000;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	background: var(--bg);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem 0.8rem;
	border-radius: 1.5rem;
	width: max(30svw, 450px);
	max-width: 80svw;

	button {
		height: 2rem;
		border-radius: 1rem;
		padding-inline: 1rem;
		width: 100%;
		color: white;
		line-height: 2rem;
		cursor: pointer;
	}
}
.logout {
	background-color: var(--red);
}
.verify {
	background-color: var(--blue);
}
</style>
