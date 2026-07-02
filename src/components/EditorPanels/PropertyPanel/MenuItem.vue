<script>
import { defineComponent, ref } from 'vue';
import { serializeToMenu } from '@/components/EditorPanels/PropertyPanel/menuSerializer';

export default defineComponent({
    emits: ['set', 'refresh'],
	props: {
		node: Object,
		reOpen: Boolean,
	},
	watch: {
		'$props.reOpen': {
			handler(newVal, oldVal) {
				this.isExpanded = false;
				this.advancedEdit = false;
				if (this.$props.node.key == 'node') this.isExpanded = true; // expand root node by default
			},
			deep: true,
		},
	},
	data() {
		return {
			isExpanded: ref(false),
			advancedEdit: ref(false),
            isHovered: ref(false),
            addMenuOpen: ref(false),
		};
	},
	methods: {
		toggle(e) {
            if (e.target.className.includes("modify-button")) return;
			if (this.$props.node.isExpandable) {
				this.isExpanded = !this.isExpanded;
			}
		},
		toggleAdvanced() {
			this.advancedEdit = !this.advancedEdit;
		},
        addItemAbove() {
            if (this.$props.node.arrayIndex==null) return;
            console.log(this.$props.node);
            this.$emit('set', (e) => {
                console.log(e.$props.node);
                //console.log(this.$props.node.blankTypes[this.$refs.blankTypeSelect.value]);
                e.$props.node.children.splice(
                    this.$props.node.arrayIndex, 
                    0, 
                    serializeToMenu(
                        (Object.keys(this.$props.node.blankTypes).length==1)
                            ? this.$props.node.blankTypes[Object.keys(this.$props.node.blankTypes)[0]]
                            : this.$props.node.blankTypes[this.$refs.blankTypeSelect.value],
                        this.$props.node.arrayIndex.toString(),
                        this.$props.node.key,
                        this.$props.node.arrayIndex
                    )
                );
            });
            this.$emit('refresh');
        },
        addItemBelow() {
            if (this.$props.node.arrayIndex==null) return;
            this.$emit('set', (e) => {
                console.log(e.$props.node);
                e.$props.node.children.splice(
                    this.$props.node.arrayIndex-1, 
                    0, 
                    serializeToMenu(
                        (Object.keys(this.$props.node.blankTypes).length==1)
                            ? this.$props.node.blankTypes[Object.keys(this.$props.node.blankTypes)[0]]
                            : this.$props.node.blankTypes[this.$refs.blankTypeSelect.value],
                        this.$props.node.arrayIndex.toString(),
                        this.$props.node.key,
                        this.$props.node.arrayIndex
                    )
                );
            });
            this.$emit('refresh');
        },
        removeItem() {
            if (this.$props.node.arrayIndex==null) return;
            this.$emit('set', (e) => {
                console.log(e.$props.node);
                e.$props.node.children.splice(this.$props.node.arrayIndex, 1);
                if (e.$props.node.children.length==0) {
                    e.isExpanded=false;
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
	},
});
</script>

<template>
	<div class="menu-item">
		<div
			class="menu-row"
			:class="$props.node.isExpandable && 'clickable'"
			@click="toggle"
            @mouseenter="isHovered=true"
            @mouseleave="isHovered=false"
		>
			<span v-if="$props.node.isExpandable" class="arrow">
				{{ isExpanded ? 'v' : '>' }}
			</span>
			<span v-else class="spacer"></span>

			<span class="node-key">{{ $props.node.title }}:</span>
			<div class="node-editor" @click.stop>
				<!-- Min-Max range -->
				<div v-if="$props.node.type === 'minmax'" class="vector-inputs">
					<span class="x-label">Min:</span>
					<input
						v-model.number="$props.node.value.x"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="y-label">Max:</span>
					<input
						v-model.number="$props.node.value.y"
						type="number"
						class="primitive-number primitive-input"
					/>
				</div>

				<!-- Vector3 -->
				<div
					v-else-if="$props.node.type === 'vector3'"
					class="vector-inputs"
				>
					<span class="x-label">X:</span>
					<input
						v-model.number="$props.node.value.x"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="y-label">Y:</span>
					<input
						v-model.number="$props.node.value.y"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="z-label">Z:</span>
					<input
						v-model.number="$props.node.value.z"
						type="number"
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
						v-model.number="$props.node.value.x"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="y-label">Y:</span>
					<input
						v-model.number="$props.node.value.y"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="z-label">Z:</span>
					<input
						v-model.number="$props.node.value.z"
						type="number"
						class="primitive-number primitive-input"
					/>
					<span class="w-label">W:</span>
					<input
						v-model.number="$props.node.value.w"
						type="number"
						class="primitive-number primitive-input"
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
					v-else-if="$props.node.type === 'color'"
					v-model="$props.node.value"
					type="color"
					class="primitive-color primitive-input"
				/>

				<!-- Enum input (select, option) -->
				<select
					v-else-if="$props.node.type === 'enum' && !advancedEdit"
					v-model="$props.node.value"
					class="primitive-select primitive-input"
				>
					<option
						v-for="(item, index) in $props.node.enumData"
						:value="item[0]"
						:selected="$props.node.value == item[0]"
					>
						{{ item[1] }}
					</option>
				</select>
				<input
					v-else-if="$props.node.type === 'enum' && advancedEdit"
					v-model.number="$props.node.value"
					type="number"
					class="primitive-number primitive-input"
				/>
				<span
					v-if="$props.node.type === 'enum'"
					class="clickable"
					style="margin-left: 10px"
					@click="toggleAdvanced"
				>
					{{ advancedEdit ? '[simple]' : '[advanced]' }}
				</span>

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

            <!-- Array modification buttons -->
            <div v-if="isHovered && $props.node.arrayIndex!=null">
                <span class="spacer"></span>
                <button class="modify-button" @click="addMenuOpen = true">+</button>
                <button class="modify-button red-button" @click="removeItem">X</button>
            </div>
		</div>
        <div v-if="$props.node.arrayIndex!=null && addMenuOpen" class="add-menu" @mouseleave="addMenuOpen = false">
            <span v-if="Object.keys($props.node.blankTypes).length > 1">
                <select class="primitive-select primitive-input" ref="blankTypeSelect">
                    <option
                        v-for="(item, index) in Object.keys($props.node.blankTypes)"
                        :value="item"
                        :selected="index==0"
                    >
                        {{ item }}
                    </option>
                </select>
                <br>
            </span>
            <button class="modify-button in-menu-button" @click="addItemAbove">Insert item above</button>
            <br>
            <button class="modify-button in-menu-button" @click="addItemBelow">Insert item below</button>
        </div>
		<div v-if="isExpanded" class="menu-children">
            <span v-if="$props.node.key=='program'" class="node-key x-label">GASM not supported</span>
			<MenuItem
                v-else
				v-for="child in $props.node.children"
				:key="child.key"
				:node="child"
				:reOpen="$props.reOpen"
                @set="setEmit"
                @refresh="refreshEmit"
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

.add-menu {
    position: absolute;
    padding:10px;
    background: #141415;
    border: 4px solid var(--border-color);
}

.modify-button {
    display:inline-block;
    padding:5px;
    border-radius:5px;
    background: #3d3c7a;
    color: #888;
    cursor: pointer;
    margin:2px;
}
.red-button {
    background: #7a3c3c;
}

.primitive-input {
	background: var(--bg);
	color: #aaa;
    display:inline-block;
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
