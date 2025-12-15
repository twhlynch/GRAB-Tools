import { createRouter, createWebHistory } from 'vue-router';

import MainLayout from '@/layouts/MainLayout.vue';
import PlainLayout from '@/layouts/PlainLayout.vue';

const HomePage = () => import('./pages/HomePage.vue');
const StatsPage = () => import('./pages/StatsPage.vue');
const ToolsPage = () => import('./pages/ToolsPage.vue');
const ListPage = () => import('./pages/ListPage.vue');
const GamesPage = () => import('./pages/GamesPage.vue');
const ErrorPage = () => import('./pages/ErrorPage.vue');
const PrivacyPage = () => import('./pages/PrivacyPage.vue');
const EditorPage = () => import('./pages/EditorPage.vue');
const DownloadPage = () => import('./pages/DownloadPage.vue');

const routes = [
	{
		path: '/',
		component: MainLayout,
		children: [
			{ path: '', component: HomePage },
			{ path: 'stats', component: StatsPage },
			{ path: 'tools', component: ToolsPage },
			{ path: 'list', component: ListPage },
			{ path: 'games', component: GamesPage },
			{ path: 'download', component: DownloadPage },
			{ path: 'privacy', component: PrivacyPage },
			{ path: ':pathMatch(.*)*', component: ErrorPage },
		],
	},
	{
		path: '/editor',
		component: PlainLayout,
		children: [{ path: '', component: EditorPage }],
	},
	{
		path: '/levels/viewer',
		redirect: '/editor',
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes: routes,
});

export default router;
