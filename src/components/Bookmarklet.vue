<script>
import { minify } from 'terser';

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
		const modules = import.meta.glob('../assets/bookmarklets/*.js', {
			as: 'raw',
		});
		const path = `../assets/bookmarklets/${this.script}`;

		if (modules[path]) {
			let code = await modules[path]();
			const result = await minify(code);
			this.bookmarklet = encodeURIComponent(result.code);
		} else {
			console.error('Bookmarklet not found:', path);
		}
	},
};
</script>

<template>
	<a class="bookmarklet" :href="`javascript:${bookmarklet}`">
		<span>{{ name }}</span>
	</a>
</template>

<style scoped>
.bookmarklet {
}
</style>
