<script>
import downloads from '@/assets/tools/downloads';
import encoding from '@/assets/tools/encoding';
import { useUserStore } from '@/stores/user';
import { mapState } from 'pinia';

export default {
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name']),
	},
	mounted() {
		const url_params = new URLSearchParams(window.location.search);
		const level = url_params.get('level');
		if (!level) return;

		level.split(' ').forEach(async (level_id) => {
			const level = await downloads.try_download_level(level_id);
			if (level === null) return;
			encoding.downloadLevel(level, level_id);
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
