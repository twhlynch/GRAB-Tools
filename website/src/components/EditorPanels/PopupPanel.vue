<script lang="ts">
import { defineComponent, PropType } from 'vue';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CheckboxInput, Input, OptionInput, RangeInput, UnspecifiedInput } from './inputs';

export default defineComponent({
	props: {
		inputs: {
			type: Array as PropType<Input[]>,
			required: true,
		},
		func: {
			type: Function as PropType<(...data: unknown[]) => void>,
			required: true,
		},
	},
	data() {
		return {
			visible: false,
			remove_events: undefined as (() => void) | undefined,
		};
	},
	watch: {
		inputs(value) {
			if (value) {
				this.visible = true;
			} else {
				this.visible = false;
			}
		},
	},
	mounted() {
		const click = this.click.bind(this);
		const keydown = this.keydown.bind(this);
		document.addEventListener('mousedown', click);
		document.addEventListener('touchstart', click);
		document.addEventListener('keydown', keydown);
		this.remove_events = () => {
			document.removeEventListener('mousedown', click);
			document.removeEventListener('touchstart', click);
			document.removeEventListener('keydown', keydown);
		};
	},
	unmounted() {
		this.remove_events?.();
	},
	methods: {
		run() {
			const data = this.inputs.map((input, index) => {
				if (input.type === 'file') {
					return Array.from(
						(this.$refs[`input-${index}`] as HTMLInputElement[])[0]!.files!,
					);
				}
				if (input.type === 'checkbox') {
					return (this.$refs[`input-${index}`] as HTMLInputElement[])[0]!.checked;
				}
				return (this.$refs[`input-${index}`] as HTMLInputElement[])[0]!.value;
			});
			this.visible = false;
			console.log(...data);
			this.func(...data);
		},
		click(e: MouseEvent | TouchEvent) {
			if (
				this.visible &&
				this.$refs.container &&
				e.target !== this.$refs.container &&
				!(this.$refs.container as HTMLElement).contains(e.target as Node)
			) {
				this.visible = false;
			}
		},
		keydown(e: KeyboardEvent) {
			if (this.visible && e.code === 'Escape') {
				this.visible = false;
			}
		},
	},
});
</script>

<template>
	<section v-if="visible" ref="container">
		<div v-for="(input, i) in inputs" :key="i">
			<label v-if="input.label">{{ input.label }}</label>
			<select v-if="input.type === 'option'" :ref="`input-${i}`">
				<option
					v-for="(option, j) in (input as OptionInput).options"
					:key="j"
					:value="option"
					:selected="j === 0"
				>
					{{ option }}
				</option>
			</select>
			<textarea
				v-else-if="input.type === 'textarea'"
				:ref="`input-${i}`"
				cols="30"
				rows="5"
				:placeholder="input.text"
			></textarea>
			<input
				v-else-if="input.type === 'range'"
				:ref="`input-${i}`"
				:type="input.type"
				:min="(input as RangeInput).min"
				:value="(input as RangeInput).value"
				:max="(input as RangeInput).max"
				:step="(input as RangeInput).step ?? 1"
				@input="
					(e) => {
						(input as RangeInput).value = Number((e.target as HTMLInputElement).value);
					}
				"
			/>
			<label v-else-if="input.type === 'checkbox'">
				{{ input.text }}
				<input
					:ref="`input-${i}`"
					type="checkbox"
					:checked="(input as CheckboxInput).default"
				/>
			</label>
			<input
				v-else
				:ref="`input-${i}`"
				:type="input.type"
				:placeholder="input.text"
				:accept="(input as UnspecifiedInput).accept"
				:multiple="(input as UnspecifiedInput).multiple"
			/>
		</div>
		<button @click="run">Run</button>
	</section>
</template>

<style scoped>
section {
	z-index: 3000;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: var(--bg);
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem 0.8rem;
	border-radius: 1.5rem;
}
input:not([type='checkbox']),
textarea,
select,
label:has(input[type='checkbox']),
button {
	height: 2rem;
	background-color: var(--border-color);
	border-radius: 1rem;
	padding-inline: 1rem;
	width: 100%;
	color: white;
	line-height: 2rem;
}

label:has(input[type='checkbox']) {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	font-size: var(--font-size-alt);
	user-select: none;
}

button {
	cursor: pointer;
	background-color: var(--blue);
}

input[type='range'] {
	-webkit-appearance: none;
	appearance: none;
	width: 100%;
	height: 10px;
	background: none;
	border-radius: 5px;
	outline: none;
	cursor: pointer;
	margin-block: 1em;
	margin-inline: 1em;
	position: relative;
}
input[type='range']::-webkit-slider-runnable-track {
	width: 100%;
	height: 10px;
	border-radius: 5px;
	background: var(--border-color);
}
input[type='range']::-webkit-slider-thumb {
	-webkit-appearance: none;
	transform: translateY(-25%);
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: var(--blue);
	cursor: pointer;
}
input[type='range']::after {
	content: attr(value);
	position: absolute;
	top: 50%;
	left: -1em;
	transform: translateY(-50%);
	font-size: 1em;
	font-weight: 700;
	color: var(--blue);
}
</style>
