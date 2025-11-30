import { createRouter, createWebHistory } from 'vue-router';

import MainLayout from '@/layouts/MainLayout.vue';
import PlainLayout from '@/layouts/PlainLayout.vue';

import HomePage from '@/pages/HomePage.vue';
import StatsPage from '@/pages/StatsPage.vue';
import ToolsPage from '@/pages/ToolsPage.vue';
import ListPage from '@/pages/ListPage.vue';
import GamesPage from '@/pages/GamesPage.vue';
import ErrorPage from '@/pages/ErrorPage.vue';
import PrivacyPage from '@/pages/PrivacyPage.vue';
import EditorPage from '@/pages/EditorPage.vue';
import DownloadPage from '@/pages/DownloadPage.vue';

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
