<script>
import Bookmarklet from '@/components/Bookmarklet.vue';
import GHLLogoIcon from '@/icons/GHLLogoIcon.vue';
import GithubIcon from '@/icons/GithubIcon.vue';
import MailIcon from '@/icons/MailIcon.vue';
import YoutubeIcon from '@/icons/YoutubeIcon.vue';
import DiscordAltIcon from '@/icons/DiscordAltIcon.vue';

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

	methods: {},
	created() {
		document.title = 'GRAB Tools';
	},
};
</script>

<template>
	<main>
		<section id="info">
			<h2>GRAB Tools</h2>
			<p>
				Welcome to GRAB Tools! A collection of tools, statistics and
				more for the VR game
				<a href="https://grabvr.quest">GRAB</a>. Brought to you by
				<a href="https://twhlynch.me">.index</a>.
			</p>
			<p>
				Here you will find many tools for editing, or generating levels,
				including the <a href="/editor">JSON Editor</a>. <br />There a
				large amount of <a href="/stats">stats and leaderboards</a> such
				as the unbeaten levels list, and most played levels list, and a
				managed list of the top levels and players.<br />
				We also have a community maintained
				<a href="https://grabvr.miraheze.org/wiki/.index">wiki page</a>
				hosted with miraheze, and a chrome extension to add some extra
				utility to the
				<a href="https://grabvr.quest/levels">level browser</a>.
			</p>
		</section>
		<section id="tools">
			<a class="button" href="/editor" target="_blank"
				>JSON Level Editor</a
			>
			<a class="button" href="/list">
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
				Drag these tools onto your bookmarks bar and click to run them
				while in the level browser.
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
		<section id="editor">
			<div>
				<h2>JSON Editor</h2>
				<p>
					The JSON Editor is a combined JSON and 3D level editor that
					lets you build, import, modify, or explore levels however
					you like. You can edit things directly in JSON, run scripts
					on nodes, or just grab objects in the 3D view and move,
					scale, animate, group, and more. It's built to make messing
					with levels easy without having to open the game, with tools
					for adding objects, images, videos, triggers, animations,
					and more.
				</p>
			</div>
			<img
				src="/images/thumbnails/json-editor.jpeg"
				alt="The JSON Editor"
			/>
		</section>
		<section id="state">
			<h2>Help</h2>
			<div id="socials">
				<a
					href="https://discordapp.com/users/649165311257608192"
					class="social"
				>
					<DiscordAltIcon />
					<span> @.index </span>
				</a>
				<a href="https://github.com/twhlynch" class="social">
					<GithubIcon />
					<span>@twhlynch</span>
				</a>
				<a href="https://youtube.com/@dotindex" class="social">
					<YoutubeIcon />
					<span> @dotindex </span>
				</a>
				<a href="mailto:tom@twhlynch.me" class="social">
					<MailIcon />
					<span> Email </span>
				</a>
			</div>
			<p>
				If you need help with anything, you should join the
				<a href="http://discord.grabvr.quest">discord server</a>, but
				feel free to contact me on any of my socials, or if you prefer,
				you can email me at tom@twhlynch.me.
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
#editor {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;

	> div {
		width: 100%;
	}

	img {
		width: 100%;
		border-radius: var(--border-radius);
		outline: 1px solid #fff4;
		margin: auto;
		max-width: 40ch;
	}
}
#state span,
#currentTime,
#currentState {
	color: var(--text-color-alt);
}
</style>
<style>
#tools {
	.ghl-icon svg,
	.ghl-icon {
		width: 21px;
		height: 21px;
		color: #ffdf5b;
	}
}
</style>
