<script>
import { serialize } from '@/components/EditorPanels/PropertyPanel/menuSerializer';
import { defineComponent, ref } from 'vue';

export default defineComponent({
	props: {
		node: Object,
		reOpen: Boolean,
	},
	emits: ['set', 'refresh'],
	data() {
		return {
			isExpanded: ref(false),
			isHovered: ref(false),
			addMenuOpen: ref(false),
			ignoreMenuClose: false,
			lastNodeKey: this.$props.node.key,
		};
	},
	watch: {
		'$props.node.value': {
			handler(after, before) {
				if (
					!(
						this.$props.node.type == 'enum' ||
						this.$props.node.type == 'boolean'
					)
				)
					return; // temporary, to prevent lag spikes
				if (
					!this.objectEquals(before, after) &&
					this.lastNodeKey == this.$props.node.key
				) {
					this.$emit('refresh');
				}
				this.lastNodeKey = this.$props.node.key;
			},
			deep: true,
		},
		'$props.reOpen': {
			handler() {
				this.isExpanded = false;
				if (this.$props.node.key == null) this.isExpanded = true; // expand root node by default
			},
			deep: true,
		},
	},
	mounted() {
		window.addEventListener('click', this.onclick);
	},
	methods: {
		objectEquals(a, b) {
			if (typeof a != typeof b) return false;
			if (typeof a != 'object') {
				return a == b;
			}
			let equal = true;
			Object.entries(a).forEach(([key, val]) => {
				if (Array.isArray(val)) {
					val.forEach((e, index) => {
						if (!this.objectEquals(e, b[key][index])) equal = false;
					});
				}
				if (typeof val === 'object') {
					if (!this.objectEquals(val, b[key])) equal = false;
				}
				if (b[key] != val) equal = false;
			});
			return equal;
		},
		toggle(e) {
			if (e.target.className.includes('modify-button')) return;
			if (this.$props.node.isExpandable) {
				this.isExpanded = !this.isExpanded;
			}
		},
		addItemAbove() {
			if (this.$props.node.arrayIndex == null) return;
			this.$emit('set', (e) => {
				e.$props.node.children.splice(
					this.$props.node.arrayIndex,
					0,
					serialize(
						Object.keys(this.$props.node.blankTypes).length == 1
							? this.$props.node.blankTypes[
									Object.keys(this.$props.node.blankTypes)[0]
								]
							: this.$props.node.blankTypes[
									this.$refs.blankTypeSelect.value
								],
						this.$props.node.arrayIndex.toString(),
						this.$props.node.elementType || this.$props.node.key,
						this.$props.node.arrayIndex,
					),
				);
			});
			this.$emit('refresh');
		},
		addItemBelow() {
			if (this.$props.node.arrayIndex == null) return;
			this.$emit('set', (e) => {
				e.$props.node.children.splice(
					this.$props.node.arrayIndex + 1,
					0,
					serialize(
						Object.keys(this.$props.node.blankTypes).length == 1
							? this.$props.node.blankTypes[
									Object.keys(this.$props.node.blankTypes)[0]
								]
							: this.$props.node.blankTypes[
									this.$refs.blankTypeSelect.value
								],
						this.$props.node.arrayIndex.toString(),
						this.$props.node.elementType || this.$props.node.key,
						this.$props.node.arrayIndex,
					),
				);
			});
			this.$emit('refresh');
		},
		addArrayItem() {
			if (this.$props.node.type != 'array') return;
			this.$props.node.children = [
				serialize(
					Object.keys(this.$props.node.blankTypes).length == 1
						? this.$props.node.blankTypes[
								Object.keys(this.$props.node.blankTypes)[0]
							]
						: this.$props.node.blankTypes[
								this.$refs.blankTypeSelectSingle.value
							],
					'0',
					this.$props.node.elementType || this.$props.node.key,
					0,
				),
			];
			this.$props.node.isExpandable = true;
			this.isExpanded = true;
			this.$emit('refresh');
		},
		isInlineType() {
			return ['Vector', 'Vector2', 'Quaternion', 'Color'].includes(
				this.$props.node.type,
			);
		},
		getChildValue(key) {
			return this.$props.node.children?.find((c) => c.key === key)?.value;
		},
		setChildValue(key, val) {
			const child = this.$props.node.children?.find((c) => c.key === key);
			if (child) child.value = val;
		},
		getColorHex() {
			const r = this.getChildValue('r') || 0;
			const g = this.getChildValue('g') || 0;
			const b = this.getChildValue('b') || 0;
			const ri = Math.floor(r * 255);
			const gi = Math.floor(g * 255);
			const bi = Math.floor(b * 255);
			return (
				'#' +
				[ri, gi, bi]
					.map((x) => x.toString(16).padStart(2, '0'))
					.join('')
			);
		},
		onColorInput(e) {
			const hex = e.target.value;
			this.setChildValue('r', parseInt(hex.substring(1, 3), 16) / 255);
			this.setChildValue('g', parseInt(hex.substring(3, 5), 16) / 255);
			this.setChildValue('b', parseInt(hex.substring(5, 7), 16) / 255);
		},
		removeItem() {
			if (this.$props.node.arrayIndex == null) return;
			this.$emit('set', (e) => {
				e.$props.node.children.splice(this.$props.node.arrayIndex, 1);
				if (e.$props.node.children.length == 0) {
					e.isExpanded = false;
				}
			});
			this.$emit('refresh');
		},
		setEmit(e) {
			e(this);
		},
		refreshEmit() {
			this.$emit('refresh');
		},
		onclick(e) {
			if (
				!e.target.className.includes('ignore-menu-close') &&
				this.addMenuOpen &&
				!this.ignoreMenuClose
			) {
				this.addMenuOpen = false;
			}
			this.ignoreMenuClose = false;
		},
	},
});
</script>

