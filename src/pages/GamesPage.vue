<script>
export default {
	created() {
		document.title = 'Games | GRAB Tools';
	},
};
</script>

<template>
	<main>
		<section id="info">
			<h2>GRAB Games</h2>
			<p>
				A collection of GRAB themed games available to play online or
				download! Join the
				<a :href="this.$config.DISCORD_URL">discord</a> to request a
				game to add.
			</p>
		</section>
		<section id="games">
			<div class="game">
				<div class="game-details">
					<div>
						<h3>GRAB - SlinDev</h3>
						<p>GRAB!</p>
						<div class="game-links">
							<a
								href="https://www.meta.com/en-gb/experiences/4104088956355944/"
								class="button-sml"
								>Oculus</a
							>
						</div>
					</div>
					<img
						src="/images/games/grab.png"
						alt="The GRAB logo"
						title="GRAB"
					/>
				</div>
			</div>
			<div class="game">
				<div class="game-details">
					<div>
						<h3>GRAB2D - BlackCat508</h3>
						<p>A 2D version of GRAB!</p>
						<div class="game-links">
							<a
								href="https://blackcat508.itch.io/grab2d"
								class="button-sml"
								>Itch.io</a
							>
							<a
								href="https://discord.gg/PefVhprQs8"
								class="button-sml"
								>Discord</a
							>
						</div>
					</div>
					<img
						src="/images/games/grab_2d.png"
						alt="The GRAB 2D logo"
						title="GRAB 2D"
					/>
				</div>
			</div>
			<div class="game">
				<div class="game-details">
					<div>
						<h3>GrabGuessr - .index</h3>
						<p>GeoGuesser with GRAB maps!</p>
						<div class="game-links">
							<a
								href="https://twhlynch.me/GrabGuessr"
								class="button-sml"
								>Website</a
							>
							<a
								href="https://github.com/twhlynch/GrabGuessr"
								class="button-sml"
								>GitHub</a
							>
						</div>
					</div>
					<img
						src="/images/games/grab_guessr.png"
						alt="The GrabGuessr logo"
						title="GrabGuessr"
					/>
				</div>
			</div>
		</section>
	</main>
</template>

<style scoped>
.game {
	display: flex;
	flex-direction: column;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	box-sizing: border-box;
	max-height: 100px;
	padding-block: 10px;
	max-width: 550px;
	margin-inline: auto;
}
.game-details {
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	max-height: 100px;
}
.game-details img {
	max-height: 80px;
	max-width: 30%;
	border-radius: 5px;
}
.game-links {
	margin-top: 5px;
	display: flex;
	flex-direction: row;
	gap: 5px;
	align-items: center;
	justify-content: flex-start;
}
#games {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>
