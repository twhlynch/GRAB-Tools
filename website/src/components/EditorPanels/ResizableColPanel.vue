<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: {
		resize: () => true,
	},
	data() {
		return {
			down: false,
			remove_events: undefined as (() => void) | undefined,
		};
	},
	mounted() {
		const mouseup = this.mouseup.bind(this);
		const mousemove = this.mousemove.bind(this);
		const resize = this.resize.bind(this);
		document.addEventListener('mouseup', mouseup);
		document.addEventListener('mousemove', mousemove);
		window.addEventListener('resize', resize);
		this.remove_events = () => {
			document.removeEventListener('mouseup', mouseup);
			document.removeEventListener('mousemove', mousemove);
			window.removeEventListener('resize', resize);
		};
	},
	unmounted() {
		this.remove_events?.();
		document.removeEventListener('selectstart', this.prevent);
	},
	methods: {
		mousedown(_: MouseEvent) {
			this.down = true;
			document.addEventListener('selectstart', this.prevent);
		},
		mouseup(_: MouseEvent) {
			this.down = false;
			document.removeEventListener('selectstart', this.prevent);
		},
		mousemove(e: MouseEvent) {
			if (this.down) {
				this.size(e.clientY);
			}
		},
		size(position?: number) {
			const { container, first, second, thumb } = this.$refs as Record<string, HTMLElement>;
			position ??= thumb!.getBoundingClientRect().top;
			const bounds = container!.getBoundingClientRect();
			first!.style.height = position - bounds.top + 'px';
			second!.style.height = bounds.height - (position - bounds.top) - 5 + 'px';
			this.$emit('resize');
		},
		prevent(this: void, e: Event) {
			e.preventDefault();
		},
		resize() {
			const thumb = this.$refs.thumb as HTMLElement;
			const position = thumb.getBoundingClientRect().top;
			this.size(position);
		},
	},
});
</script>

<template>
	<section :ref="'container'" class="container">
		<div :ref="'first'" class="first">
			<slot name="first" />
		</div>
		<div :ref="'thumb'" class="thumb" @mousedown="mousedown"></div>
		<div :ref="'second'" class="second">
			<slot name="second" />
		</div>
	</section>
</template>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
}
.first,
.second {
	width: 100%;
	height: 50%;
}
.second {
	height: calc(50% - 5px);
}
.thumb {
	width: 100%;
	background: #424243;
	height: 5px;
	cursor: row-resize;
}
</style>