<template>
	<div class="menu-item">
		<div
			class="menu-row"
			:class="$props.node.isExpandable && !isInlineType() && 'clickable'"
			@click="toggle"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<span
				v-if="$props.node.isExpandable && !isInlineType()"
				class="arrow"
			>
				{{ isExpanded ? '⌄' : '›' }}
			</span>

			<span class="node-key">{{ $props.node.title }}:</span>
			<div class="node-editor" @click.stop>
				<!-- Vector2 -->
				<div
					v-if="$props.node.type === 'Vector2'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('x')"
						@input="setChildValue('x', $event.target.valueAsNumber)"
					/>
					<span class="y-label">Y:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('y')"
						@input="setChildValue('y', $event.target.valueAsNumber)"
					/>
				</div>

				<!-- Vector -->
				<div
					v-else-if="$props.node.type === 'Vector'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('x')"
						@input="setChildValue('x', $event.target.valueAsNumber)"
					/>
					<span class="y-label">Y:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('y')"
						@input="setChildValue('y', $event.target.valueAsNumber)"
					/>
					<span class="z-label">Z:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('z')"
						@input="setChildValue('z', $event.target.valueAsNumber)"
					/>
				</div>

				<!-- Quaternion -->
				<div
					v-else-if="$props.node.type === 'Quaternion'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('x')"
						@input="setChildValue('x', $event.target.valueAsNumber)"
					/>
					<span class="y-label">Y:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('y')"
						@input="setChildValue('y', $event.target.valueAsNumber)"
					/>
					<span class="z-label">Z:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('z')"
						@input="setChildValue('z', $event.target.valueAsNumber)"
					/>
					<span class="w-label">W:</span>
					<input
						type="number"
						class="primitive-number primitive-input"
						:value="getChildValue('w')"
						@input="setChildValue('w', $event.target.valueAsNumber)"
					/>
				</div>

				<!-- Primitive Editors -->
				<input
					v-else-if="$props.node.type === 'number'"
					v-model.number="$props.node.value"
					type="number"
					class="primitive-number primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'string'"
					v-model="$props.node.value"
					type="text"
					class="primitive-text primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'boolean'"
					v-model="$props.node.value"
					type="checkbox"
					class="primitive-checkbox primitive-input"
				/>
				<input
					v-else-if="$props.node.type === 'Color'"
					type="color"
					class="primitive-color primitive-input"
					:value="getColorHex()"
					@input="onColorInput"
				/>

				<!-- Enum input (select, option) -->
				<select
					v-else-if="$props.node.type === 'enum'"
					v-model="$props.node.value"
					class="primitive-select primitive-input"
				>
					<option
						v-for="item in $props.node.enumData"
						:key="item[0]"
						:value="item[0]"
						:selected="$props.node.value == item[0]"
					>
						{{ item[1] }}
					</option>
				</select>

				<!-- Structural Labels -->
				<span
					v-else-if="$props.node.type === 'array' && isExpanded"
					class="type-badge"
					>[</span
				>
				<span
					v-else-if="
						$props.node.children &&
						$props.node.type !== 'array' &&
						isExpanded &&
						!isInlineType()
					"
					class="type-badge"
					>{</span
				>

				<span
					v-else-if="
						$props.node.type === 'array' &&
						$props.node.children.length > 0 &&
						!isExpanded
					"
					class="type-badge"
					>[ ... ]</span
				>
				<span
					v-else-if="
						$props.node.children &&
						$props.node.children.length > 0 &&
						$props.node.type !== 'array' &&
						!isExpanded &&
						!isInlineType()
					"
					class="type-badge"
					>{ ... }</span
				>

				<span
					v-else-if="$props.node.type === 'array'"
					class="type-badge"
					>[ ]</span
				>
				<span
					v-else-if="$props.node.children && !isInlineType()"
					class="type-badge"
					>{ }</span
				>
			</div>

			<!-- Array modification buttons -->
			<div v-if="isHovered && $props.node.arrayIndex != null">
				<span class="spacer"></span>
				<button
					class="modify-button"
					@click="
						addMenuOpen = true;
						ignoreMenuClose = true;
					"
				>
					+
				</button>
				<button class="modify-button red-button" @click="removeItem">
					X
				</button>
			</div>
			<div
				v-if="
					isHovered &&
					$props.node.type === 'array' &&
					$props.node.children.length == 0
				"
			>
				<span class="spacer"></span>
				<button
					class="modify-button"
					@click="
						Object.keys($props.node.blankTypes).length > 1
							? (addMenuOpen = true)
							: addArrayItem();
						ignoreMenuClose = true;
					"
				>
					+
				</button>
			</div>
		</div>
		<!-- Populate menu for empty array parents -->
		<div
			v-if="
				$props.node.type === 'array' &&
				$props.node.children.length === 0 &&
				addMenuOpen
			"
			class="add-menu ignore-menu-close"
		>
			<span v-if="Object.keys($props.node.blankTypes).length > 1">
				<select
					ref="blankTypeSelectSingle"
					class="primitive-select primitive-input ignore-menu-close"
				>
					<option
						v-for="(item, index) in Object.keys(
							$props.node.blankTypes,
						)"
						:key="item"
						:value="item"
						:selected="index == 0"
					>
						{{ item }}
					</option>
				</select>
				<br />
			</span>
			<button
				class="modify-button in-menu-button ignore-menu-close"
				@click="addArrayItem"
			>
				Add item
			</button>
		</div>

		<!-- Populate menu for array children -->
		<div
			v-if="$props.node.arrayIndex != null && addMenuOpen"
			class="add-menu ignore-menu-close"
		>
			<span v-if="Object.keys($props.node.blankTypes).length > 1">
				<select
					ref="blankTypeSelect"
					class="primitive-select primitive-input ignore-menu-close"
				>
					<option
						v-for="(item, index) in Object.keys(
							$props.node.blankTypes,
						)"
						:key="item"
						:value="item"
						:selected="index == 0"
					>
						{{ item }}
					</option>
				</select>
				<br />
			</span>
			<button
				class="modify-button ignore-menu-close in-menu-button"
				@click="addItemAbove"
			>
				Insert item above
			</button>
			<br />
			<button
				class="modify-button ignore-menu-close in-menu-button"
				@click="addItemBelow"
			>
				Insert item below
			</button>
		</div>
		<div v-if="isExpanded && !isInlineType()" class="menu-children">
			<span v-if="$props.node.key == 'program'" class="node-key x-label"
				><span class="spacer"></span>GASM not supported</span
			>
			<MenuItem
				v-for="child in $props.node.children"
				v-else
				:key="child.key"
				:node="child"
				:re-open="$props.reOpen"
				@set="setEmit"
				@refresh="refreshEmit"
			/>
		</div>
		<span
			v-if="$props.node.type === 'array' && isExpanded"
			class="type-badge"
			>]</span
		>
		<span
			v-else-if="
				$props.node.children &&
				$props.node.type !== 'array' &&
				isExpanded &&
				!isInlineType()
			"
			class="type-badge"
			>}</span
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

.add-menu {
	position: absolute;
	padding: 10px;
	background: #141415;
	border: 3px solid var(--border-color);
}

.modify-button {
	display: inline-block;
	height: 100%;
	padding-inline: 4px;
	border-radius: 5px;
	background: #3d3c7a;
	color: #888;
	cursor: pointer;
	margin-right: 2px;
}
.red-button {
	background: #7a3c3c;
}

.primitive-input {
	background: var(--bg);
	color: #aaa;
	display: inline-block;
}

.primitive-number,
.primitive-text,
.primitive-select {
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
