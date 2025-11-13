<script>
export default {
	props: {
		menu: Object,
	},
};
</script>

<template>
	<section>
		<ul class="menu-dropdown">
			<li v-for="[button, data] of Object.entries(menu)" :key="button">
				<a class="menu-btn" v-if="data.href" :href="data.href">{{
					button
				}}</a>
				<button
					:class="
						'menu-btn' +
						(data.hasOwnProperty('func') && !data.func
							? ' unimplemented'
							: '')
					"
					v-else
					@click="
						() => {
							!data.file && data.func();
						}
					"
				>
					{{ button
					}}<input v-if="data.file" type="file" @change="data.func" />
				</button>
				<ul
					class="menu-dropdown"
					v-if="!data.hasOwnProperty('func') && !data.href"
				>
					<li
						v-for="[sub_button, sub_data] of Object.entries(data)"
						:key="button + sub_button"
					>
						<a
							class="menu-btn"
							v-if="sub_data.href"
							:href="data.href"
							>{{ sub_button }}</a
						>
						<button
							:class="
								'menu-btn' +
								(!sub_data.func ? ' unimplemented' : '')
							"
							v-else
							@click="
								() => {
									!sub_data.file && sub_data.func();
								}
							"
						>
							{{ sub_button
							}}<input
								v-if="sub_data.file"
								type="file"
								@change="sub_data.func"
							/>
						</button>
					</li>
				</ul>
			</li>
		</ul>
	</section>
</template>

<style scoped>
section {
	position: fixed;
	width: fit-content;
	height: fit-content;
	z-index: 2000;
}

a {
	text-decoration: none;
}

input[type='file'] {
	display: none;
}

.menu-btn {
	background-color: #2e2e2e;
	color: white;
	padding: 6px 16px;
	border: none;
	cursor: pointer;
	font-size: 0.8rem;
	font-family: var(--font-family-default);
}
.menu-dropdown .menu-btn {
	border-radius: 0;
}
.menu-btn:hover,
.menu-btn:has(+ .menu-dropdown:hover) {
	background-color: #2e2e2e;
}

.menu-dropdown li > .menu-btn {
	border-right: 1px solid var(--border-color);
	border-left: 1px solid var(--border-color);
	border-bottom: 0.2px solid var(--border-color);
	border-top: 0.2px solid var(--border-color);
}
.menu-dropdown li:last-child > .menu-btn {
	border-bottom: 1px solid var(--border-color);
}
.menu-dropdown li:first-child > .menu-btn {
	border-top: 1px solid var(--border-color);
	margin-bottom: -1px;
}

.menu-dropdown {
	padding: 0;
	padding-top: 5px;
	margin: 0;
	list-style: none;
	z-index: 2;
	min-width: 160px;
	white-space: nowrap;
}

.menu-dropdown .menu-btn {
	background-color: #1e1e1e;
	color: white;
	text-align: left;
	padding: 8px 16px;
	display: block;
	width: 100%;
	border: none;

	&.unimplemented {
		color: #3e3e3e;
	}
}

.menu-dropdown .menu-dropdown {
	margin-left: 100%;
	padding-left: 2px;
	position: absolute;
	display: none;
}
.menu-dropdown .menu-dropdown::before {
	content: ' ';
	position: absolute;
	z-index: -1;
	top: -50px; /* -30 */
	left: -6px; /* -2 */
	/* height: 20px; */
	bottom: 50px;
	border: 35px solid transparent; /* 5 */
}

.menu-btn:hover + .menu-dropdown,
.menu-dropdown:hover {
	display: block;
}

.menu-btn:focus {
	outline: none;
}

.menu-dropdown .menu-btn:hover {
	background-color: #2e2e2e;
}
.menu-dropdown .menu-dropdown {
	.menu-btn:not(.menu-list > li > ul > li > .menu-btn):not(
			.menu-list > li > .menu-btn
		) {
		transform: translateY(-100%) translateY(-4.5px) translateX(-1px);
	}
}
.menu-btn:has(+ ul)::after {
	content: '>';
	font-family: var(--font-family-alt);
}
.menu-list > li > .menu-btn::after {
	content: none;
}
.menu-btn::after {
	position: absolute;
	width: 10px;
	left: 88%;
}
</style>
