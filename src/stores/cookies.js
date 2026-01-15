import { useUserStore } from '@/stores/user';
import { setUser } from '@sentry/vue';
import { defineStore } from 'pinia';

export const useCookiesStore = defineStore('cookies', {
	state: () => ({
		allow_cookies: false,
		timestamp: 0,
	}),
	actions: {
		set_allow_cookies(value) {
			this.allow_cookies = value;
			if (value) {
				const user = useUserStore();
				if (user.user_name && this.allow_cookies) {
					setUser({ username: user.user_name });
				}
			} else {
				this.timestamp = Date.now();
				setUser({ username: null });
			}
		},
	},
	persist: true,
});
