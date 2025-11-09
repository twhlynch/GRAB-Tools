<script>
export default {
	data() {
		return {
			down: false,
		};
	},
	mounted() {
		document.addEventListener('mouseup', this.mouseup);
		document.addEventListener('mousemove', this.mousemove);
		window.addEventListener('resize', this.resize);
	},
	unmounted() {
		document.removeEventListener('mouseup', this.mouseup);
		document.removeEventListener('mousemove', this.mousemove);
		window.removeEventListener('resize', this.resize);
	},
	methods: {
		mousedown(_) {
			this.down = true;
			document.addEventListener('selectstart', this.prevent);
		},
		mouseup(_) {
			this.down = false;
			document.removeEventListener('selectstart', this.prevent);
		},
		mousemove(e) {
			if (this.down) {
				this.size(e.clientY);
			}
		},
		size(position) {
			const { container, first, second } = this.$refs;
			const bounds = container.getBoundingClientRect();
			first.style.height =
				Math.max(bounds.height * 0.1, position - bounds.top) + 'px';
			second.style.height =
				Math.max(
					bounds.height * 0.1,
					bounds.height - (position - bounds.top),
				) -
				5 +
				'px';
		},
		prevent(e) {
			e.preventDefault();
		},
		resize() {
			const { thumb } = this.$refs;
			const position = thumb.getBoundingClientRect().top;
			this.size(position);
		},
	},
};
</script>

<template>
	<section class="container" :ref="'container'">
		<div class="first" :ref="'first'">
			<slot name="first" />
		</div>
		<div class="thumb" :ref="'thumb'" @mousedown="mousedown"></div>
		<div class="second" :ref="'second'">
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
