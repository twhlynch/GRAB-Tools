<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

import Bookmarklet from '#components/Bookmarklet.vue';
import GHLLogoIcon from '#icons/GHLLogoIcon.vue';
import GithubIcon from '#icons/GithubIcon.vue';
import MailIcon from '#icons/MailIcon.vue';
import YoutubeIcon from '#icons/YoutubeIcon.vue';
import DiscordAltIcon from '#icons/DiscordAltIcon.vue';

export default {
	components: {
		Bookmarklet,
		GHLLogoIcon,
		GithubIcon,
		MailIcon,
		YoutubeIcon,
		DiscordAltIcon,
	},

	data() {
		return {
			test: undefined,
		};
	},
	computed: {
		...mapState(useUserStore, [
			'isModerator',
			'accessToken',
			'isLoggedIn', //
		]),
	},

	methods: {},
	created() {
		document.title = 'GRAB Tools';
	},
};
</script>

<template>
	<main>
		<section id="extension-update">
			<h2>Extension Update!</h2>
			<p>
				Your GRAB Tools extension is out of date! Go install the newest
				version from
				<a href="https://github.com/twhlynch/grab-tools-extension"
					>github.com/twhlynch/grab-tools-extension</a
				>.
			</p>
		</section>
		<section id="info">
			<h2>GRAB Tools</h2>
			<p>
				Welcome to GRAB Tools! A collection of modding tools, resources,
				statistics and more for the VR game
				<a href="https://grabvr.quest">GRAB</a>. Brought to you by
				<a href="https://twhlynch.me">.index</a>.
			</p>
			<p>
				Here you will find the <a href="/editor">JSON Level Editor</a>,
				a combination of many tools for editing levels in JSON and 3D,
				running pre-made functions to modify levels, and the cheat sheet
				developed by me and MiloJenSopha to generate levels with modded
				objects. There are also a large amount of
				<a href="/stats">stats and leaderboards</a> such as the unbeaten
				levels list, and most played levels list. Even a
				<a href="https://grabvr.miraheze.org/wiki/.index">wiki page</a>
				hosted on miraheze.
			</p>
		</section>
		<section id="tools">
			<a class="button" href="/editor" target="_blank"
				>JSON Level Editor</a
			>
			<a class="button" href="/search" target="_blank">Advanced Search</a>
			<a class="button" href="/list" target="_blank">
				<GHLLogoIcon class="ghl-icon" />
				Hardest Levels
			</a>
			<a
				class="button"
				href="https://github.com/twhlynch/grab-tools-extension"
				target="_blank"
				>Chrome extension</a
			>
		</section>
		<section id="bookmarklets">
			<h2>Bookmarklets</h2>
			<p>
				Drag these onto your bookmarks bar and click to run them while
				in the level browser.
			</p>
			<p>
				Also check out the
				<a href="https://github.com/twhlynch/grab-tools-extension"
					>Chrome extension</a
				>
				that adds a bunch of useful features like these right into the
				<a href="https://grabvr.quest/levels">level browser</a>.
			</p>
		</section>
		<section id="bookmark-links">
			<Bookmarklet
				class="button"
				:name="'Chrome Extension'"
				:script="'ChromeExtension.js'"
			/>
			<Bookmarklet
				class="button"
				:name="'Open in JSON Editor'"
				:script="'JSONEditor.js'"
			/>
			<Bookmarklet
				class="button"
				:name="'Download glTF'"
				:script="'DownloadGlTF.js'"
			/>
			<Bookmarklet
				class="button"
				:name="'Download Level'"
				:script="'Download.js'"
			/>
			<Bookmarklet
				class="button"
				:name="'Custom Colors'"
				:script="'CustomColors.js'"
			/>
		</section>
		<section id="state">
			<h2>Help</h2>
			<div id="socials">
				<a href="https://github.com/twhlynch" class="social">
					<GithubIcon />
					<span>@twhlynch</span>
				</a>
				<a
					href="https://discordapp.com/users/649165311257608192"
					class="social"
				>
					<DiscordAltIcon />
					<span> @.index </span>
				</a>
				<a href="https://youtube.com/@dotindex" class="social">
					<YoutubeIcon />
					<span> @dotindex </span>
				</a>
				<a href="mailto:twhlynch.index@gmail.com" class="social">
					<MailIcon />
					<span> Email </span>
				</a>
			</div>
			<p>
				If you need help with anything, you should join the
				<a href="/discord">discord server</a>, but feel free to contact
				me on any of my socials, or if you prefer, you can email me at
				twhlynch.index@gmail.com.
			</p>
		</section>
	</main>
</template>

<style scoped>
#extension-update {
	display: none;
}
#socials {
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	gap: var(--padding-main);
	font-weight: var(--font-weight-bold);
	padding-bottom: var(--padding-secondary);
}
.social {
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	gap: var(--padding-secondary);
	text-decoration: none;
	color: var(--text-color-default);
}
#bookmark-links {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: var(--padding-secondary);
	padding-block: var(--padding-secondary);
	flex-wrap: wrap;
}
#tools {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: var(--padding-secondary);
	padding-block: var(--padding-secondary);
	flex-wrap: wrap;
}
#state span,
#currentTime,
#currentState {
	color: var(--text-color-alt);
}
</style>
<style>
.ghl-icon svg,
.ghl-icon {
	width: 21px;
	height: 21px;
	color: #ffdf5b;
}
</style>
