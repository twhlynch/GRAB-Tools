<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';
import GeneralPopup from './GeneralPopup.vue';
import { verify_account_request } from '@/requests/VerifyAccountRequest';
import { verification_code_request } from '@/requests/VerificationCodeRequest';

export default {
	components: {
		GeneralPopup,
	},
	methods: {
		logout() {
			const userStore = useUserStore();
			userStore.logout();
		},
		select_tab(tab) {
			this.tab = tab;
		},
		async submit_access_token() {
			const success = await verify_account_request(
				null,
				this.access_token,
			);
			if (success) {
				window.toast('Successfully verified GRAB account!');
				this.$emit('update:visible', false);
			}
		},
		async submit_level_url() {
			await verify_account_request(this.level_url, null);
		},
		async generate_code() {
			this.code = await verification_code_request();
		},
		noclick(e) {
			e.preventDefault();
		},
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in', 'user_name', 'grab_id']),
	},
	data() {
		return {
			tab: 'bookmark',
			access_token: '',
			level_url: '',
			code: null,
			bookmarklet: 'javascript:(() => {})();',
		};
	},
	mounted() {
		const userStore = useUserStore();
		this.bookmarklet = `javascript:(async () => {
			const token = JSON.parse(localStorage.user).user.access_token;
			const url = '${this.$config.SERVER_URL}verify_account?token=' + token + '&access_token=${userStore.access_token}';

			try {
				const response = await fetch(url);

				if (!response.ok) {
					const text = await response.text();
					window.toast('Error: ' + text, 'error');
				} else {
					window.toast('Successfully verified GRAB account!');
				}
			} catch {
				window.toast('Request failed', 'error');
			}
		})();`;
	},
	props: {
		visible: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:visible'],
};
</script>

<template>
	<GeneralPopup
		:visible="visible"
		@update:visible="$emit('update:visible', $event)"
	>
		<p>Choose a method to verify your account.</p>
		<div class="tabs">
			<button
				:class="tab !== 'level' ? 'inactive' : ''"
				@click="select_tab('level')"
			>
				Level Code
			</button>
			<button
				:class="tab !== 'token' ? 'inactive' : ''"
				@click="select_tab('token')"
			>
				Access Token
			</button>
			<button
				:class="tab !== 'bookmark' ? 'inactive' : ''"
				@click="select_tab('bookmark')"
			>
				Bookmarklet
			</button>
		</div>
		<div v-show="tab === 'level'" class="tab">
			<p>Verify by placing a one time code in a level.</p>

			<ol>
				<li>Generate a One Time Code</li>
				<li>Place the code in the title or description of a level</li>
				<li>Publish or update the level</li>
				<li>
					Find the level on the
					<a href="https://grabvr.quest/levels">level browser</a>
				</li>
				<li>Copy the URL, and paste it here</li>
				<li>Once verified you can delete the level</li>
			</ol>

			<p v-if="code" class="code">GT-{{ code }}</p>
			<button @click="generate_code" v-else>Generate Code</button>

			<input v-model="level_url" type="text" placeholder="level url" />

			<button @click="submit_level_url">Submit</button>
		</div>
		<div v-show="tab === 'token'" class="tab">
			<p>Verify with an access token</p>

			<ol>
				<li>
					Login to the
					<a href="https://grabvr.quest/levels">level browser</a>
				</li>
				<li>
					Open DevTools with CTRL+SHIFT+I, or right click, Inspect
				</li>
				<li>Open the console tab</li>
				<li>
					Run
					<code>JSON.parse(localStorage.user).user.access_token</code>
					to show your access token
				</li>
				<li>Copy it and paste it here</li>
			</ol>
			<p>
				Disclaimer: Never share your access token with an untrusted
				third party.
			</p>

			<input
				v-model="access_token"
				type="password"
				placeholder="access token"
			/>

			<button @click="submit_access_token">Submit</button>
		</div>
		<div v-show="tab === 'bookmark'" class="tab">
			<p>Verify with a bookmarklet</p>

			<ol>
				<li>Drag the bookmarklet into your bookmarks</li>
				<li>
					Login to the
					<a href="https://grabvr.quest/levels">level browser</a>
				</li>
				<li>Click the bookmark to run it</li>
				<li>On success, login again to see changes</li>
			</ol>

			<p>Disclaimer: Never run a script from an untrusted third party.</p>

			<a class="bookmarklet" :href="bookmarklet" @click="noclick">
				<span>Bookmarklet</span>
			</a>

			<p>
				Disclaimer: This bookmarklet contains your access token. Do not
				share.
			</p>
		</div>
	</GeneralPopup>
</template>

<style scoped>
.tabs {
	display: flex;
	flex-direction: row;
	gap: 1rem;
}
@media screen and (max-width: 500px) {
	.tabs {
		flex-direction: column;
	}
}
.tab {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.code {
	margin-inline: auto;
}
code {
	font-family: monospace;
	word-wrap: break-word;
	display: inline;
	background-color: #0006;
	font-size: 80%;
	padding: 3px;
	border-radius: 3px;
}
ol {
	padding-inline-start: 1rem;
}
a {
	text-decoration: none;
	color: var(--blue);
}
.inactive {
	background-color: #fff2;
}
.bookmarklet {
	color: white;
	background-color: var(--blue);
	border-radius: 1rem;
	padding-inline: 1rem;
	line-height: 2rem;
	width: fit-content;
}
input {
	height: 2rem;
	background-color: var(--border-color);
	border-radius: 1rem;
	padding-inline: 1rem;
	width: 100%;
	color: white;
	line-height: 2rem;
}
</style>
