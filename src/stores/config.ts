import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
	state: (): {
		editor_config: object | undefined;
		default_level: string | undefined;
		dark_mode: boolean;
		vim_enabled: boolean;
		default_gasm: string;
		default_page: number;
	} => ({
		editor_config: undefined,
		default_level: undefined,
		dark_mode: false,
		vim_enabled: false,
		default_gasm: '',
		default_page: 1,
	}),
	actions: {
		set_dark_mode(value: boolean) {
			this.dark_mode = value;
		},
		set_vim(value: boolean) {
			this.vim_enabled = value;
		},
		set_default_gasm(value: string) {
			this.default_gasm = value;
		},
		set_default_page(value: number) {
			this.default_page = value;
		},
	},
	persist: true,
});
