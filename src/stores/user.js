import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
	state: () => ({
		user: undefined,
		expires: 0,
		accessToken: undefined,
	}),

	getters: {
		accessToken: (state) => {
			state.validate();
			return state.accessToken;
		},
		isLoggedIn: (state) => {
			state.validate();
			return !!state.user;
		},
		isAdmin: (state) => {
			state.validate();
			return state.user?.info && state.user.info.is_admin;
		},
		isSuperModerator: (state) => {
			state.validate();
			return (
				state.user?.info &&
				(state.user.info.is_supermoderator || state.user.info.is_admin)
			);
		},
		isModerator: (state) => {
			state.validate();
			return (
				state.user?.info &&
				(state.user.info.is_moderator ||
					state.user.info.is_supermoderator ||
					state.user.info.is_admin)
			);
		},
		isVerifier: (state) => {
			state.validate();
			return (
				state.user?.info &&
				(state.user.info.is_verifier ||
					state.user.info.is_moderator ||
					state.user.info.is_supermoderator ||
					state.user.info.is_admin)
			);
		},
		userID: (state) => {
			state.validate();
			return state.user?.info?.user_id;
		},
		userInfo: (state) => {
			state.validate();
			return state.user?.info;
		},
	},

	actions: {
		validate() {
			if (
				this.expires - Date.now() > 0 ||
				this.user?.access_token === undefined ||
				this.user?.access_token?.length === 0
			) {
				this.user = undefined;
				this.expires = 0;
				this.user.access_token = undefined;
			}
		},
		async login(userName, userID) {
			// TODO:
		},
	},
	persist: true,
});
