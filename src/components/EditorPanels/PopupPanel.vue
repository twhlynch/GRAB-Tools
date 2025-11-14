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
			this.func(...data);
		},
		click(e) {
			if (
				this.visible &&
				this.$refs.container.$el &&
				e.target !== this.$refs.container.$el &&
				!this.$refs.container.$el.contains(e.target)
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
		document.addEventListener('click', this.click);
		document.addEventListener('keydown', this.keydown);
	},
	unmounted() {
		document.removeEventListener('click', this.click);
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
	background-color: var(--blue);
}
</style>
