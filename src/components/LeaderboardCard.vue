<script>
import PreviewImagePlaceholderIcon from '@/icons/PreviewImagePlaceholderIcon.vue';

export default {
	components: {
		PreviewImagePlaceholderIcon,
	},
	props: {
		data: Object,
	},
	data() {
		return {
			image_error: false,
		};
	},
	methods: {
		error() {
			this.image_error = true;
		},
	},
	computed: {
		creator_url() {
			const creator_id = this.data.identifier.split(':')[0];
			return `${this.$config.GRAB_PAGE_URL}levels?tab=tab_other_user&user_id=${creator_id}`;
		},
		image_url() {
			const image_key = this.data.images?.thumb?.key;
			return `${this.$config.GRAB_IMAGES_URL}${image_key}`;
		},
		level_url() {
			return `${this.$config.GRAB_PAGE_URL}/levels/viewer/?level=${this.data.identifier}`;
		},
		creator() {
			return this.data.creators?.[0] ?? '..';
		},
		creators_string() {
			if (!this.data.creators?.length) return '';
			return this.data.creators.join(', ');
		},
	},
};
</script>

<template>
	<div class="leaderboard-item leaderboard-item-card">
		<PreviewImagePlaceholderIcon v-if="image_error" />
		<img v-else :src="image_url" @error="error" />
		<div class="leaderboard-item-info">
			<a :href="level_url" target="_blank">{{ data.title }}</a
			><br /><span>by </span
			><a :href="image_url" target="_blank" :title="creators_string">{{
				creator
			}}</a>
		</div>
		<span>{{ data.extra }}</span
		><span>{{ data.value }}</span>
	</div>
</template>

<style scoped></style>
