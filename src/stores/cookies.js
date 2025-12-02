import { defineStore } from 'pinia';

export const useCookiesStore = defineStore('cookies', {
	state: () => ({
		allow_cookies: false,
		timestamp: 0,
	}),
	actions: {
		set_allow_cookies(value) {
			this.allow_cookies = value;
			if (!value) {
				this.timestamp = Date.now();
			}
		},
	},
	persist: true,
});
