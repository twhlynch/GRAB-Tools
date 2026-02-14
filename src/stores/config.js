import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
	state: () => ({
		editor_config: undefined,
		default_level: undefined,
		dark_mode: false,
		vim_enabled: false,
		default_gasm: '',
	}),
	actions: {
		set_dark_mode(value) {
			this.dark_mode = value;
		},
		set_vim(value) {
			this.vim_enabled = value;
		},
		set_default_gasm(value) {
			this.default_gasm = value;
		},
	},
	persist: true,
});
