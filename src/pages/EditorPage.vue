<script>
import { mapState } from 'pinia';
import { useUserStore } from '@/stores/user';

export default {
	components: {},

	data() {
		return {
			test: undefined,
		};
	},
	computed: {
		...mapState(useUserStore, ['is_logged_in']),
	},

	methods: {},
	created() {
		document.title = 'GRAB Tools JSON Editor';
	},
};
</script>

<template>
	<div id="editor">editor</div>
</template>

<style scoped>
#editor {
}
</style>
