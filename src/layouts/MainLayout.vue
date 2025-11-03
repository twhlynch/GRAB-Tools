<script>
import NavMenu from '@/components/NavMenu.vue';

export default {
	components: {
		NavMenu,
	},
};
</script>

<template>
	<NavMenu />
	<router-view />
	<footer class="footer">
		<span>twhlynch</span><span>•</span><span>.index</span>
	</footer>
	<Toast />
</template>

<style>
/* layout */
html {
	background-color: #5f8bc2;
	background-image: linear-gradient(#5f8bc2, #cfe0ea, #5f8bc2);
	background-size: cover;
	background-repeat: no-repeat;
	background-attachment: fixed;
}
body {
	width: 100vw;
	height: 100vh;
	overflow-x: hidden;
	font-size: var(--font-size-default);
	font-family: var(--font-family-default);
	color: var(--text-color-default);
}
main {
	width: min(800px, 80%);
	margin-inline: auto;
	margin-top: 100px;
}
@media screen and (max-width: 617px) {
	main {
		width: min(800px, 90%);
	}
}
@media screen and (max-width: 400px) {
	main {
		width: 95%;
		margin-top: 50px;
	}
}
section {
	padding: var(--padding-main);
	width: 100%;
}

/* general */
main {
	p a {
		color: var(--text-color-link);
		text-decoration: none;
	}
	h2 {
		font-size: var(--font-size-big);
		font-weight: var(--font-weight-bold);
		color: var(--text-color-alt);
		padding-bottom: var(--padding-secondary);
	}
}
svg {
	height: 24px;
	width: 24px;
	color: var(--text-color-default);
}
.button {
	text-decoration: none;
	color: var(--text-color-default);
	font-size: var(--font-size-default);
	font-weight: var(--font-weight-bold);
	padding: var(--padding-secondary);
	border-radius: var(--border-radius);
	border: solid 2px var(--border-color);
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	gap: var(--padding-secondary);
	background-color: #0000;
	cursor: pointer;
	transition: background-color 0.2s ease-in-out;
	:hover {
		background-color: #5f8cc213;
	}
}
.button-sml {
	text-decoration: none;
	color: var(--text-color-default);
	font-size: calc(var(--font-size-default) * 0.8);
	font-weight: var(--font-weight-bold);
	padding-block: calc(var(--padding-secondary) / 4);
	padding-inline: calc(var(--padding-secondary) / 2);
	border-radius: var(--border-radius);
	border: solid 1px #4683ce70;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: var(--padding-secondary);
	background-color: #5f8cc235;
	width: fit-content;
	cursor: pointer;
}
.button-super-sml {
	text-decoration: none;
	color: var(--text-color-default);
	font-size: calc(var(--font-size-default) / 2);
	font-weight: var(--font-weight-bold);
	padding-block: calc(var(--padding-secondary) / 8);
	padding-inline: calc(var(--padding-secondary) / 4);
	border-radius: var(--border-radius);
	border: solid 1px #4683ce70;
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	gap: var(--padding-secondary);
	background-color: #5f8cc235;
	width: fit-content;
	cursor: pointer;
}

/* footer */
.footer {
	margin-inline: auto;
	width: fit-content;
	height: 100px;
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 0.1fr 1fr;
	gap: var(--padding-secondary);
}
.footer span {
	width: 100%;
}
.footer span:nth-child(1) {
	text-align: right;
}
.footer span:nth-child(2) {
	text-align: center;
}
.footer span:nth-child(3) {
	text-align: left;
}
</style>
