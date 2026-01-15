<script>
import encoding from '@/assets/tools/encoding';
import StatsIcon from '@/icons/StatsIcon.vue';

export default {
	components: {
		StatsIcon,
	},
	data() {
		return {
			statistics: {
				Objects: 0,
				Complexity: 0,
				'JSON Lines': 0,
				Animations: 0,
				Connections: 0,
				Frames: 0,
			},
			extra_statistics: {},
			show_extra: false,
		};
	},
	methods: {
		set_level(level) {
			this.statistics.Complexity = level.complexity;
			this.statistics.Animations = level.nodes.animated.flatMap(
				(object) => object.userData.node.animations,
			).length;
			this.statistics.Connections = level.nodes.levelNodeTrigger.flatMap(
				(object) =>
					object.userData.node.levelNodeTrigger.triggerTargets,
			).length;
			this.statistics.Frames = level.nodes.animated.flatMap((object) =>
				object.userData.node.animations.flatMap(
					(animation) => animation.frames,
				),
			).length;
			this.statistics['JSON Lines'] = JSON.stringify(
				level.level,
				null,
				1,
			).split('\n').length;
			this.statistics.Objects = level.nodes.all.length;

			for (const key in level.nodes) {
				if (key.includes('levelNode')) {
					this.extra_statistics[`${key.replace('levelNode', '')}`] =
						level.nodes[key].length;
				}
			}

			for (const shape in level.nodes.shape) {
				if (shape >= 1000) {
					let name = Object.keys(encoding.shapes()).find(
						(k) => encoding.shapes()[k] == shape,
					);
					if (!name) continue;
					name = name.charAt(0) + name.toLowerCase().slice(1);
					this.extra_statistics[`${name} (${shape})`] =
						level.nodes.shape[shape].length;
				}
			}

			for (const material in level.nodes.material) {
				let name = Object.keys(encoding.materials()).find(
					(k) => encoding.materials()[k] == material,
				);
				if (!name || material == encoding.materials().TRIGGER) continue;
				name = name.charAt(0) + name.toLowerCase().slice(1);
				this.extra_statistics[`${name} (${material})`] =
					level.nodes.material[material].length;
			}
		},
		click() {
			this.show_extra = !this.show_extra;
		},
	},
};
</script>

<template>
	<section id="statistics-panel">
		<button @click="click">
			<StatsIcon class="stats-icon" />
		</button>
		<div
			v-for="[key, value] of Object.entries(statistics)"
			:key="key"
			class="statistic"
		>
			<span>{{ key }}</span>
			:
			<span>{{ value }}</span>
		</div>
		<div v-show="show_extra" class="extra">
			<div
				v-for="[key, value] of Object.entries(extra_statistics)"
				:key="key"
			>
				<span>{{ key }}</span>
				:
				<span>{{ value }}</span>
			</div>
		</div>
	</section>
</template>

<style scoped>
.stats-icon {
	width: 80%;
	height: 80%;
}
#statistics-panel > button {
	cursor: pointer;
	color: var(--text-color-default);
}
section {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: row;
	gap: 0.1rem;
}
.extra {
	display: flex;
	flex-direction: column;
	position: absolute;
	left: 0.2rem;
	bottom: 1.2rem;
	color: white;
}
button {
	height: 100%;
	aspect-ratio: 1 / 1;
	background-color: var(--bg);
}
.statistic {
	height: 100%;
	border-right: 1px solid #fff3;
	padding-inline: 0.5rem;
}
</style>
