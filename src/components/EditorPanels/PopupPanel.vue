<script>
export default {
	props: {
		inputs: Array,
		func: Function,
	},
	data() {
		return {
			visible: false,
		};
	},
	methods: {
		run() {
			const data = this.inputs.map((input, index) => {
				if (input.type === 'file') {
					return Array.from(this.$refs[`input-${index}`][0].files);
				}
				return this.$refs[`input-${index}`][0].value;
			});
			this.visible = false;
			console.log(...data);
			this.func(...data);
		},
		click(e) {
			if (
				this.visible &&
				this.$refs.container &&
				e.target !== this.$refs.container &&
				!this.$refs.container.contains(e.target)
			) {
				this.visible = false;
			}
		},
		keydown(e) {
			if (this.visible && e.code === 'Escape') {
				this.visible = false;
			}
		},
	},
	mounted() {
		document.addEventListener('mousedown', this.click);
		document.addEventListener('touchstart', this.click);
		document.addEventListener('keydown', this.keydown);
	},
	unmounted() {
		document.removeEventListener('mousedown', this.click);
		document.removeEventListener('touchstart', this.click);
		document.removeEventListener('keydown', this.keydown);
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
};
</script>

<template>
	<section v-if="visible" ref="container">
		<div v-for="(input, i) in inputs" :key="i">
			<label v-if="input.label">{{ input.label }}</label>
			<select v-if="input.type === 'option'" :ref="`input-${i}`">
				<option
					v-for="(option, j) in input.options"
					:key="j"
					:value="option"
					:selected="j === 0"
				>
					{{ option }}
				</option>
			</select>
			<textarea
				v-else-if="input.type === 'textarea'"
				cols="30"
				rows="5"
				:ref="`input-${i}`"
				:placeholder="input.text"
			></textarea>
			<input
				v-else-if="input.type === 'range'"
				:type="input.type"
				:ref="`input-${i}`"
				:min="input.min"
				:value="input.value"
				:max="input.max"
				:step="input.step ?? 1"
				@input="
					(e) => {
						input.value = e.target.value;
					}
				"
			/>
			<input
				v-else
				:type="input.type"
				:ref="`input-${i}`"
				:placeholder="input.text"
				:accept="input.accept"
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
input,
textarea,
select,
button {
	height: 2rem;
	background-color: var(--border-color);
	border-radius: 1rem;
	padding-inline: 1rem;
	width: 100%;
	color: white;
	line-height: 2rem;
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
