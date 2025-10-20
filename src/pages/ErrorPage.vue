<script>
export default {
	created() {
		document.title = 'Something went wrong';
	},
};
</script>

<template>
	<main>
		<section id="error">
			<img src="/images/404.png" alt="Sad idnex" />
			<h2>Something went wrong</h2>
			<p>This page may have moved or the url might be malformed.</p>
		</section>
	</main>
</template>

<style scoped>
#error {
	max-width: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
main {
	justify-items: center;
}
img {
	height: 1.5rem;
	opacity: 0.8;
	margin: 1rem;
}
</style>
