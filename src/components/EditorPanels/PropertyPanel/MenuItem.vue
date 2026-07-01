<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
	props: {
		node: Object,
	},
	setup(props) {},
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
		<div
			class="menu-row"
			@click="toggle"
			:class="$props.node.isExpandable && 'clickable'"
		>
			<span v-if="$props.node.isExpandable" class="arrow">
				{{ isExpanded ? 'v' : '>' }}
			</span>
			<span v-else class="spacer"></span>

			<span class="node-key">{{ $props.node.key }}:</span>
			<div class="node-editor" @click.stop>
				<!-- Custom Vector3 Editor -->
				<div
					v-if="$props.node.type === 'vector3'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						type="number"
						v-model.number="$props.node.value.x"
						class="primitive-number primitive-input"
					/>
					<span class="y-label">Y:</span>
					<input
						type="number"
						v-model.number="$props.node.value.y"
						class="primitive-number primitive-input"
					/>
					<span class="z-label">Z:</span>
					<input
						type="number"
						v-model.number="$props.node.value.z"
						class="primitive-number primitive-input"
					/>
				</div>

				<!-- Vector4 -->
				<div
					v-if="$props.node.type === 'vector4'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						type="number"
						v-model.number="$props.node.value.x"
						class="primitive-number primitive-input"
					/>
					<span class="y-label">Y:</span>
					<input
						type="number"
						v-model.number="$props.node.value.y"
						class="primitive-number primitive-input"
					/>
					<span class="z-label">Z:</span>
					<input
						type="number"
						v-model.number="$props.node.value.z"
						class="primitive-number primitive-input"
					/>
					<span class="w-label">W:</span>
					<input
						type="number"
						v-model.number="$props.node.value.w"
						class="primitive-number primitive-input"
					/>
				</div>

				<!-- Primitive Editors -->
				<input
					v-else-if="$props.node.type === 'number'"
					type="number"
					v-model.number="$props.node.value"
					class="primitive-number primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'string'"
					type="text"
					v-model="$props.node.value"
					class="primitive-text primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'boolean'"
					type="checkbox"
					v-model="$props.node.value"
					class="primitive-checkbox primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'color'"
					type="color"
					v-model.color="$props.node.value"
					class="primitive-color primitive-input"
				/>

				<!-- Structural Labels -->
				<span
					v-else-if="$props.node.type === 'object' && isExpanded"
					class="type-badge"
					>{</span
				>
				<span
					v-else-if="$props.node.type === 'array' && isExpanded"
					class="type-badge"
					>[</span
				>

				<span
					v-else-if="
						$props.node.type === 'object' && $props.node != {}
					"
					class="type-badge"
					>{ ... }</span
				>
				<span
					v-else-if="
						$props.node.type === 'array' &&
						$props.node.children.length > 0
					"
					class="type-badge"
					>[ ... ]</span
				>

				<span
					v-else-if="$props.node.type === 'object'"
					class="type-badge"
					>{ }</span
				>
				<span
					v-else-if="$props.node.type === 'array'"
					class="type-badge"
					>[ ]</span
				>
			</div>
		</div>
		<div v-if="isExpanded" class="menu-children">
			<MenuItem
				v-for="child in $props.node.children"
				:key="child.key"
				:node="child"
			/>
		</div>
		<span
			v-if="$props.node.type === 'object' && isExpanded"
			class="type-badge"
			>}</span
		>
		<span
			v-else-if="$props.node.type === 'array' && isExpanded"
			class="type-badge"
			>]</span
		>
	</div>
</template>

<style scoped>
.clickable {
	cursor: pointer;
}

.x-label {
	color: #7a3c3c;
}
.y-label {
	color: #3c7a3c;
}
.z-label {
	color: #3d3c7a;
}
.w-label {
	color: #8b833a;
}

.primitive-input {
	background: var(--bg);
	color: #888;
}

.primitive-number {
	padding: 5px;
}

.primitive-number::-webkit-outer-spin-button,
.primitive-number::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.primitive-color::-webkit-color-swatch-wrapper {
	padding: 0;
}

.primitive-color::-webkit-color-swatch {
	border: none;
}

.primitive-color::-moz-color-swatch {
	border: none;
}

.primitive-number {
	-moz-appearance: textfield;
	appearance: textfield;
}

.menu-item {
	margin-left: 12px;
	font-family: monospace;
}
.menu-row {
	display: flex;
	align-items: center;
	padding: 4px;
}
.arrow {
	width: 15px;
	display: inline-block;
}
.spacer {
	width: 15px;
	display: inline-block;
}
.node-key {
	margin-right: 8px;
	font-weight: bold;
}
.vector-inputs input {
	width: 50px;
	margin-right: 4px;
}
.menu-children {
	border-left: 1px solid var(--border-color);
	margin-left: 6px;
}
.type-badge {
	color: #888;
	font-size: 0.85em;
}
</style>
