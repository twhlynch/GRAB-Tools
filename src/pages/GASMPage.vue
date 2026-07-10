<script>
import ResizableColPanel from '@/components/EditorPanels/ResizableColPanel.vue';
import GASMEditor from '@/components/GASMEditor.vue';

export default {
	components: {
		GASMEditor,
		ResizableColPanel,
	},
	data() {
		return {
			page_num: null,
		};
	},
	mounted() {
		document.title = 'GASM Editor | GRAB Tools';
		//this.switch_page(0);
	},
	methods: {
		copy() {
			this.$refs.editor.copy();
		},
		paste() {
			this.$refs.editor.paste();
		},
		compile() {
			this.$refs.editor.compile();
		},
		undo() {
			this.$refs.editor.undo();
		},
		redo() {
			this.$refs.editor.redo();
		},
		clear() {
			this.$refs.editor.set('');
		},
		async sample(name) {
			try {
				const res = await fetch(`/gasm/${name}.asm`);
				const asm = await res.text();
				this.$refs.editor.set_sample(asm);
			} catch (e) {
				e.message = 'Failed to load asm: ' + e.message;
				window.toast(e, 'error');
			}
		},
		switch_page(number) {
			if (number === this.page_num) return;
			if (this.page_num !== null) {
				this.$refs.editor.switch_page(this.page_num, number); // include current page and page to switch to
			}
			console.log(this.$refs.tab_parent);
			this.page_num = number;
			this.$refs.tab_parent.childNodes.forEach((node, index) => {
				if (index == this.page_num) {
					node.className = 'selected';
				} else {
					node.className = '';
				}
			});
		},
		set_output(text) {
			this.$refs.outputEditor.set(text);
		},
	},
};
</script>

<template>
	<main id="gasm">
		<menu>
			<button @click="copy">Copy</button>
			<button @click="paste">Paste</button>
			<!-- <button @click="compile">Compile</button> (obsolete with new tabs system) -->
			<button @click="undo">Undo</button>
			<button @click="redo">Redo</button>
			<button @click="clear">Clear</button>
		</menu>
		<div id="container">
			<ResizableColPanel id="editor-container">
				<template #first>
					<menu ref="tab_parent" class="tab-menu">
						<button class="selected">GASM Editor</button>
						<!-- <button @click="switch_page(1)">Python</button> -->
					</menu>
					<GASMEditor
						ref="editor"
						output="false"
						@output="set_output"
					/>
				</template>
				<template #second>
					<menu class="tab-menu">
						<button class="selected" style="cursor: default">
							Output
						</button>
					</menu>
					<GASMEditor ref="outputEditor" output="true" />
				</template>
			</ResizableColPanel>
			<aside>
				<h3>Samples</h3>
				<p>
					Suggest your own samples in
					<a :href="$config.DISCORD_URL">the discord</a>!
				</p>
				<button @click="sample('get_player_by_name')">
					Get player by name
				</button>
				<button @click="sample('write_text_on_sign')">
					Write text on sign
				</button>
			</aside>
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
menu,
aside {
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
		padding: 6px 16px;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		font-family: var(--font-family-default);
		&:hover {
			background-color: #3e3e3e;
		}
	}
}
menu.tab-menu {
	padding: 0px;
	padding-left: 6px;
	gap: 0px;

	button {
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
	overflow: auto;
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
aside {
	flex-direction: column;
	width: 200px;
	height: 100%;
}
a {
	color: #5b5f84;
	text-decoration: none;
}
p {
	text-align: center;
}
</style>
