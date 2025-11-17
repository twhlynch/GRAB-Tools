import encoding from '@/assets/tools/encoding';

/**
 * @param {Array<Object>} nodes - A list of level nodes
 * @returns {Array<Object>} - A list of level nodes
 */
function monochrome(nodes) {
	nodes.forEach((n) => {
		encoding.traverse_node(n, (node) => {
			let static_node = node.levelNodeStatic;
			if (static_node?.material !== 8) return;
			if (static_node.color1) {
				monochrom_color(static_node.color1);
			}
			if (static_node.color2) {
				monochrom_color(static_node.color2);
			}
		});
	});

	return nodes;
}

function monochrom_color(color) {
	const r = color.r ?? 0;
	const g = color.g ?? 0;
	const b = color.b ?? 0;

	const brightness = Math.sqrt(
		0.299 * Math.pow(r, 2) +
			0.587 * Math.pow(g, 2) +
			0.114 * Math.pow(b, 2),
	);

	color.r = brightness;
	color.g = brightness;
	color.b = brightness;
}

export default {
	monochrome,
};
