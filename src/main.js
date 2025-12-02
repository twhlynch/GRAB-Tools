import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import * as Sentry from '@sentry/vue';
import { useCookiesStore } from '@/stores/cookies';
import { useUserStore } from '@/stores/user';

import * as config from './config';
import router from './router';
import App from './App.vue';

import '@/assets/globals.css';

const app = createApp(App);
app.config.globalProperties.$config = config;

app.config.unwrapInjectedRef = true;

Sentry.init({
	app,
	// dummy dsn
	dsn: 'https://SENTRY_PUBLIC_KEY@SENTRY_INGEST_HOST.ingest.us.sentry.io/0123456789',
	tunnel: config.SERVER_URL + 'sentry_proxy',
	sendDefaultPii: true,
	enableLogs: true,
	release: config.VERSION,
	beforeSend(event) {
		const cookies = useCookiesStore();
		const user = useUserStore();

		if (cookies.allow_cookies && user.user_name) {
			(event.user ??= {}).username = user.user_name;
		}

		return event;
	},
	enabled: !(
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1'
	),
});

app.use(router);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

app.mount('#app');
