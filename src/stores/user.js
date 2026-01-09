import { SERVER_URL } from '@/config';
import { defineStore } from 'pinia';
import { LogEvent } from '@/requests/LogEvent';
import { setUser } from '@sentry/vue';
import { useCookiesStore } from './cookies';
import { user_info_request } from '@/requests/UserInfoRequest';

export const useUserStore = defineStore('user', {
	state: () => ({
		user_name: undefined,
		grab_id: undefined,
		access_token: undefined,
		user: undefined,
		is_site_admin: false,
		is_list_moderator: false,
		logged_in: false,
	}),

	getters: {
		is_logged_in: (state) => {
			return state.logged_in;
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

			if (!response.ok) {
				window.toast(await response.text(), 'error');
			}

			const data = await response.json();
			this.user_name = data.user_name;
			this.grab_id = data.grab_id;
			this.access_token = data.access_token;
			this.is_site_admin = data.is_admin;
			this.is_list_moderator = data.is_list_moderator;
			this.logged_in = true;

			if (this.grab_id) {
				this.user = await user_info_request(this.grab_id);
			}

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
