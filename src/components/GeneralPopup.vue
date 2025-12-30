<script>
export default {
	props: {
		visible: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:visible'],
	methods: {
		sync(value) {
			const dialog = this.$refs.popup;
			if (!dialog) return;

			if (value && !dialog.open) dialog.showModal();
			if (!value && dialog.open) dialog.close();
		},
		close() {
			this.$emit('update:visible', false);
		},
	},
	mounted() {
		this.sync(this.visible);
	},
	watch: {
		visible(value) {
			this.sync(value);
		},
	},
};
</script>

<template>
	<dialog
		class="popup super-unique-popup-class"
		ref="popup"
		@close="close"
		@cancel="close"
		@keydown.esc="close"
		@click.self="close"
	>
		<div class="content">
			<slot />
		</div>
	</dialog>
</template>

<style scoped>
.popup {
	z-index: 3000;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: max(30svw, 450px);
	max-width: 80svw;
	background-color: transparent;

	.content {
		color: white;
		background: var(--bg);
		padding: 1rem 0.8rem;
		border-radius: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	&::backdrop {
		background-color: #000d;
		opacity: 0.75;
	}
}
:global(.super-unique-popup-class button) {
	height: 2rem;
	border-radius: 1rem;
	padding-inline: 1rem;
	width: 100%;
	color: white;
	line-height: 2rem;
	cursor: pointer;
	background-color: var(--blue);
}
</style>
