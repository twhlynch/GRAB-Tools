import protobuf from 'protobufjs';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import proto from '../../public/proto/proto.proto?raw';

function get_field_name(doc, pos) {
	const text = doc.sliceString(0, pos);
	const match = /"([^"]+)"\s*:\s*([\d]*)$/.exec(text);
	return match ? [match[1], match[2]] : [null, null];
}

function build_completion(name, num, type, parent) {
	return {
		label: `${name} (${num})`,
		type: 'enum',
		detail: parent + '.' + type,
		apply: `${num}`,
		meta: { name, num, type, parent },
	};
}

function collect_enums(type) {
	const enums = [];
	if (type.fields) {
		for (const [name, field] of Object.entries(type.fields)) {
			if (field.resolvedType?.values) {
				enums.push({
					name,
					type: field.type,
					parent: type.name,
					values: field.resolvedType.values,
				});
			}
		}
	}

	if (type.nested) {
		for (const nested of Object.values(type.nested)) {
			enums.push(...collect_enums(nested));
		}
	}

	return enums;
}

function collect_completions(enums) {
	const completions = {};
	enums.forEach((field) => {
		const { values, type, parent } = field;

		Object.entries(values).forEach(([name, num]) => {
			if (type === 'LevelNodeShape' && num < 1000) return;
			completions[field.name] ??= [];
			if (
				!completions[field.name].find(
					(other) =>
						other.meta.type === field.type &&
						other.meta.num === num &&
						other.meta.name === name,
				)
			) {
				completions[field.name].push(
					build_completion(name, num, type, parent),
				);
			}
		});
	});
	return completions;
}

function get_completions(completions, doc, pos) {
	const [field_name, progress] = get_field_name(doc, pos);
	if (!field_name) return null;

	const options = completions[field_name];
	if (!options) return null;

	const filtered = options
		.filter(
			(option) =>
				option.apply.startsWith(progress) && option.apply !== progress,
		)
		.map((option) => {
			const new_option = {
				...option,
				apply: option.apply.replace(progress, ''),
			};
			if (new_option.apply === '') {
				new_option.apply = ' ';
			}
			return new_option;
		});
	if (!filtered.length) return null;

	return filtered;
}

export function grabCompletion() {
	const parsed = protobuf.parse(proto);
	const root = parsed.root;
	root.resolveAll();
	const enums = collect_enums(root);
	const completions = collect_completions(enums);

	const completion_source = autocompletion({
		override: [
			(ctx) => {
				const from = ctx.pos;
				const doc = ctx.state.doc;

				const options = get_completions(completions, doc, from);
				if (!options?.length) return null;

				return {
					from,
					options,
				};
			},
		],
	});

	const colon_trigger = EditorView.updateListener.of((update) => {
		if (!update.docChanged) return;

		for (const transaction of update.transactions) {
			const inserted = transaction.changes.toString();
			if (!inserted) continue;

			if (inserted.includes(':')) {
				startCompletion(update.view);
				break;
			}
		}
	});

	return [completion_source, colon_trigger];
}
