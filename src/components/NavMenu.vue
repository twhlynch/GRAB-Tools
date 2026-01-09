<script>
import HouseIcon from '@/icons/HouseIcon.vue';
import StatsIcon from '@/icons/StatsIcon.vue';
import ToolsIcon from '@/icons/ToolsIcon.vue';
import RocketIcon from '@/icons/RocketIcon.vue';
import DiscordIcon from '@/icons/DiscordIcon.vue';
import GlobeIcon from '@/icons/GlobeIcon.vue';
import LoginButton from '@/components/LoginButton.vue';
import DarkModeToggle from './DarkModeToggle.vue';

export default {
	components: {
		HouseIcon,
		StatsIcon,
		ToolsIcon,
		RocketIcon,
		DiscordIcon,
		GlobeIcon,
		LoginButton,
		DarkModeToggle,
	},

	mounted() {
		const currentLocation =
			window.location.pathname.replace('/', '').replace('.html', '') ||
			'home';
		const currentTab = document.getElementById(
			'nav-button-' + currentLocation,
		);
		if (currentTab) {
			currentTab.classList.add('nav-button-current');
		}
	},
};
</script>

<template>
	<nav class="nav-menu">
		<a href="/" id="nav-button-home" class="nav-button">
			<span>Home</span>
			<HouseIcon class="nav-hideable" />
		</a>
		<a href="/stats" id="nav-button-stats" class="nav-button">
			<span>Stats</span>
			<StatsIcon class="nav-hideable" />
		</a>
		<a href="/tools" id="nav-button-tools" class="nav-button">
			<span>Tools</span>
			<ToolsIcon class="nav-hideable" />
		</a>
		<a href="/games" id="nav-button-games" class="nav-button">
			<span>Games</span>
			<RocketIcon class="nav-hideable" />
		</a>
		<a :href="this.$config.DISCORD_URL" class="nav-button">
			<span>Discord</span>
			<DiscordIcon class="nav-hideable" />
		</a>
		<a :href="this.$config.WIKI_URL" class="nav-button">
			<span>Wiki</span>
			<GlobeIcon class="nav-hideable" />
		</a>
		<DarkModeToggle />
		<LoginButton />
	</nav>
</template>

<style scoped>
.nav-menu {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 8px;
	padding-block: 8px;
	flex-wrap: wrap;
	max-width: calc(800px - 4rem);
	margin-inline: auto;
	padding-inline: 2rem;
}
.nav-button {
	text-decoration: none;
	color: var(--text-color-default);
	font-size: var(--font-size-default);
	font-weight: var(--font-weight-bold);
	padding: 8px;
	border-radius: var(--border-radius);
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	gap: var(--padding-secondary);
	background-color: #0000;
	cursor: pointer;
	transition: background-color 0.2s ease-in-out;
	border: none;
	position: relative;
}
.nav-button::before {
	content: '';
	display: block;
	width: 6px;
	height: 3px;
	background-color: var(--text-color-default);
	transition: all 0.2s ease-in-out;
	position: absolute;
	border-radius: 5px;
	top: 0;
	left: calc(50% - 3px);
	opacity: 0.2;
}
.nav-button:hover::before {
	width: 50%;
	left: 25%;
	opacity: 1;
}
.nav-button-current::before {
	opacity: 1;
}

.nav-hideable {
	display: none;
	height: 24px;
	width: 24px;
}

@media screen and (max-width: 512px) {
	.nav-button {
		font-size: 0;
		gap: 0;
		border: none;
	}
	.nav-hideable {
		display: flex;
	}
}
</style>
