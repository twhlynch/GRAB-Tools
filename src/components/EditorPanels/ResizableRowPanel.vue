<script>
export default {
	emits: ['resize'],
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
				this.size(e.clientX);
			}
		},
		size(position = undefined) {
			const { container, first, second, thumb } = this.$refs;
			if (position === undefined)
				position = thumb.getBoundingClientRect().left;
			const bounds = container.getBoundingClientRect();
			first.style.width = position - bounds.left + 'px';
			second.style.width =
				bounds.width - (position - bounds.left) - 5 + 'px';
			this.$emit('resize');
		},
		prevent(e) {
			e.preventDefault();
		},
		resize() {
			const { thumb } = this.$refs;
			const position = thumb.getBoundingClientRect().left;
			this.size(position);
		},
	},
};
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
	flex-direction: row;
}
.first,
.second {
	height: 100%;
	width: 50%;
}
.second {
	width: calc(50% - 5px);
}
.thumb {
	height: 100%;
	background: #424243;
	width: 5px;
	cursor: col-resize;
}
</style>
