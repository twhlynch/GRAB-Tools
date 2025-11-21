<script>
export default {
	props: {
		bind: String,
	},
};
</script>

<template>
	<i class="key-hint">{{ bind }}</i>
</template>

<style scoped>
.key-hint {
	pointer-events: none;
	scale: 0.9;
	position: absolute;
	bottom: -6px;
	left: -6px;
	line-height: 10px;
	background-color: #151b23;
	border-radius: 6px;
	font-size: 11px;
	font-family: Menlo, Monaco, Consolas, 'Andale Mono', 'Ubuntu Mono',
		'Courier New', monospace;
	padding: 0.25rem;
	color: var(--fg);
	vertical-align: middle;
	border: solid 1px #303841;
	box-shadow: inset 0 -1px 0 #303841;
}
</style>
