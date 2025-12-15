<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { captureException } from '@sentry/vue';
import KeyHint from './EditorPanels/KeyHint.vue';

export default {
	components: {
		KeyHint,
	},
	data() {
		return {
			message: undefined,
			show_technicals: false,
		};
	},

	created() {
		console.log('Freaking out...');
		if (window.panic === undefined) {
			window.panic = (error) => {
				error.message = 'PANIC: ' + error.message;
				captureException(error);
				this.message = error.message;
			};
		}
	},

	methods: {
		async copy() {
			await navigator.clipboard.writeText(this.message);
		},
		close() {
			this.message = undefined;
		},
		toggle_technicals() {
			this.show_technicals = !this.show_technicals;
		},
	},
};
</script>

<template>
	<div v-if="message" class="container">
		<div class="panic-popup">
			<div class="info">
				<p>
					Something has gone wrong. Try hard refreshing the page (
					<KeyHint :bind="'CTRL'" /> + <KeyHint :bind="'SHIFT'" /> +
					<KeyHint :bind="'R'" /> ), using another browser, or coming
					back later. If this continues to happen, please report it to
					the
					<a href="https://github.com/twhlynch/GRAB-Tools">GitHub</a>
					or
					<a href="https://discord.grabvr.tools">Discord server</a>.
					<span class="details">
						<button class="tech" @click="toggle_technicals">
							Technical details:
						</button>
						<code v-if="show_technicals">
							{{ message }}
						</code>
					</span>
				</p>
			</div>
			<div class="buttons">
				<button class="copy" @click="copy">Copy</button>
				<button class="close" @click="close">Ignore</button>
				<a class="button home" href="/">Home</a>
			</div>
		</div>
	</div>
</template>

<style scoped>
.container {
	position: fixed;
	z-index: 999999999;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: #000c;
}
.panic-popup {
	font-size: 1.1rem;
	z-index: 3000;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	background: var(--bg);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem 0.8rem;
	border-radius: 1.5rem;
	width: max(30svw, 450px);
	max-width: 80svw;
}
p > i.key-hint {
	position: static;
}
.buttons {
	display: flex;
	flex-direction: row;
	gap: 1rem;
}
.info {
	display: flex;
	flex-direction: row;
	gap: 1rem;
	padding-inline: 0.4rem;
	align-items: center;
	justify-content: center;
}
.details {
	display: flex;
	flex-direction: column;
	width: 100%;
	padding-top: 0.8rem;

	code {
		padding: 0.3rem;
		margin-top: 0.3rem;
		background-color: #0002;
	}
}
@media screen and (max-width: 500px) {
	.buttons {
		flex-direction: column;
	}
}
button,
.button {
	font-size: 1rem;
	color: white;
	line-height: 2rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 1rem;
	padding-inline: 1rem;
}
.tech {
	background-color: #fff1;
	width: fit-content;
}
.home,
.copy,
.close {
	height: 2rem;
	width: 100%;
	background-color: #fff2;
}
a {
	color: var(--text-color-link);
	text-decoration: none;
}
span {
	width: 12rem;
}
</style>
