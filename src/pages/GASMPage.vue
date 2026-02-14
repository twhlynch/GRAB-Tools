<script>
import GASMEditor from '@/components/GASMEditor.vue';

export default {
	components: {
		GASMEditor,
	},
	created() {
		document.title = 'GASM Editor | GRAB Tools';
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
				this.$refs.editor.set(asm);
			} catch (e) {
				e.message = 'Failed to load asm: ' + e.message;
				window.toast(e, 'error');
			}
		},
	},
};
</script>

<template>
	<main id="gasm">
		<menu>
			<button @click="copy">Copy</button>
			<button @click="paste">Paste</button>
			<button @click="compile">Compile</button>
			<button @click="undo">Undo</button>
			<button @click="redo">Redo</button>
			<button @click="clear">Clear</button>
		</menu>
		<div id="container">
			<GASMEditor ref="editor" />
			<aside>
				<h3>Samples</h3>
				<p>
					Suggest your own samples in
					<a :href="this.$config.DISCORD_URL">the discord</a>!
				</p>
				<button @click="sample('get_player_by_name')">
					Get player by name
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
#container {
	width: 100%;
	flex: 1;
	overflow: auto;
	display: flex;
	flex-direction: row;
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
