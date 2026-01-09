<template>
	<span class="svg-icon">
		<slot />
	</span>
</template>

<style>
span.svg-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	width: 24px;
	height: 24px;
	svg {
		width: 100%;
		height: 100%;
		color: inherit;
	}
}
</style>
