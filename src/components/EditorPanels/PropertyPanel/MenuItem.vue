<script>
	import { defineComponent, ref } from 'vue';

	export default defineComponent({
		props: {
			node: Object,
		},
		setup(props) {

		},
		data() {
			return {
				isExpanded: ref(false),
			};
		},
		methods: {
			toggle() {
				if (this.$props.node.isExpandable) {
					this.isExpanded = !this.isExpanded;
					console.log(this.$props.node);
				}
			},
		},
	});
</script>

<template>
	<div class="menu-item">
		<div class="menu-row" @click="toggle" :class="$props.node.isExpandable && 'clickable'">
			<span v-if="$props.node.isExpandable" class="arrow">
				{{ isExpanded ? 'v' : '>' }}
			</span>
			<span v-else class="spacer"></span>

			<span class="node-key">{{ $props.node.key }}:</span>
			<div class="node-editor" @click.stop>
        		<!-- Custom Vector3 Editor -->
        		<div v-if="$props.node.type === 'vector3'" class="vector-inputs">
          			X: <input type="number" v-model.number="$props.node.value.x" />
          			Y: <input type="number" v-model.number="$props.node.value.y" />
          			Z: <input type="number" v-model.number="$props.node.value.z" />
        		</div>

        			<!-- Primitive Editors -->
        			<input v-else-if="$props.node.type === 'number'" type="number" v-model.number="$props.node.value" class="primitive-number" />
        			<input v-else-if="$props.node.type === 'string'" type="text" v-model="$props.node.value" class="primitive-text" />
        			<input v-else-if="$props.node.type === 'boolean'" type="checkbox" v-model="$props.node.value" class="primitive-checkbox" />

        			<!-- Structural Labels -->
        			<span v-else-if="$props.node.type === 'object' && isExpanded" class="type-badge">{</span>
        			<span v-else-if="$props.node.type === 'array' && isExpanded" class="type-badge">[</span>

        			<span v-else-if="$props.node.type === 'object' && $props.node != {}" class="type-badge">{ ... }</span>
        			<span v-else-if="$props.node.type === 'array' && $props.node.children.length > 0" class="type-badge">[ ... ]</span>

        			<span v-else-if="$props.node.type === 'object'" class="type-badge">{ }</span>
        			<span v-else-if="$props.node.type === 'array'" class="type-badge">[ ]</span>
      			</div>
		</div>
		<div v-if="isExpanded" class="menu-children">
      		<MenuItem
        		v-for="child in $props.node.children"
        		:key="child.key"
        		:node="child"
      		/>
    	</div>
        <span v-if="$props.node.type === 'object' && isExpanded" class="type-badge">}</span>
        <span v-else-if="$props.node.type === 'array' && isExpanded" class="type-badge">]</span>
	</div>
</template>

<style scoped>
	.clickable { cursor: pointer; }
	.menu-item { margin-left: 12px; font-family: monospace; }
	.menu-row { display: flex; align-items: center; padding: 4px; }
	.arrow { width: 15px; display: inline-block; }
	.spacer { width: 15px; display: inline-block; }
	.node-key { margin-right: 8px; font-weight: bold; }
	.vector-inputs input { width: 50px; margin-right: 4px; }
	.menu-children { border-left: 1px solid var(--border-color); margin-left: 6px; }
	.type-badge { color: #888; font-size: 0.85em; }
</style>
