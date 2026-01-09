<script>
export default {};
</script>

<template>
	<div>
		<h2><slot name="title" /></h2>
		<p><slot name="info" /></p>
		<div class="tool-template-content">
			<slot />
		</div>
	</div>
</template>

<style scoped>
div {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5px;
}
:global(.tool-template-content input),
:global(.tool-template-content textarea),
:global(.tool-template-content select) {
	padding: 5px;
	background-color: #5f8cc235;
	border: solid 2px #4683ce70;
	border-radius: 5px;
	outline: none;
	width: 100%;
	color: var(--text-color-default);
}
h2 {
	color: #2976d4;
	margin-bottom: 0;
}
</style>
