<script>
	import { defineComponent, ref } from 'vue';
	import MenuItem from '@/components/EditorPanels/PropertyPanel/MenuItem.vue';
	import { serializeToMenu } from '@/components/EditorPanels/PropertyPanel/menuSerializer';

	export default defineComponent({
		components: {
			MenuItem,
		},
		data() {
			return {
				editing_component: undefined,
				is_active: false,
				prop_json: undefined,
				menu_tree: serializeToMenu({}, 'Configuration'),
			};
		},
		methods: {
			save() {

			},
			set_object(object) {
				this.menu_tree = serializeToMenu(object, 'Configuration');
			},
		},
	});
</script>

<template>
	<div class="parent-box">
		<MenuItem :node="menu_tree" />
	</div>
</template>

<style scoped>
	
</style>
