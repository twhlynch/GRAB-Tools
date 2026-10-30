<script lang="ts">
import MenuItem from '@/components/EditorPanels/PropertyPanel/MenuItem.vue';
import { deserialize, serialize } from '@/components/EditorPanels/PropertyPanel/menuSerializer';
import { LevelNode } from '@grab-tools/lib/generated/proto';
import { defineComponent, ref } from 'vue';

export default defineComponent({
	components: {
		MenuItem,
	},
	data() {
		return {
			source_object: undefined as LevelNode | undefined,
			deSerialized: undefined as LevelNode | undefined,
			reOpen: ref(false),
			menu_tree: serialize({}, 'undefined'),
		};
	},
	methods: {
		refs() {
			return this.$refs as {
				rootMenuItem: InstanceType<typeof MenuItem>;
			};
		},
		save() {
			const new_object = this.refs().rootMenuItem.$props.node;
			this.deSerialized = deserialize(new_object);
		},
		set_object(object: LevelNode) {
			this.menu_tree = serialize(object);
			this.source_object = object;
			this.reOpen = !this.reOpen;
		},
		refresh_tree() {
			const new_object = this.refs().rootMenuItem.$props.node;
			this.menu_tree = serialize(deserialize(new_object));
		},
	},
});
</script>

<template>
	<div class="property-editor">
		<MenuItem ref="rootMenuItem" :node="menu_tree" :re-open="reOpen" @refresh="refresh_tree" />
	</div>
</template>

<style scoped>
.property-editor {
	padding: 20px;
	background: #141415;
	color: #a0a0a0;
	border-bottom: var(--border-color) solid 3px;
	border-top: var(--border-color) dashed 1px;

	width: 100%;
	height: 100%;
	overflow: scroll;
}
</style>
