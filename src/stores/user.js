import { SERVER_URL } from '@/config';
import { defineStore } from 'pinia';
import { LogEvent } from '@/requests/LogEvent';
import { setUser } from '@sentry/vue';
import { useCookiesStore } from './cookies';

export const useUserStore = defineStore('user', {
	state: () => ({
		user_name: undefined,
		meta_id: undefined,
		user: undefined,
	}),

	getters: {
		is_logged_in: (state) => {
			return state.user_name !== undefined;
		},
		is_admin: (state) => {
			return state.user?.is_admin;
		},
		is_supermoderator: (state) => {
			return state.user?.is_admin || state.user?.is_supermoderator;
		},
		is_moderator: (state) => {
			return (
				state.user?.is_admin ||
				state.user?.is_supermoderator ||
				state.user?.is_moderator
			);
		},
		is_verifier: (state) => {
			return (
				state.user?.is_admin ||
				state.user?.is_supermoderator ||
				state.user?.is_moderator ||
				state.user?.is_verifier
			);
		},
		user_info: (state) => {
			return state.user;
		},
	},

	actions: {
		async login(auth_info) {
			const { org_scoped_id, code } = auth_info;
			const response = await fetch(
				`${SERVER_URL}get_access_token?service_token=${org_scoped_id}:${code}`,
			);
			if (response.ok) {
				const data = await response.json();
				this.user_name = data.alias;
				this.meta_id = data.id;
			}
			// TODO: load user info
			LogEvent('LOGIN');

			const cookies = useCookiesStore();
			if (cookies.allow_cookies) {
				setUser({ username: this.user_name });
			}
		},
		async logout() {
			this.$reset();
			setUser({ username: null });
		},
	},
	persist: true,
});
