<script>
import MenuItem from '@/components/EditorPanels/PropertyPanel/MenuItem.vue';
import { serializeToMenu, deSerialize } from '@/components/EditorPanels/PropertyPanel/menuSerializer';
import { defineComponent } from 'vue';

export default defineComponent({
	components: {
		MenuItem,
	},
	data() {
		return {
			source_object: undefined,
			deSerialized: undefined,
			menu_tree: serializeToMenu({}, 'undefined'),
		};
	},
	methods: {
		save() {
			const new_object = this.$refs.rootMenuItem.$props.node;
			this.deSerialized = deSerialize(new_object);
		},
		set_object(object) {
			this.menu_tree = serializeToMenu(object);
			this.source_object = object;
		},
	},
});
</script>

<template>
	<div class="property-editor">
		<MenuItem ref="rootMenuItem" :node="menu_tree" />
	</div>
</template>

<style scoped>
.property-editor {
	padding: 20px;
	background: #141415;
	border-bottom: var(--border-color) solid 3px;
	border-top: var(--border-color) dashed 1px;

	width: 100%;
}
</style>
