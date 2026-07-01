<script>
import MenuItem from '@/components/EditorPanels/PropertyPanel/MenuItem.vue';
import { serializeToMenu } from '@/components/EditorPanels/PropertyPanel/menuSerializer';
import { defineComponent } from 'vue';

export default defineComponent({
	components: {
		MenuItem,
	},
	data() {
		return {
			editing_component: undefined,
			is_active: false,
			prop_json: undefined,
			menu_tree: serializeToMenu({}, 'undefined'),
		};
	},
	methods: {
		save() {},
		set_object(object) {
			this.menu_tree = serializeToMenu(object);
			console.log(this.menu_tree);
		},
	},
});
</script>

<template>
	<div class="property-editor">
		<MenuItem :node="menu_tree" />
	</div>
</template>

<style scoped>
.property-editor {
	padding: 20px;
	background: var(--bg);
	border-bottom: var(--border-color) solid 3px;
	border-top: var(--border-color) dashed 1px;

	width: 100%;
}
</style>
