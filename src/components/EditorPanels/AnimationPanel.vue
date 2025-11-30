<script>
import PauseIcon from '@/icons/PauseIcon.vue';
import PlayIcon from '@/icons/PlayIcon.vue';

export default {
	data() {
		return {
			max: 0,
			time: 0,
			dragging: false,
			playing: true,
			was_playing: true,
		};
	},
	components: {
		PlayIcon,
		PauseIcon,
	},
	emits: ['scope'],
	methods: {
		scope(func) {
			this.$emit('scope', func);
		},
		set_level(level) {
			const animation_times = level.nodes.animated.map((object) => {
				const animation = object?.userData?.node?.animations?.[0];
				const frames = animation?.frames;
				if (frames?.length) {
					const last_time = frames[frames.length - 1].time ?? 0;
					const speed = animation.speed ?? 0;
					return last_time * speed;
				}

				return 0;
			});

			this.max = Math.max(0, ...animation_times);
		},
		set_time(time) {
			if (!this.dragging) {
				this.time = time % this.max;
			}
		},
		toggle() {
			this.playing = !this.playing;
			this.scope((scope) => {
				if (!this.is_animating && this.playing) {
					scope.gizmo.clear(scope.editing_parent);
				}
				scope.is_animating = this.playing;
			});
		},
		change(e) {
			this.time = parseFloat(e.target.value);
			this.scope((scope) => {
				scope.set_time(this.time);
			});
		},
		down() {
			this.dragging = true;
			this.scope((scope) => {
				this.was_playing = scope.is_animating;
				scope.is_animating = false;
			});
		},
		up() {
			this.dragging = false;
			this.scope((scope) => {
				scope.is_animating = this.was_playing && this.playing;
			});
		},
	},
};
</script>

<template>
	<section>
		<div class="timeline">
			<div @click="toggle">
				<PauseIcon v-if="playing" />
				<PlayIcon v-else />
			</div>
			<input
				@input="change"
				@mousedown="down"
				@mouseup="up"
				type="range"
				min="0"
				:max="max"
				step="0.01"
				:value="time"
			/>
		</div>
	</section>
</template>

<style scoped>
section {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	background-color: #141415;
}

.timeline {
	width: 100%;
	height: 30px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	gap: 5px;
	padding-inline: 5px;

	> div {
		height: 100%;
		aspect-ratio: 2 / 3;
		padding: 2px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			color: var(--text-color-accent);
		}
	}

	input {
		width: 100%;
		margin-inline: 10px;
		padding-inline: 5px;
		height: 2px;
		-webkit-appearance: none;
		appearance: none;
		background: #777;
		cursor: pointer;
	}

	input[type='range'] {
		height: 2px;
		-webkit-appearance: none;
		appearance: none;
		background: #777;
		cursor: pointer;
	}
	input[type='range']:focus {
		outline: none;
	}
	input[type='range']::-webkit-slider-runnable-track,
	input[type='range']::-moz-range-track {
		height: 2px;
		background-color: #a3a3a3;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background-color: #aaa;
		height: 14px;
		width: 10px;
		border-radius: 5px;
	}
	input[type='range']::-moz-range-thumb {
		border: none;
		border-radius: 0;
		background-color: #aaa;
		height: 14px;
		width: 10px;
		border-radius: 5px;
	}
	input[type='range']:focus::-webkit-slider-thumb,
	input[type='range']:focus::-moz-range-thumb {
		outline: none;
	}
}
</style>
