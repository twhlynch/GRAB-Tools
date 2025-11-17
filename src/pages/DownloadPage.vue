<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import encoding from '@/assets/tools/encoding';
import { download_level_request } from '@/requests/DownloadLevelRequest';
import { level_details_request } from '@/requests/LevelDetailsRequest';
import { user_info_request } from '@/requests/UserInfoRequest';

export default {
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
	},
	methods: {
		async can_download_level(level_id) {
			if (!this.is_logged_in) {
				window.toast('Login to download your levels', 'warning');
				return false;
			}

			const user_id = level_id.split(':')[0];

			const user_info = await user_info_request(user_id);
			if (user_info === null) return false;

			if (this.user_name !== user_info.user_name) {
				window.toast(
					'You can only download your own levels',
					'warning',
				);
				return false;
			}

			return true;
		},
		async download_level(level_id) {
			let [user_id, map_id, iteration] = level_id.split(':');

			const details = await level_details_request(level_id);
			if (details === null) return;

			iteration = iteration || details.iteration;
			const download_id = [user_id, map_id, iteration].join(':');

			const level = await download_level_request(download_id);
			if (level === null) return;

			encoding.downloadLevel(level, map_id);
		},
	},
	mounted() {
		const url_params = new URLSearchParams(window.location.search);
		const level = url_params.get('level');
		if (!level) return;

		level.split(' ').forEach(async (level_id) => {
			if (await this.can_download_level(level_id)) {
				await this.download_level(level_id);
			}
		});
	},
	created() {
		document.title = 'Download | GRAB Tools';
	},
};
</script>

<template>
	<main>
		<section>
			<h2>Downloading</h2>
			<p>Downloading the level...</p>
		</section>
	</main>
</template>

<style scoped>
main {
	justify-items: center;
}
section {
	max-width: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
</style>
