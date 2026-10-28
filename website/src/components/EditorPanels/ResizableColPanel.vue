<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: {
		resize: () => true,
	},
	data() {
		return {
			down: false,
			bound_mouseup: undefined as ((e: MouseEvent) => void) | undefined,
			bound_mousemove: undefined as ((e: MouseEvent) => void) | undefined,
			bound_resize: undefined as (() => void) | undefined,
			bound_prevent: undefined as ((e: Event) => void) | undefined,
		};
	},
	created() {
		this.bound_mouseup = (e: MouseEvent) => {
			this.mouseup(e);
		};
		this.bound_mousemove = (e: MouseEvent) => {
			this.mousemove(e);
		};
		this.bound_resize = () => {
			this.resize();
		};
		this.bound_prevent = (e: Event) => {
			this.prevent(e);
		};
	},
	mounted() {
		if (this.bound_mouseup) document.addEventListener('mouseup', this.bound_mouseup);
		if (this.bound_mousemove) document.addEventListener('mousemove', this.bound_mousemove);
		if (this.bound_resize) window.addEventListener('resize', this.bound_resize);
	},
	unmounted() {
		if (this.bound_mouseup) document.removeEventListener('mouseup', this.bound_mouseup);
		if (this.bound_mousemove) document.removeEventListener('mousemove', this.bound_mousemove);
		if (this.bound_resize) window.removeEventListener('resize', this.bound_resize);
		if (this.bound_prevent) document.removeEventListener('selectstart', this.bound_prevent);
	},
	methods: {
		mousedown(_: MouseEvent) {
			this.down = true;
			if (this.bound_prevent) document.addEventListener('selectstart', this.bound_prevent);
		},
		mouseup(_: MouseEvent) {
			this.down = false;
			if (this.bound_prevent) document.removeEventListener('selectstart', this.bound_prevent);
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
		prevent(e: Event) {
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
