<template>
	<section :ref="'templates'">
		<div class="template" v-for="(template, i) of templates" :key="i">
			<span class="name">{{ template.name }}</span>
			<button
				class="open"
				@click="
					() => {
						open(template);
					}
				"
			>
				Open
			</button>
			<button
				class="add"
				@click="
					() => {
						add(template);
					}
				"
			>
				Insert
			</button>
		</div>
	</section>
</template>

<script>
import downloads from '@/assets/tools/downloads';
import encoding from '@/assets/tools/encoding';

export default {
	methods: {
		set(json) {
			this.$emit('modifier', (_) => {
				return json;
			});
		},
		insert(json) {
			this.$emit('modifier', (level) => {
				level.levelNodes.push(...json.levelNodes);
				return level;
			});
		},
		async open(template) {
			const level = await this.load(template);
			if (!level) return;
			this.set(level);
		},
		async add(template) {
			const level = await this.load(template);
			if (!level) return;
			this.insert(level);
		},
		async download(template) {
			if (template.identifier) {
				return await downloads.download_level(template.identifier);
			} else if (template.path) {
				const response = await fetch(`levels/${template.path}`);

				if (response.status !== 200) {
					window.toast(`Error: Failed to download`, 'error');
					return null;
				}

				return await response.arrayBuffer();
			}
		},
		async load(template) {
			let level = await this.download(template);
			if (!level) return null;

			const blob = new Blob([level], {
				type: 'application/octet-stream',
			});
			const json = await encoding.decodeLevel(blob);
			return json;
		},
	},
	emits: ['modifier'],
	data() {
		return {
			templates: [
				{
					name: 'Animation Cheat Sheet',
					identifier: '29sgp24f1uorbc6vq8d2k:1696734550',
				},
				{
					name: 'animation test file',
					path: 'animtesting.level',
				},
				{
					name: 'New Editor',
					path: 'new.level',
				},
				{
					name: 'Best modded colors',
					identifier: '29sgp24f1uorbc6vq8d2k:1665319805',
				},
				{
					name: 'Modded Lava',
					identifier: '2aqk2f39o44nxz0yixbas:1735585432',
				},
				{
					name: 'The Mountain',
					identifier: '29r46v7djliny6t4rzvq7:1654257963',
				},
				{
					name: 'Tutorial',
					identifier: '29t798uon2urbra1f8w2q:1693775768',
				},
				{
					name: 'GRAB Shopping Center',
					path: 'lobbies/grab-shopping-center.level',
				},
				{
					name: 'Lobby november castle 2025',
					path: 'lobbies/lobby-november-2025-castle.level',
				},
				{
					name: 'Lobby november 2025',
					path: 'lobbies/lobby-november-2025.level',
				},
				{
					name: 'Lobby halloween extra 2025',
					path: 'lobbies/lobby-halloween-2025-extra.level',
				},
				{
					name: 'Lobby halloween 2025',
					path: 'lobbies/lobby-halloween-2025.level',
				},
				{
					name: 'Lobby movie studio minigames 2025',
					path: 'lobbies/lobby-movie-studio-minigames-2025.level',
				},
				{
					name: 'Lobby movie studio 2025',
					path: 'lobbies/lobby-movie-studio-2025.level',
				},
				{
					name: 'Lobby museum atrium 2025',
					path: 'lobbies/lobby-museum-atrium-2025.level',
				},
				{
					name: 'Lobby museum 2025',
					path: 'lobbies/lobby-museum-2025.level',
				},
				{
					name: 'Lobby starship minigames 2025',
					path: 'lobbies/lobby-starship-minigames-2025.level',
				},
				{
					name: 'Lobby starship 2025',
					path: 'lobbies/lobby-starship-2025.level',
				},
				{
					name: 'Lobby summer volcano 2025',
					path: 'lobbies/lobby-summer-vulcano-2025.level',
				},
				{
					name: 'Lobby summer 2025',
					path: 'lobbies/lobby-summer-2025.level',
				},
				{
					name: 'Lobby gondola 2025',
					path: 'lobbies/lobby-gondola-2025.level',
				},
				{
					name: 'Lobby hub 2025',
					path: 'lobbies/lobby-hub-2025.level',
				},
				{
					name: 'Lobby cave 2025',
					path: 'lobbies/lobby-cave-2025.level',
				},
				{
					name: 'Lobby mall 2025',
					path: 'lobbies/lobby-mall-2025.level',
				},
				{
					name: 'Lobby winter 2025',
					path: 'lobbies/lobby-winter-2025.level',
				},
				{
					name: 'Lobby viking 2024',
					path: 'lobbies/lobby-viking-2024.level',
				},
				{
					name: 'Lobby halloween 2024',
					path: 'lobbies/lobby-halloween-2024.level',
				},
				{
					name: 'Lobby fantasy 2024',
					path: 'lobbies/lobby-fantasy-2024.level',
				},
				{
					name: 'Lobby pirate 2024',
					path: 'lobbies/lobby-pirate-2024.level',
				},
				{
					name: 'Lobby deepsea 2024',
					path: 'lobbies/lobby-deepsea-2024.level',
				},
				{
					name: 'Lobby adventure 2024',
					path: 'lobbies/lobby-adventure-2024.level',
				},
				{
					name: 'Lobby abstract 2024',
					path: 'lobbies/lobby-abstract-2024.level',
				},
				{
					name: 'Lobby amusement park 2024',
					path: 'lobbies/lobby-amusement-park-2024.level',
				},
				{
					name: 'Lobby wild west 2024',
					path: 'lobbies/lobby-wild-west-2024.level',
				},
				{
					name: 'Lobby steampunk (animated) 2024',
					path: 'lobbies/lobby-steampunk-animated-2024.level',
				},
				{
					name: 'Lobby steampunk 2024',
					path: 'lobbies/lobby-steampunk-2024.level',
				},
				{
					name: 'Lobby space 2024',
					path: 'lobbies/lobby-space-2024.level',
				},
				{
					name: 'Lobby new year 2024',
					path: 'lobbies/lobby-new-year-2024.level',
				},
				{
					name: 'Lobby christmas (animated) 2023',
					path: 'lobbies/lobby-christmas-animated-2023.level',
				},
				{
					name: 'Lobby christmas 2023',
					path: 'lobbies/lobby-christmas-2023.level',
				},
				{
					name: 'Lobby best of grab 2023',
					path: 'lobbies/lobby-best-of-grab-2023.level',
				},
				{
					name: 'Lobby halloween (animated) 2023',
					path: 'lobbies/lobby-halloween-animated-2023.level',
				},
				{
					name: 'Lobby halloween 2023',
					path: 'lobbies/lobby-halloween-2023.level',
				},
				{
					name: 'Lobby castle (animated) 2023',
					path: 'lobbies/lobby-castle-animated-2023.level',
				},
				{
					name: 'Lobby castle 2023',
					path: 'lobbies/lobby-castle-2023.level',
				},
				{
					name: 'Lobby summer (animated) 2023',
					path: 'lobbies/lobby-summer-animated-2023.level',
				},
				{
					name: 'Lobby summer 2023',
					path: 'lobbies/lobby-summer-2023.level',
				},
				{
					name: 'Lobby floating islands 2023',
					path: 'lobbies/lobby-floating-islands-2023.level',
				},
				{
					name: 'Lobby space 2023',
					path: 'lobbies/lobby-space-2023.level',
				},
				{
					name: 'Lobby easter (animated) 2023',
					path: 'lobbies/lobby-easter-animated-2023.level',
				},
				{
					name: 'Lobby easter 2023',
					path: 'lobbies/lobby-easter-2023.level',
				},
				{
					name: 'Lobby forest (animated) 2023',
					path: 'lobbies/lobby-forest-animated-2023.level',
				},
				{
					name: 'Lobby winter 2023',
					path: 'lobbies/lobby-winter-2023.level',
				},
				{
					name: 'Lobby christmas (animated) 2022',
					path: 'lobbies/lobby-christmas-animated-2022.level',
				},
				{
					name: 'Lobby christmas 2022',
					path: 'lobbies/lobby-christmas-2022.level',
				},
				{
					name: 'Lobby restaurant 2022',
					path: 'lobbies/lobby-restaurant-2022.level',
				},
				{
					name: 'Lobby halloween 2022',
					path: 'lobbies/lobby-halloween-2022.level',
				},
				{
					name: 'Lobby dojo 2022',
					path: 'lobbies/lobby-dojo-2022.level',
				},
				{
					name: 'Lobby beach 2022',
					path: 'lobbies/lobby-beach-2022.level',
				},
				{
					name: 'Lobby temple 2022',
					path: 'lobbies/lobby-temple-2022.level',
				},
				{
					name: 'Lobby cave 2022',
					path: 'lobbies/lobby-cave-2022.level',
				},
				{
					name: 'Lobby treehouse 2022',
					path: 'lobbies/lobby-treehouse-2022.level',
				},
				{
					name: 'Lobby christmas 2021',
					path: 'lobbies/lobby-christmas-2021.level',
				},
				{
					name: 'Lobby by rad 2021',
					path: 'lobbies/lobby-original-2021.level',
				},
				{
					name: "First 'lobby'",
					path: 'lobbies/first-lobby.level',
				},
				{
					name: 'Tutorial 1',
					path: 'official/1-tutorial-1.level',
				},
				{
					name: 'Tutorial 2',
					path: 'official/2-tutorial-2.level',
				},
				{
					name: 'Tutorial 3',
					path: 'official/3-tutorial-3.level',
				},
				{
					name: 'Tutorial 4',
					path: 'official/4-tutorial-4.level',
				},
				{
					name: 'Tutorial 5',
					path: 'official/5-tutorial-5.level',
				},
				{
					name: 'Tutorial 6',
					path: 'official/6-tutorial-6.level',
				},
				{
					name: 'Tutorial 7',
					path: 'official/7-tutorial-7.level',
				},
				{
					name: 'Easy 1',
					path: 'official/10-easy-1.level',
				},
				{
					name: 'Easy 2',
					path: 'official/11-easy-2.level',
				},
				{
					name: 'Easy 3',
					path: 'official/12-easy-3.level',
				},
				{
					name: 'Easy 4',
					path: 'official/13-easy-4.level',
				},
				{
					name: 'Easy 5',
					path: 'official/14-easy-5.level',
				},
				{
					name: 'Easy 6',
					path: 'official/15-easy-6.level',
				},
				{
					name: 'Easy tower',
					path: 'official/20-easy-tower.level',
				},
				{
					name: 'Death Tower',
					path: 'official/30-death-tower.level',
				},
				{
					name: 'BFL',
					path: 'official/40-BFL-1.level',
				},
				{
					name: 'first test level',
					path: 'official/100-test.level',
				},
				{
					name: 'Trees',
					identifier: '29sgp24f1uorbc6vq8d2k:testchars',
				},
				{
					name: 'Rick Roll',
					identifier: '29sgp24f1uorbc6vq8d2k:1696497039',
				},
				{
					name: 'Tic-Tac-Toe',
					identifier: '29sgp24f1uorbc6vq8d2k:1740776204',
				},
				{
					name: 'BAD APPLE!!',
					identifier: '29sgp24f1uorbc6vq8d2k:1696497038',
				},
				{
					name: 'FROSTYs climbing adventure',
					identifier: '29ffxg2ijqxyrgxyy2vjj:1642284195',
				},
				{
					name: 'fire',
					identifier: '2a4lsr3j8bypkewcx9s90:fire',
				},
				{
					name: 'Blood in the ice',
					identifier: '2a4lsr3j8bypkewcx9s90:1691122081',
				},
			],
		};
	},
};
</script>

<style scoped>
section {
	width: 100%;
	height: 100%;
	background-color: #141415;
	max-height: 100%;
	overflow-y: scroll;
	display: flex;
	flex-direction: column;
	gap: 5px;
	padding: 5px;
}
.template {
	background: var(--bg);
	border-radius: 5px;
	display: flex;
	flex-direction: row;
	gap: 5px;
	padding: 5px;
	align-items: center;
	justify-content: center;
}
.name {
	margin-right: auto;
	max-width: 100%;
	overflow-x: scroll;
}
button {
	background-color: var(--text-color-default);
	padding: 5px;
	border-radius: 5px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}
</style>
