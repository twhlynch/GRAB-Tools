import { SERVER_URL } from '@/config';
import { user_info_request } from '@/requests/UserInfoRequest';
import { useCookiesStore } from '@/stores/cookies';
import { UserInfo } from '@grab-tools/lib/data/types';
import { setUser } from '@sentry/vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
	state: (): {
		user_name: string | undefined;
		grab_id: string | undefined;
		access_token: string | undefined;
		expiry: number | undefined;
		user: UserInfo | undefined | null;
		is_site_admin: boolean;
		is_list_moderator: boolean;
		logged_in: boolean;
	} => ({
		user_name: undefined,
		grab_id: undefined,
		access_token: undefined,
		expiry: undefined,
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
			return state.user?.is_admin ?? state.user?.is_supermoderator;
		},
		is_moderator: (state) => {
			return (
				state.user?.is_admin ??
				state.user?.is_supermoderator ??
				state.user?.is_moderator
			);
		},
		is_verifier: (state) => {
			return (
				state.user?.is_admin ??
				state.user?.is_supermoderator ??
				state.user?.is_moderator ??
				state.user?.is_verifier
			);
		},
		user_info: (state) => {
			return state.user;
		},
	},

	actions: {
		async login(auth_info: { org_scoped_id: string; code: string }) {
			const { org_scoped_id, code } = auth_info;
			const response = await fetch(
				`${SERVER_URL}get_access_token?service_token=${org_scoped_id}:${code}`,
			);

			if (!response.ok) {
				window.toast(await response.text(), 'error');
			}

			const data = (await response.json()) as {
				user_name: string;
				grab_id: string;
				access_token: string;
				expiry: number;
				is_admin: boolean;
				is_list_moderator: boolean;
			};
			this.user_name = data.user_name;
			this.grab_id = data.grab_id;
			this.access_token = data.access_token;
			this.expiry = data.expiry;
			this.is_site_admin = data.is_admin;
			this.is_list_moderator = data.is_list_moderator;
			this.logged_in = true;

			if (this.grab_id) {
				this.user = await user_info_request(this.grab_id);
			}

			const cookies = useCookiesStore();
			if (cookies.allow_cookies) {
				setUser({ username: this.user_name });
			}
		},
		logout() {
			this.$reset();
			setUser({ username: undefined });
		},
		session_expired() {
			if (!this.logged_in) return;
			this.logout();
			window.toast('Session expired, please log in again', 'misuse');
		},
		check_expiry() {
			if (
				(this.expiry && this.expiry <= Math.floor(Date.now() / 1000)) ||
				(!this.expiry && this.access_token)
			) {
				this.session_expired();
			}
		},
	},
	persist: true,
});
