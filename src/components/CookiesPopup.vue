<script>
import IdnexCookieIcon from '@/icons/IdnexCookieIcon.vue';
import { useCookiesStore } from '@/stores/cookies';
import { mapActions, mapState } from 'pinia';

export default {
	components: {
		IdnexCookieIcon,
	},
	data() {
		return {
			decided: false,
		};
	},
	methods: {
		init_google_analytics() {
			const script = document.createElement('script');
			script.src = `https://www.googletagmanager.com/gtag/js?id=${this.$config.GOOGLE_TAG_ID}`;
			script.async = true;
			document.head.appendChild(script);

			script.onload = () => {
				window.dataLayer = window.dataLayer || [];
				function gtag() {
					window.dataLayer.push(arguments);
				}
				gtag('js', new Date());

				gtag('config', this.$config.GOOGLE_TAG_ID);
			};
		},

		close() {
			this.decided = true;
		},
		reject() {
			this.close();
			this.set_allow_cookies(false);
		},
		accept() {
			this.close();
			this.set_allow_cookies(true);
			this.init_google_analytics();
		},

		...mapActions(useCookiesStore, ['set_allow_cookies']),
	},
	computed: {
		...mapState(useCookiesStore, ['allow_cookies', 'timestamp']),
	},
	created() {
		if (this.allow_cookies) {
			this.close();
			this.init_google_analytics();
		} else if ((Date.now() - this.timestamp) / (24 * 60 * 60 * 1000) < 1) {
			this.close();
		}
	},
};
</script>

<template>
	<div v-if="!decided && !this.allow_cookies" class="cookie-popup">
		<div class="info">
			<p>
				I use cookies for analytics and error tracking. You can accept
				or reject non-essential cookies.
			</p>
			<IdnexCookieIcon title="Art by B34.TR1X" />
		</div>
		<div class="buttons">
			<button class="reject" @click="reject">No thanks, starve</button>
			<button class="accept" @click="accept">Feed me cookies!</button>
		</div>
	</div>
</template>

<style scoped>
.cookie-popup {
	font-size: 1.1rem;
	z-index: 3000;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	background: var(--bg);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem 0.8rem;
	border-radius: 1.5rem;
	width: max(30svw, 450px);
	max-width: 80svw;
}
.buttons {
	display: flex;
	flex-direction: row;
	gap: 1rem;
}
.info {
	display: flex;
	flex-direction: row;
	gap: 1rem;
	padding-inline: 0.8rem;
	align-items: center;
	justify-content: center;
}
@media screen and (max-width: 500px) {
	.info {
		flex-direction: column-reverse;
		text-align: center;

		span {
			width: 5rem;
		}
	}
	.buttons {
		flex-direction: column;
	}
}
button {
	height: 2rem;
	border-radius: 1rem;
	padding-inline: 1rem;
	width: 100%;
	color: white;
	line-height: 2rem;
	cursor: pointer;
}
.accept {
	background-color: var(--blue);
}
.reject {
	background-color: #fff2;
}
span {
	width: 12rem;
}
</style>
