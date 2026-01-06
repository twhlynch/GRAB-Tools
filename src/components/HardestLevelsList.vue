<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import downloads from '@/assets/tools/downloads';
import DownloadIcon from '@/icons/DownloadIcon.vue';
import encoding from '@/assets/tools/encoding';

export default {
	components: {
		DownloadIcon,
	},
	props: {
		list: Array,
	},
	methods: {
		level_url(level_id) {
			return this.$config.GRAB_VIEWER_URL + level_id;
		},
		user_class(id) {
			return (
				this.is_logged_in &&
				this.grab_id === id.split(':')[0] &&
				'personal'
			);
		},
		async download(level_id) {
			const level = await downloads.download_level(level_id);
			if (!level) {
				window.toast('Download failed');
				return null;
			}
			encoding.downloadLevel(level, level_id);
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'grab_id']),
	},
};
</script>

<template>
	<div>
		<div
			v-for="({ title, creator, id }, i) in list"
			:key="i"
			:class="['leaderboard-item', 'list-item', user_class(id)]"
		>
			<p>{{ i + 1 }}</p>
			<a :href="level_url(id)" target="_blank">{{ title }}</a>
			<span @click="download(id)" class="divider">
				<DownloadIcon class="icon" />
			</span>
			<p>{{ creator }}</p>
		</div>
	</div>
</template>

<style scoped>
.divider {
	cursor: pointer;
}
.icon {
	aspect-ratio: auto;
	scale: 80%;
	opacity: 0.8;
}
</style>
