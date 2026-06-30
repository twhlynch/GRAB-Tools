<script lang="ts">
import { defineComponent, PropType } from 'vue';

type MenuLeaf =
	| {
			func: (e?: Event) => void;
			file?: boolean;
	  }
	| {
			href: string;
	  };

type MenuItem = MenuLeaf | Menu;
export interface Menu {
	[key: string]: MenuItem;
}

export default defineComponent({
	props: {
		menu: {
			type: Object as PropType<Menu>,
			required: true,
		},
		callback: {
			type: Function as PropType<() => void | undefined>,
			default: undefined,
		},
	},

	methods: {
		is_leaf(item: MenuItem): item is MenuLeaf {
			return 'func' in item || 'href' in item;
		},
		call(func: (e?: Event) => void, e?: Event) {
			this.callback?.();
			func(e);
		},
	},
});
</script>

<template>
	<ul class="menu-dropdown">
		<li v-for="[name, item] of Object.entries(menu)" :key="name">
			<template v-if="is_leaf(item)">
				<a v-if="'href' in item" class="menu-btn" :href="item.href">
					{{ name }}
				</a>

				<button
					v-else
					class="menu-btn"
					@click="!item.file && call(item.func)"
				>
					{{ name }}
					<input
						v-if="item.file"
						type="file"
						@change="call(item.func, $event)"
					/>
				</button>
			</template>

			<template v-else>
				<button class="menu-btn">
					{{ name }}
				</button>

				<DropDown :menu="item" :callback="callback" />
			</template>
		</li>
	</ul>
</template>

<style scoped>
/* menu */
.menu-dropdown {
	display: none;
	position: absolute;
	top: 100%;
	left: 0;

	min-width: 180px;
	margin: 0;
	padding: 0;
	list-style: none;

	background: #1e1e1e;
	z-index: 1000;
}

li:hover > .menu-dropdown {
	display: block;
}

.menu-dropdown > li {
	position: relative;
}

.menu-dropdown .menu-dropdown {
	top: 0;
	left: 100%;
}

.menu-dropdown > li:hover > .menu-dropdown {
	display: block;
}

.menu-dropdown .menu-dropdown::before {
	content: '';
	position: absolute;
	top: 0;
	left: -6px;
	width: 6px;
	height: 100%;
}

/* buttons */
.menu-btn {
	width: 100%;
	display: block;
	padding: 8px 16px;

	background-color: #1e1e1e;
	color: white;
	font-size: 0.8rem;
	text-align: left;

	border: 1px solid var(--border-color);
	border-bottom: none;
	border-top-width: 0.2px;
	border-bottom-width: 0.2px;

	cursor: pointer;
}

li:last-child > .menu-btn {
	border-bottom: 1px solid var(--border-color);
}

.menu-dropdown > li:hover > .menu-btn {
	background-color: #2e2e2e;
}

.menu-btn:has(+ .menu-dropdown)::after {
	content: '›';
	float: right;
	opacity: 0.7;
}

.menu-btn.unimplemented {
	color: #555;
}

.menu-btn:focus {
	outline: none;
}

/* other */
input[type='file'] {
	display: none;
}

a {
	text-decoration: none;
	color: inherit;
	cursor: pointer;
}
</style>
