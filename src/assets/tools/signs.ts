import { LevelNodeSign } from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';

function signs(text: string, animated: boolean) {
	const nodes = animated
		? text_to_signs_animated(text)
		: text_to_signs(text, 16, 'horizontal');

	return nodes;
}

// TODO: refactor this whole file
function text_to_signs(
	text: string,
	wpm: number,
	direction: 'horizontal' | 'vertical',
) {
	const words = text.split(' ');

	const splitStrings = [];
	for (let i = 0; i < words.length; i += wpm) {
		const chunk = words.slice(i, i + wpm);
		splitStrings.push(chunk.join(' '));
	}
	const nodes: LevelNodeWith<LevelNodeSign>[] = [];
	splitStrings.forEach((str, i) => {
		const sign = {
			levelNodeSign: {
				position: { x: 0, y: 0, z: 0 },
				rotation: { w: 1.0 },
				text: str,
			},
		};
		if (direction == 'horizontal') {
			sign.levelNodeSign.position.x = i;
		} else {
			sign.levelNodeSign.position.y = -i;
		}
		nodes.push(sign);
	});

	return nodes;
}

function text_to_signs_animated(text: string) {
	// config
	const char_width = 0.05;
	const appearance_time = 2;
	const interval = 0.1;
	const visible_length = 40;
	const foreward_pos = 1;
	const levelNodes: LevelNodeWith<LevelNodeSign>[] = [];
	const last_10 = [];
	let count = 0;
	let active_position = 0;
	let height = 0;

	let wants_return = false;

	for (let i = 0; i < text.split('').length; i++) {
		const char = text.charAt(i);
		if (char == '\n') {
			wants_return = true;
		}
		let sign_iter = find_char(char, last_10, levelNodes);
		if (sign_iter === -1) {
			levelNodes.push({
				levelNodeSign: {
					position: {},
					rotation: {
						w: 1.0,
					},
					text: char,
				},
				animations: [
					{
						frames: [
							{
								position: {},
								rotation: {
									w: 1.0,
								},
							},
						],
						name: 'idle',
						speed: 1,
					},
				],
			});
		}

		sign_iter = find_char(char, last_10, levelNodes);
		last_10.push(sign_iter);

		if (last_10.length > appearance_time / interval) {
			last_10.pop();
		}

		const frames = levelNodes[sign_iter]!.animations![0]!.frames!;

		frames.push({
			position: {
				z: 1 * foreward_pos,
				y: height * char_width * -2,
				x: 1 * active_position * char_width,
			},
			rotation: {
				w: 1.0,
			},
			time: count * interval,
		});

		frames.push({
			position: {
				z: 1 * foreward_pos,
				y: height * char_width * -2,
				x: 1 * active_position * char_width,
			},
			rotation: {
				w: 1.0,
			},
			time: count * interval + appearance_time,
		});

		frames.push({
			position: {},
			rotation: {
				w: 1.0,
			},
			time: count * interval + appearance_time,
		});

		active_position += 1;
		if (active_position > visible_length) {
			wants_return = true;
		}
		if (wants_return && char == ' ') {
			active_position = 0;
			height += 1;
			wants_return = false;
		}

		count++;
	}

	for (const node of levelNodes) {
		node.animations![0]!.frames!.push({
			position: {
				x: 0,
				y: 0,
				z: 0,
			},
			rotation: {
				w: 1.0,
			},
			time: count * interval + appearance_time + 1,
		});
	}
	return levelNodes;
}

function find_char(
	char: string,
	last_10: number[],
	nodes: LevelNodeWith<LevelNodeSign>[],
) {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i]!.levelNodeSign.text == char && !last_10.includes(i)) {
			return i;
		}
	}
	return -1;
}

export default {
	signs,
};
