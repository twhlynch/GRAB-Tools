<template>
	<section :ref="'templates'">
		<span
			class="title close"
			@click="
				() => {
					this.$emit('close');
				}
			"
			>Close</span
		>
		<div
			class="templates-section"
			v-for="[name, templates_list] in Object.entries(templates)"
			:key="name"
		>
			<span
				class="title"
				@click="
					() => {
						toggle(name);
					}
				"
				>{{ name }}</span
			>
			<div
				class="templates-group"
				v-show="this.active_sections.includes(name)"
			>
				<div
					class="template"
					v-for="(template, i) of templates_list"
					:key="i"
				>
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
			</div>
		</div>
	</section>
</template>

<script>
import { decodeLevel } from '@/assets/encoding/levels';
import { add_nodes } from '@/assets/encoding/utils';
import downloads from '@/assets/tools/downloads';

export default {
	methods: {
		set(json) {
			this.$emit('modifier', (_) => {
				return json;
			});
		},
		insert(json) {
			this.$emit('modifier', (level) => {
				add_nodes(level, json.levelNodes);
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
			const json = await decodeLevel(blob);
			return json;
		},
		toggle(name) {
			const index = this.active_sections.indexOf(name);
			if (index !== -1) {
				this.active_sections.splice(index, 1);
			} else {
				this.active_sections.push(name);
			}
		},
	},
	emits: ['modifier', 'close'],
	data() {
		return {
			active_sections: [],
			// prettier-ignore
			templates: {
				Lobbies: [
					// shops
					{ name: 'Shopping Center 1',             path: 'lobbies/shop/grab-shopping-center-1.level' },
					{ name: 'Shopping Center 2',             path: 'lobbies/shop/grab-shopping-center-2.level' },
					{ name: 'Shopping Center 2 (Halloween)', path: 'lobbies/shop/grab-shopping-center-2-halloween.level' },
					{ name: 'Shopping Center 2 (Christmas)', path: 'lobbies/shop/grab-shopping-center-2-christmas.level' },
					{ name: 'Shopping Center 3',             path: 'lobbies/shop/grab-shopping-center-3.level' },
					// post sublevels
					{ name: 'Lobby february (2026)',                 path: 'lobbies/lobby-february-2026.level' },
					{ name: 'Lobby january (2026)',                  path: 'lobbies/lobby-january-2026.level' },
					{ name: 'Lobby christmas (2025)',                path: 'lobbies/lobby-christmas-2025/lobby-christmas-2025.level' },
					{ name: 'Lobby christmas (extra) (2025)',        path: 'lobbies/lobby-christmas-2025/lobby-christmas-2025-extra.level' },
					{ name: 'Lobby november (2025)',                 path: 'lobbies/lobby-november-2025/lobby-november-2025.level' },
					{ name: 'Lobby november (castle) (2025)',        path: 'lobbies/lobby-november-2025/lobby-november-2025-castle.level' },
					{ name: 'Lobby halloween (2025)',                path: 'lobbies/lobby-halloween-2025/lobby-halloween-2025.level' },
					{ name: 'Lobby halloween (extra) (2025)',        path: 'lobbies/lobby-halloween-2025/lobby-halloween-2025-extra.level' },
					{ name: 'Lobby movie studio (2025)',             path: 'lobbies/lobby-movie-studio-2025/lobby-movie-studio-2025.level' },
					{ name: 'Lobby movie studio (minigames) (2025)', path: 'lobbies/lobby-movie-studio-2025/lobby-movie-studio-minigames-2025.level' },
					{ name: 'Lobby museum (2025)',                   path: 'lobbies/lobby-museum-2025/lobby-museum-2025.level' },
					{ name: 'Lobby museum (atrium) (2025)',          path: 'lobbies/lobby-museum-2025/lobby-museum-atrium-2025.level' },
					{ name: 'Lobby starship (2025)',                 path: 'lobbies/lobby-starship-2025/lobby-starship-2025.level' },
					{ name: 'Lobby starship (minigames) (2025)',     path: 'lobbies/lobby-starship-2025/lobby-starship-minigames-2025.level' },
					{ name: 'Lobby summer (2025)',                   path: 'lobbies/lobby-summer-2025/lobby-summer-2025.level' },
					{ name: 'Lobby summer (volcano) (2025)',         path: 'lobbies/lobby-summer-2025/lobby-summer-vulcano-2025.level' },
					{ name: 'Lobby gondola (2025)',                  path: 'lobbies/lobby-gondola-2025.level' },
					{ name: 'Lobby hub (2025)',                      path: 'lobbies/lobby-hub-2025/lobby-hub-2025.level' },
					{ name: 'Lobby hub (abstract) (2025)',           path: 'lobbies/lobby-hub-2025/lobby-abstract-2024.level' },
					{ name: 'Lobby hub (wild west) (2025)',          path: 'lobbies/lobby-hub-2025/lobby-wild-west-2024.level' },
					{ name: 'Lobby hub (christmas) (2025)',          path: 'lobbies/lobby-hub-2025/lobby-christmas-2023.level' },
					{ name: 'Lobby hub (easter) (2025)',             path: 'lobbies/lobby-hub-2025/lobby-easter-2023.level' },
					{ name: 'Lobby hub (summer) (2025)',             path: 'lobbies/lobby-hub-2025/lobby-summer-2023.level' },
					{ name: 'Lobby hub (temple) (2025)',             path: 'lobbies/lobby-hub-2025/lobby-temple.level' },
					{ name: 'Lobby hub (cave) (2025)',               path: 'lobbies/lobby-hub-2025/lobby-cave.level' },
					{ name: 'Lobby hub (treehouse) (2025)',          path: 'lobbies/lobby-hub-2025/lobby-treehouse.level' },
					// animations
					{ name: 'Lobby cave (2025)',           path: 'lobbies/lobby-cave-2025.level' },
					{ name: 'Lobby mall (2025)',           path: 'lobbies/lobby-mall-2025.level' },
					{ name: 'Lobby winter (2025)',         path: 'lobbies/lobby-winter-2025.level' },
					{ name: 'Lobby viking (2024)',         path: 'lobbies/lobby-viking-2024.level' },
					{ name: 'Lobby halloween (2024)',      path: 'lobbies/lobby-halloween-2024.level' },
					{ name: 'Lobby fantasy (2024)',        path: 'lobbies/lobby-fantasy-2024.level' },
					{ name: 'Lobby pirate (2024)',         path: 'lobbies/lobby-pirate-2024.level' },
					{ name: 'Lobby deepsea (2024)',        path: 'lobbies/lobby-deepsea-2024.level' },
					{ name: 'Lobby adventure (2024)',      path: 'lobbies/lobby-adventure-2024.level' },
					{ name: 'Lobby abstract (2024)',       path: 'lobbies/lobby-abstract-2024.level' },
					{ name: 'Lobby amusement park (2024)', path: 'lobbies/lobby-amusement-park-2024.level' },
					{ name: 'Lobby wild west (2024)',      path: 'lobbies/lobby-wild-west-2024.level' },
					// tester animated
					{ name: 'Lobby steampunk (animated) (2024)', path: 'lobbies/lobby-steampunk-2024-animated.level' },
					{ name: 'Lobby steampunk (2024)',            path: 'lobbies/lobby-steampunk-2024.level' },
					{ name: 'Lobby space (2024)',                path: 'lobbies/lobby-space-2024.level' },
					{ name: 'Lobby new year (2024)',             path: 'lobbies/lobby-new-year-2024.level' },
					{ name: 'Lobby christmas (2023)',            path: 'lobbies/lobby-christmas-2023.level' },
					{ name: 'Lobby best of grab (2023)',         path: 'lobbies/lobby-best-of-grab-2023.level' },
					{ name: 'Lobby halloween (2023)',            path: 'lobbies/lobby-halloween-2023.level' },
					{ name: 'Lobby castle (animated) (2023)',    path: 'lobbies/lobby-castle-2023-animated.level' },
					{ name: 'Lobby castle (2023)',               path: 'lobbies/lobby-castle-2023.level' },
					{ name: 'Lobby summer (animated) (2023)',    path: 'lobbies/lobby-summer-2023-animated.level' },
					{ name: 'Lobby summer (2023)',               path: 'lobbies/lobby-summer-2023.level' },
					{ name: 'Lobby floating islands (2023)',     path: 'lobbies/lobby-floating-islands-2023.level' },
					{ name: 'Lobby space (2023)',                path: 'lobbies/lobby-space.level' },
					{ name: 'Lobby easter (animated) (2023)',    path: 'lobbies/lobby-easter-2023-animated.level' },
					{ name: 'Lobby easter (2023)',               path: 'lobbies/lobby-easter-2023.level' },
					{ name: 'Lobby forest (animated) (2023)',    path: 'lobbies/lobby-forest-animated.level' },
					{ name: 'Lobby forest (2023)',               path: 'lobbies/lobby-forest.level' },
					{ name: 'Lobby winter (2023)',               path: 'lobbies/lobby-winter-2023.level' },
					{ name: 'Lobby christmas (animated) (2022)', path: 'lobbies/lobby-christmas-2022-animated.level' },
					{ name: 'Lobby christmas (2022)',            path: 'lobbies/lobby-christmas-2022.level' },
					{ name: 'Lobby restaurant (2022)',           path: 'lobbies/lobby-restaurant.level' },
					{ name: 'Lobby halloween (animated) (2022)', path: 'lobbies/lobby-halloween.level' },
					{ name: 'Lobby halloween (2022)',            path: 'lobbies/lobby-halloween_static.level' },
					// pre animations
					{ name: 'Lobby dojo (2022)',      path: 'lobbies/lobby-dojo.level' },
					{ name: 'Lobby beach (2022)',     path: 'lobbies/lobby-beach.level' },
					{ name: 'Lobby temple (2022)',    path: 'lobbies/lobby-temple.level' },
					{ name: 'Lobby cave (2022)',      path: 'lobbies/lobby-cave.level' },
					{ name: 'Lobby treehouse (2022)', path: 'lobbies/lobby-treehouse.level' },
					{ name: 'Lobby christmas (2021)', path: 'lobbies/lobby-christmas.level' },
					{ name: 'Lobby by rad (2021)',    path: 'lobbies/lobby.level' },
					// first ever
					{ name: "First lobby", path: 'first-lobby.level' },
				],
				Official: [
					{ name: 'New Editor',       path: 'new.level' },
					{ name: 'Easy 1',           path: 'official/10-easy-1.level' },
					{ name: 'Easy 2',           path: 'official/11-easy-2.level' },
					{ name: 'Easy 3',           path: 'official/12-easy-3.level' },
					{ name: 'Easy 4',           path: 'official/13-easy-4.level' },
					{ name: 'Easy 5',           path: 'official/14-easy-5.level' },
					{ name: 'Easy 6',           path: 'official/15-easy-6.level' },
					{ name: 'Easy tower',       path: 'official/20-easy-tower.level' },
					{ name: 'Death Tower',      path: 'official/30-death-tower.level' },
					{ name: 'BFL',              path: 'official/40-BFL-1.level' },
					{ name: 'First test level', path: 'official/100-test.level' },
				],
				Tutorial: [
					{ name: 'The Mountain',          identifier: '29r46v7djliny6t4rzvq7:1654257963' },
					{ name: 'Tutorial Playground',   identifier: '2axm4b3yypfhaaxp2q69g:1759616790' },
					{ name: 'Tutorial',              identifier: '29t798uon2urbra1f8w2q:1693775768' },
					{ name: 'Walking Basics',        identifier: '29t798uon2urbra1f8w2q:1699211235' },
					{ name: 'Jumping Basics',        identifier: '29t798uon2urbra1f8w2q:1705802960' },
					{ name: 'Ice Basics',            identifier: '2awf62f0y60gptc9cbecf:1699140058' },
					{ name: 'Grapple Basics',        identifier: '29v9vd6n9z45d16mi2o2n:1699139524' },
					{ name: 'Throwing Basics',       identifier: '2bckx8xvzyf3bplkkdcvk:1714411822' },
					{ name: 'Bouncing Basics',       identifier: '29rbyudpcet6wdy3iidd4:1714262860' },
					{ name: 'Gravity Zone Tutorial', identifier: '29zwujsnjq6iu1jqa4keo:1703930157' },
					{ name: 'Tutorial 1', path: 'official/1-tutorial-1.level' },
					{ name: 'Tutorial 2', path: 'official/2-tutorial-2.level' },
					{ name: 'Tutorial 3', path: 'official/3-tutorial-3.level' },
					{ name: 'Tutorial 4', path: 'official/4-tutorial-4.level' },
					{ name: 'Tutorial 5', path: 'official/5-tutorial-5.level' },
					{ name: 'Tutorial 6', path: 'official/6-tutorial-6.level' },
					{ name: 'Tutorial 7', path: 'official/7-tutorial-7.level' },
				],
				'Cheat Sheets': [
					{ name: 'Best modded colors',    identifier: '29sgp24f1uorbc6vq8d2k:1665319805' },
					{ name: 'Modded Lava',           identifier: '2aqk2f39o44nxz0yixbas:1735585432' },
					{ name: 'Animation Cheat Sheet', identifier: '29sgp24f1uorbc6vq8d2k:1696734550' },
				],
				Examples: [
					{ name: 'fire',             identifier: '2a4lsr3j8bypkewcx9s90:fire' },
					{ name: 'Blood in the ice', identifier: '2a4lsr3j8bypkewcx9s90:1691122081' },
				],
				Technical: [
					{ name: 'Rick Roll',   identifier: '29sgp24f1uorbc6vq8d2k:1696497039' },
					{ name: 'Tic-Tac-Toe', identifier: '29sgp24f1uorbc6vq8d2k:1740776204' },
					{ name: 'BAD APPLE!!', identifier: '29sgp24f1uorbc6vq8d2k:1696497038' },
				],
				Other: [
					{ name: 'animation test file', path: 'animtesting.level' },
					{ name: 'Trees',                      identifier: '29sgp24f1uorbc6vq8d2k:testchars' },
					{ name: 'FROSTYs climbing adventure', identifier: '29ffxg2ijqxyrgxyy2vjj:1642284195' },
				],
			},
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
	padding: 5px;
}
.title {
	background: var(--bg);
	border-radius: 5px;
	display: flex;
	flex-direction: row;
	gap: 5px;
	padding: 5px;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}
.close {
	color: var(--red);
	margin: 5px;
}
.templates-section {
	width: 100%;
	background-color: #141415;
	display: flex;
	flex-direction: column;
	gap: 5px;
	padding: 5px;
}
.templates-group {
	width: 100%;
	background-color: #141415;
	display: flex;
	flex-direction: column;
	gap: 5px;
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
