<script>
import ShrinkIcon from '@/icons/ShrinkIcon.vue';
import BrushIcon from '@/icons/BrushIcon.vue';
import DownloadsIcon from '@/icons/DownloadsIcon.vue';
import PalletteIcon from '@/icons/PalletteIcon.vue';
import XMLIcon from '@/icons/XMLIcon.vue';
import ChatIcon from '@/icons/ChatIcon.vue';
import CubeIcon from '@/icons/CubeIcon.vue';
import GrowIcon from '@/icons/GrowIcon.vue';
import PlayIcon from '@/icons/PlayIcon.vue';

import Bookmarklet from '@/components/Bookmarklet.vue';

import LevelCompiler from '@/tools/LevelCompiler.vue';
import ImageGenerator from '@/tools/ImageGenerator.vue';
import VideoGenerator from '@/tools/VideoGenerator.vue';
import SVGDrawer from '@/tools/SVGDrawer.vue';
import LevelJSON from '@/tools/LevelJSON.vue';

export default {
	components: {
		Bookmarklet,
		LevelCompiler,
		ImageGenerator,
		VideoGenerator,
		SVGDrawer,
		LevelJSON,
		ShrinkIcon,
		BrushIcon,
		DownloadsIcon,
		PalletteIcon,
		XMLIcon,
		ChatIcon,
		CubeIcon,
		GrowIcon,
		PlayIcon,
	},
	methods: {
		setTab(tab) {
			const urlParams = new URLSearchParams(window.location.search);
			urlParams.set('tab', tab);
			window.history.replaceState(
				{},
				'',
				`${location.pathname}?${urlParams}`,
			);
		},
		selectTool(tool) {
			this.setTab(tool);

			document.querySelectorAll('.active-tool').forEach((e) => {
				e.classList.remove('active-tool');
			});
			document.querySelectorAll('.active-tool-button').forEach((e) => {
				e.classList.remove('active-tool-button');
			});

			const toolComponent = document.getElementById(`${tool}-tool`);
			const toolButton = document.getElementById(`${tool}-tool-button`);

			toolComponent.classList.add('active-tool');
			toolButton.classList.add('active-tool-button');
		},
	},
	created() {
		document.title = 'Tools | GRAB Tools';
	},
	mounted() {
		const urlParams = new URLSearchParams(window.location.search);
		const tab = urlParams.get('tab');
		if (tab) {
			this.selectTool(tab);
		}
	},
};
</script>

<template>
	<main>
		<section id="tools-section">
			<h2>Tools</h2>
			<p>
				Individual tools to from the JSON Level Editor and some extra
				tools for level creation or account modding.
			</p>
		</section>
		<section id="tools-buttons">
			<button
				class="button"
				id="level-compiler-tool-button"
				@click="selectTool('level-compiler')"
			>
				Compiler
				<ShrinkIcon />
			</button>
			<button
				class="button"
				id="image-generator-tool-button"
				@click="selectTool('image-generator')"
			>
				Pixel Art
				<BrushIcon />
			</button>
			<button
				class="button"
				id="svg-tool-button"
				@click="selectTool('svg')"
			>
				Draw SVG
				<BrushIcon />
			</button>
			<button
				class="button"
				id="video-generator-tool-button"
				@click="selectTool('video-generator')"
			>
				Video Gen
				<PlayIcon />
			</button>
			<button
				class="button"
				id="download-tool-button"
				@click="selectTool('download')"
			>
				Download
				<DownloadsIcon />
			</button>
			<button
				class="button"
				id="custom-colors-tool-button"
				@click="selectTool('custom-colors')"
			>
				Custom Colors
				<PalletteIcon />
			</button>
			<button
				class="button"
				id="level-json-tool-button"
				@click="selectTool('level-json')"
			>
				JSON
				<XMLIcon />
			</button>
			<button
				class="button"
				id="text-to-sign-tool-button"
				@click="selectTool('text-to-sign')"
			>
				Text To Sign
				<ChatIcon />
			</button>
			<button
				class="button"
				id="point-cloud-tool-button"
				@click="selectTool('point-cloud')"
			>
				Point Cloud
				<CubeIcon />
			</button>
			<button
				class="button"
				id="explode-tool-button"
				@click="selectTool('explode')"
			>
				Explode
				<GrowIcon />
			</button>
		</section>
		<section id="tools">
			<LevelCompiler id="level-compiler-tool" />
			<VideoGenerator id="video-generator-tool" />
			<SVGDrawer id="svg-tool" />
			<LevelJSON id="level-json-tool" />
			<ImageGenerator id="image-generator-tool" />
			<div id="custom-colors-tool">
				<h2>Custom Colors</h2>
				<p>
					Drag this to your bookmarks bar or click it to copy it and
					paste it into a bookmark. Then go to
					<a href="https://grabvr.quest/levels">the level browser</a>,
					log in, and click it to run.
				</p>
				<div id="bookmark-links">
					<Bookmarklet
						class="button"
						:script="'CustomColors.js'"
						:name="'Custom Color Picker'"
					/>
				</div>
			</div>
		</section>
	</main>
</template>

<style>
#tools {
	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	> div {
		display: none;
	}
	> div.active-tool {
		display: flex;
	}
	input,
	textarea,
	select {
		padding: 5px;
		background-color: #5f8cc235;
		border: solid 2px #4683ce70;
		border-radius: 5px;
		outline: none;
		width: 100%;
	}
	h2 {
		color: #2976d4;
		margin-bottom: 0;
	}
}
</style>
<style scoped>
#tools-buttons {
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
	flex-direction: column;
	align-items: center;
	gap: 5px;
}
.active-tool-button {
	background-color: #5f8cc235;
	border: solid 2px #4683ce70;
}
</style>
