<script>
import AssemblyEditor from '@/components/AssemblyEditor.vue';
import DropDown from '@/components/EditorPanels/DropDown.vue';
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import { GASMEditor, OutputEditor } from '@/editor/GASMEditor';
import { useConfigStore } from '@/stores/config';

export default {
	components: {
		DropDown,
		AssemblyEditor,
		ResizableColPanel,
	},
	data() {
		return {
			active_tab: 0,
			error: false,
			editors: [GASMEditor],
			menu: {
				Edit: {
					Copy: { func: () => this.copy() },
					Paste: { func: () => this.paste() },
					// FIXME: i dont know why these broke
					// Undo: { func: () => this.undo() },
					// Redo: { func: () => this.redo() },
					Clear: { func: () => this.clear() },
				},
				Samples: {
					'Get Player By Name': {
						func: () => this.sample('get_player_by_name'),
					},
					'Write Text On Sign': {
						func: () => this.sample('write_text_on_sign'),
					},
				},
			},
		};
	},
	mounted() {
		document.title = 'GASM Editor | GRAB Tools';

		this.active_tab = useConfigStore().active_gasm_tab;
		this.$nextTick(function () {
			this.changed();
		});
	},
	methods: {
		// needs to be somwhere for the component to access
		OutputEditor,

		editor() {
			return this.$refs.editors[this.active_tab];
		},

		copy() {
			this.editor().copy();
		},
		paste() {
			this.editor().paste();
		},
		compile() {
			return this.editor().compile();
		},
		undo() {
			this.editor().undo();
		},
		redo() {
			this.editor().redo();
		},
		clear() {
			this.editor().set('');
		},
		copyOutput() {
			this.$refs.outputEditor.copy();
		},
		async sample(name) {
			try {
				const res = await fetch(`/gasm/${name}.asm`);
				const asm = await res.text();
				this.editor().set(asm);
			} catch (e) {
				e.message = 'Failed to load asm: ' + e.message;
				window.toast(e, 'error');
			}
		},
		switch_page(number) {
			if (number === this.active_tab) return;
			this.active_tab = number;
			this.changed();
		},
		set_output(text) {
			this.$refs.outputEditor.set(text);
		},
		changed() {
			this.error = true;

			const result = this.compile();
			if (result !== undefined) {
				this.set_output(result);
				this.error = false;
			}
		},
	},
};
</script>

<template>
	<main id="gasm">
		<menu>
			<li v-for="[name, item] of Object.entries(menu)" :key="name">
				<button class="menu-btn">{{ name }}</button>
				<DropDown :menu="item" class="dropdown" />
			</li>
		</menu>

		<div id="container">
			<ResizableColPanel id="editor-container">
				<template #first>
					<menu ref="tab_parent" class="tab-menu">
						<button
							v-for="(editor_class, i) in editors"
							:key="i"
							:class="i === active_tab && 'selected'"
							@click="switch_page(i)"
						>
							{{ editor_class.title }}
						</button>
					</menu>
					<AssemblyEditor
						v-for="(editor_class, i) in editors"
						v-show="i === active_tab"
						:key="i"
						ref="editors"
						:editor="editor_class"
						@changed="changed"
					/>
				</template>
				<template #second>
					<div class="output-header">
						<menu class="tab-menu">
							<button
								class="selected"
								:style="
									(error ? 'color: #D8647E;' : '') +
									'cursor: default;'
								"
							>
								Output
							</button>
						</menu>
						<button class="copy-output-btn" @click="copyOutput">
							Copy
						</button>
					</div>
					<AssemblyEditor ref="outputEditor" :editor="OutputEditor" />
				</template>
			</ResizableColPanel>
		</div>
	</main>
</template>

<style>
html:has(#gasm) {
	background-color: #1e1e1e;
	overscroll-behavior: none;
}
</style>
<style scoped>
#gasm {
	display: flex;
	flex-direction: column;
	width: 100svw;
	height: 100svh;
}
menu {
	display: flex;
	background-color: #1e1e1e;
	align-items: center;
	justify-content: flex-start;
	gap: 6px;
	padding: 6px;
	height: fit-content;

	button {
		background-color: #2e2e2e;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		font-family: var(--font-family-default);
		&:hover {
			background-color: #3e3e3e;
		}
	}
}
menu > li {
	position: relative;
	list-style: none;
}
menu.tab-menu {
	padding: 0px;
	padding-left: 6px;
	gap: 0px;

	button {
		padding: 6px 16px;
		background-color: #1e1e1e;
		color: #5e5e5e;
		&:hover {
			background-color: #2e2e2e;
		}
	}
	button.selected {
		background-color: #141415;
		color: white;
		&:hover {
			background-color: #171718;
		}
	}
}
#container {
	width: 100%;
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: row;
}
#editor-container {
	width: 100%;
}
menu {
	flex-direction: row;
	width: 100%;
}
.menu-btn {
	background-color: #2e2e2e;
	padding: 6px 16px;
	border: none;
	cursor: pointer;
	font-size: 0.8rem;
	font-family: var(--font-family-default);
	&:hover {
		background-color: #3e3e3e;
	}
}
.dropdown {
	padding-top: 4px;
}
.output-header {
	position: relative;
}
.output-header menu {
	margin: 0;
}
.copy-output-btn {
	position: absolute;
	right: 6px;
	top: 50%;
	transform: translateY(-50%);
	background-color: #2e2e2e;
	color: white;
	padding: 4px 12px;
	border: none;
	cursor: pointer;
	font-size: 0.75rem;
	font-family: var(--font-family-default);
	&:hover {
		background-color: #3e3e3e;
	}
}
a {
	color: #5b5f84;
	text-decoration: none;
}
p {
	text-align: center;
}
</style>
