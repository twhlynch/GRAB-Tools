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
		default_python: '',
		default_page: 0,
	}),
	actions: {
		set_dark_mode(value: boolean) {
			this.dark_mode = value;
		},
		set_vim(value: boolean) {
			this.vim_enabled = value;
		},
		set_default_gasm_values(gasm: string, python: string, page: number) {
			this.default_gasm = gasm;
			this.default_python = python;
			this.default_page = page;
		},
	},
	persist: true,
});
