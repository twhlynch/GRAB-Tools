<script>
import GeneralPopup from '@/components/GeneralPopup.vue';
import RefreshedIcon from '@/icons/RefreshedIcon.vue';
import { get_allow_downloads_request } from '@/requests/GetAllowDownloadsRequest';
import { list_request } from '@/requests/ListRequest';
import { set_allow_downloads_request } from '@/requests/SetAllowDownloadsRequest';
import { user_levels_request } from '@/requests/UserLevelsRequest';
import { useUserStore } from '@/stores/user';
import { mapState } from 'pinia';

export default {
	components: {
		GeneralPopup,
		RefreshedIcon,
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'grab_id']),
	},
	data() {
		return {
			allow_downloads: false,
			levels: [],
			loaded: false,
		};
	},
	props: {
		visible: {
			type: Boolean,
			required: true,
		},
	},
	methods: {
		async load() {
			this.loaded = true;

			const [levels, challenge, one_of_a_kind, allow_settings] =
				await Promise.all([
					user_levels_request(this.grab_id),
					list_request('curated_challenge'),
					list_request('curated_one_of_a_kind'),
					get_allow_downloads_request(this.grab_id),
				]);

			if (!levels || !challenge || !one_of_a_kind || !allow_settings) {
				return;
			}

			this.allow_downloads = allow_settings.user;

			const enabled_levels = allow_settings.levels
				.filter((level) => level.allow)
				.map((level) => ({
					identifier: level.level_id,
				}));

			const disabled_levels = allow_settings.levels
				.filter((level) => !level.allow)
				.map((level) => ({
					identifier: level.level_id,
				}));

			const allowed = [...challenge, ...one_of_a_kind, ...enabled_levels]
				.map((level) => level.identifier)
				.filter(
					(id) => !disabled_levels.find((dl) => dl.identifier === id),
				);

			this.levels = levels.map((level) => {
				if (allowed.find((id) => id === level.identifier)) {
					level.allow_downloads = true;
				} else if (
					disabled_levels.find(
						(dl) => dl.identifier === level.identifier,
					)
				) {
					level.allow_downloads = false;
				} else {
					level.allow_downloads = null;
				}

				level.can_reset = !(
					challenge.find((l) => l.identifier === level.identifier) ||
					one_of_a_kind.find((l) => l.identifier === level.identifier)
				);

				return level;
			});
		},
		async toggle_allow_downloads() {
			const success = await set_allow_downloads_request(
				null,
				this.grab_id,
				!this.allow_downloads,
			);
			if (!success) return;
			this.allow_downloads = !this.allow_downloads;
		},
		async set_level_allow_downloads(level, allow) {
			const success = await set_allow_downloads_request(
				level.identifier,
				null,
				allow,
			);
			if (!success) return;
			level.allow_downloads = allow;
		},
	},
	watch: {
		visible(val) {
			if (val && !this.loaded) {
				this.load();
			}
		},
	},
	emits: ['update:visible'],
};
</script>

<template>
	<GeneralPopup
		:visible="visible"
		@update:visible="$emit('update:visible', $event)"
	>
		<div class="header">
			<span>Default</span>
			<button
				:class="[
					'allow-downloads',
					'disabled',
					{ enabled: allow_downloads },
				]"
				@click="toggle_allow_downloads()"
			>
				{{ allow_downloads ? 'Enabled' : 'Disabled' }}
			</button>
		</div>
		<div class="levels">
			<div v-for="level in levels" :key="level.identifier" class="level">
				<span class="title">{{ level.title }}</span>
				<RefreshedIcon
					class="reset"
					v-if="level.can_reset && level.allow_downloads !== null"
					@click="set_level_allow_downloads(level, null)"
				/>
				<button
					:class="[
						'allow-downloads',
						{ enabled: level.allow_downloads === true },
						{ disabled: level.allow_downloads === false },
					]"
					@click="
						set_level_allow_downloads(level, !level.allow_downloads)
					"
				>
					{{
						{ true: 'Enabled', false: 'Disabled' }[
							level.allow_downloads
						] ?? 'Default'
					}}
				</button>
			</div>
		</div>
	</GeneralPopup>
</template>

<style scoped>
.header {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding-inline: 0.5rem;
}
.allow-downloads {
	width: 25%;
	&.disabled {
		background-color: var(--red);
	}
	&.enabled {
		background-color: var(--green);
	}
}
.levels {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1rem;
	overflow-y: auto;
	max-height: 70vh;
	.level {
		align-items: center;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding-inline: 0.5rem;
	}
	.title {
		word-break: break-word;
		width: 60%;
	}
}
.reset {
	cursor: pointer;
	color: var(--blue);
	width: 1.3rem;
}
</style>
