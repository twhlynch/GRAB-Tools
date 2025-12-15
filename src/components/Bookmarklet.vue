<!-- eslint-disable vue/multi-word-component-names -->
<script>
export default {
	props: {
		name: String,
		script: String,
	},

	data() {
		return {
			bookmarklet: '(() => {})();',
		};
	},

	async mounted() {
		const path = `/bookmarklets/${this.script}`;

		try {
			const res = await fetch(path);
			const code = await res.text();
			this.bookmarklet = encodeURIComponent(code);
		} catch (e) {
			console.error('Bookmarklet not found:', path);
		}
	},

	methods: {
		click(e) {
			e.preventDefault();
		},
	},
};
</script>

<template>
	<a class="bookmarklet" :href="`javascript:${bookmarklet}`" @click="click">
		<span>{{ name }}</span>
	</a>
</template>
