<script>
import MoonIcon from '@/icons/MoonIcon.vue';
import SunIcon from '@/icons/SunIcon.vue';
import { useConfigStore } from '@/stores/config';
import { mapActions, mapState } from 'pinia';

export default {
	components: {
		MoonIcon,
		SunIcon,
	},
	computed: {
		...mapState(useConfigStore, ['dark_mode']),
	},
	methods: {
		...mapActions(useConfigStore, ['set_dark_mode']),

		toggle() {
			this.set_dark_mode(!this.dark_mode);
		},
	},
};
</script>

<template>
	<div class="dark-mode-toggle" @click="toggle">
		<MoonIcon v-show="dark_mode" />
		<SunIcon v-show="!dark_mode" />
	</div>
</template>

<style scoped>
.dark-mode-toggle {
	color: var(--text-color-default);
	padding: 8px;
	display: flex;
	align-items: center;
	cursor: pointer;
}
</style>
