<script lang="ts">
import { Severity } from '@/types/overrides';
import { captureException, captureMessage } from '@sentry/vue';
import { defineComponent, Reactive, reactive } from 'vue';

export interface Message {
	value: string;
	error: Error | null;
	id: number;
	severity: Severity;
}

export default defineComponent({
	data() {
		return {
			messages: [] as Reactive<Message>[],
		};
	},

	created() {
		console.log('Cooking toast...');
		(window.toast as typeof window.toast | undefined) ??= (
			msg,
			severity = 'message',
			persistent = false,
		) => {
			const is_error = msg instanceof Error;
			const message = reactive({
				value: is_error ? msg.message : msg,
				error: is_error ? msg : null,
				id: Date.now() + Math.random(),
				severity: severity,
			});

			this.messages.push(message);
			console.log(message.value);
			console.log(message.error);

			const remove = () => {
				this.messages = this.messages.filter((m) => m.id !== message.id);
			};

			if (persistent) {
				return { remove, message };
			} else {
				setTimeout(remove, 5000);
			}
		};
	},

	methods: {
		async copyMessage(message: Message) {
			await navigator.clipboard.writeText(message.value);

			if (message.severity == 'error') {
				if (message.error) {
					captureException(message.error);
				} else {
					captureMessage(message.value);
				}
			}
		},
	},
});
</script>

<template>
	<transition-group class="toasts" name="toast" tag="div">
		<div
			v-for="message in messages"
			:key="message.id"
			:class="`toast toast-${message.severity}`"
			@click="copyMessage(message)"
		>
			<span>{{ message.value }}</span>
			<span v-if="message.severity == 'error'" class="extra">
				Click to copy and report this error to the discord server if you believe it is not
				your fault.
			</span>
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
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
	cursor: pointer;
	max-width: min(90svw, 50ch);

	&.toast-warning {
		border: 2px solid var(--yellow);
	}
	&.toast-error,
	&.toast-misuse {
		border: 2px solid var(--red);
	}
	&.toast-message {
		border: 2px solid var(--blue);
	}
}

.toast-enter-active,
.toast-leave-active {
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

span {
	display: block;
}
.extra {
	opacity: 0.3;
	font-size: 0.9rem;
}
</style>
