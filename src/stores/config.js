import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
	state: () => ({
		editor_config: undefined,
		default_level: undefined,
	}),
	persist: true,
});
