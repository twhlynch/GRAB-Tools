<script>
import downloads from '@/assets/tools/downloads';
import encoding from '@/assets/tools/encoding';
import CheckmarkIcon from '@/icons/CheckmarkIcon.vue';
import CrossIcon from '@/icons/CrossIcon.vue';
import DownloadIcon from '@/icons/DownloadIcon.vue';
import EditIcon from '@/icons/EditIcon.vue';
import { add_hardest_level_request } from '@/requests/AddHardestLevelRequest';
import { remove_hardest_level_request } from '@/requests/RemoveHardestLevelRequest';
import { useUserStore } from '@/stores/user';
import { mapState } from 'pinia';

export default {
	components: {
		DownloadIcon,
		EditIcon,
		CrossIcon,
		CheckmarkIcon,
	},
	props: {
		list: Array,
	},
	data() {
		return {
			edit_level_id: null,
			remove_level_id: null,
			edit_level_position: null,
		};
	},
	methods: {
		async edit_level(level_id) {
			if (this.edit_level_id !== level_id) {
				this.edit_level_id = level_id;
				return;
			}

			const success = await add_hardest_level_request(
				level_id,
				this.edit_level_position,
			);
			if (success) {
				window.toast(`Updated level`);
				this.$emit('update');
			}

			this.edit_level_id = null;
		},
		async remove_level(level_id) {
			if (this.remove_level_id !== level_id) {
				this.remove_level_id = level_id;
				return;
			}

			const success = await remove_hardest_level_request(level_id);
			if (success) {
				window.toast(`Removed level`);
				this.$emit('update');
			}
			this.remove_level_id = null;
		},
		level_url(level_id) {
			return this.$config.GRAB_VIEWER_URL + level_id;
		},
		user_class(level_id) {
			return (
				this.is_logged_in &&
				this.grab_id === level_id.split(':')[0] &&
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
		...mapState(useUserStore, [
			'is_logged_in',
			'grab_id',
			'is_list_moderator',
		]),
	},
	emits: ['update'],
};
</script>

<template>
	<div>
		<div
			v-for="({ title, creators, level_id, position }, i) in list"
			:key="i"
			:class="['leaderboard-item', 'list-item', user_class(level_id)]"
		>
			<p>{{ position }}</p>
			<a :href="level_url(level_id)" target="_blank">{{ title }}</a>
			<span @click="download(level_id)" class="divider">
				<DownloadIcon class="icon" />
			</span>
			<p v-if="edit_level_id !== level_id">
				{{ creators.split(/[,\s]/)[0] }}
			</p>
			<div
				class="container"
				v-if="edit_level_id === level_id && is_list_moderator"
			>
				<input
					type="number"
					placeholder="Position"
					v-model="edit_level_position"
					@keyup.enter="edit_level(level_id)"
				/>
				<button class="btn" @click="edit_level(level_id)">
					<CheckmarkIcon />
				</button>
			</div>
			<div
				class="container"
				v-if="edit_level_id !== level_id && is_list_moderator"
			>
				<button class="btn edit" @click="edit_level(level_id)">
					<EditIcon />
				</button>
				<button
					:class="[
						'btn',
						'remove',
						this.remove_level_id === level_id && 'active',
					]"
					@click="remove_level(level_id)"
				>
					<CrossIcon />
				</button>
			</div>
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
.container {
	display: flex;
	flex-direction: row;
	gap: 5px;
	padding-left: 10px;

	input {
		padding: 5px 10px;
		background: #2e5d9740;
		border-radius: 5px;
		color: var(--text-color-default);
	}
}
.btn {
	padding-inline: 5px;
	background: transparent;
	cursor: pointer;

	span {
		width: 20px;
	}
	&.active span {
		color: var(--red);
	}
}
</style>
