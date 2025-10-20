<script>
export default {
	data() {
		return {
			messages: [],
		};
	},

	created() {
		console.log('Cooking toast...');
		if (window.toast === undefined) {
			window.toast = (msg, severity = 'message') => {
				const message = {
					value: msg,
					id: Date.now() + Math.random(),
					severity: severity,
				};

				this.messages.push(message);
				console.log(message.value);

				setTimeout(() => {
					this.messages = this.messages.filter(
						(m) => m.id !== message.id,
					);
				}, 5000);
			};
		}
	},

	methods: {
		async copyMessage(message) {
			await navigator.clipboard.writeText(message.value);
		},
	},
};
</script>

<template>
	<transition-group class="toasts" name="toast" tag="div">
		<div
			v-for="message in this.messages"
			:key="message.id"
			:class="`toast toast-${message.severity}`"
			@click="copyMessage(message)"
		>
			{{ message.value }}
		</div>
	</transition-group>
</template>

<style scoped>
.toasts {
	position: fixed;
	bottom: 1rem;
	left: 1rem;
	z-index: 9999;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	align-items: flex-start;
	justify-content: flex-start;
}
.toast {
	background: var(--bg);
	border: 2px solid transparent;
	color: white;
	padding: 10px 20px;
	border-radius: 10px;
	opacity: 1;
	transition: opacity 0.3s ease, transform 0.3s ease;
	cursor: pointer;
	max-width: min(90svw, 50ch);

	&.toast-warning,
	&.toast-warn {
		border: 2px solid var(--yellow);
	}
	&.toast-error,
	&.toast-err {
		border: 2px solid var(--red);
	}
	&.toast-message,
	&.toast-info {
		border: 2px solid var(--blue);
	}
}

.toast-enter-active,
.toast-leave-active {
	transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}
</style>
