import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import * as config from './config';
import router from './router';
import App from './App.vue';

import '#assets/globals.css';

const app = createApp(App);
app.config.globalProperties.$config = config;

app.config.unwrapInjectedRef = true;

app.use(router);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

app.mount('#app');
