<script setup>
	import { ref } from 'vue';

	const props = defineProps({
		node: { type: Object, required: true }
	});
	console.log(props);

	const node = props.node;
	console.log(node);
	const isExpanded = ref(false);
	const toggle = () => {
		if (node.isExpandable) {
			isExpanded.value = !isExpanded.value;
		}
	}
</script>

<template>
	<div class="menu-item">
		<div class="menu-row" @click="toggle">
			<span v-if="node.isExpandable" class="arrow">
				{{ isExpanded ? 'v' : '>' }}
			</span>
			<span v-else class="spacer"></span>

			<span class="node-key">{{ node.key }}:</span>
			<div class="node-editor" @click.stop>
        		<!-- Custom Vector3 Editor -->
        		<div v-if="node.type === 'vector3'" class="vector-inputs">
          			X: <input type="number" v-model.number="node.value.x" />
          			Y: <input type="number" v-model.number="node.value.y" />
          			Z: <input type="number" v-model.number="node.value.z" />
        		</div>

        			<!-- Primitive Editors -->
        			<input v-else-if="node.type === 'number'" type="number" v-model.number="node.value" />
        			<input v-else-if="node.type === 'string'" type="text" v-model="node.value" />
        			<input v-else-if="node.type === 'boolean'" type="checkbox" v-model="node.value" />

        			<!-- Structural Labels -->
        			<span v-else-if="node.type === 'object'" class="type-badge">{ ... }</span>
        			<span v-else-if="node.type === 'array'" class="type-badge">[ ... ]</span>
      			</div>
		</div>
		<div v-show="isExpanded.value" class="menu-children">
      			<MenuItem
        			v-for="child in node.children"
        			:key="child.key"
        			:node="child"
      			/>
    		</div>
	</div>
</template>

<style scoped>
	.menu-item { margin-left: 12px; font-family: monospace; }
	.menu-row { display: flex; align-items: center; padding: 4px; cursor: pointer; }
	.arrow { width: 15px; display: inline-block; }
	.spacer { width: 15px; display: inline-block; }
	.node-key { margin-right: 8px; font-weight: bold; }
	.vector-inputs input { width: 50px; margin-right: 4px; }
	.menu-children { border-left: 1px dashed #ccc; margin-left: 6px; }
	.type-badge { color: #888; font-size: 0.85em; }
</style>
