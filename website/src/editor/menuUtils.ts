import { format_type, materials, shapes } from '@/common/utils';
import { Menu } from '@/components/EditorPanels/menu';
import {
	LevelNodeKey,
	levelNodeMetadata,
} from '@grab-tools/lib/generated/nodes';
import {
	LevelNodeMaterial,
	LevelNodeShape,
} from '@grab-tools/lib/generated/proto';

export function shape_menu(func: (shape: LevelNodeShape) => void): Menu {
	return {
		...Object.fromEntries(
			Array.from(
				{
					length:
						Object.entries(shapes()).length -
						shapes().__END_OF_SPECIAL_PARTS__ -
						1,
				},
				(_, i) => {
					return [
						format_type(shapes()[1000 + i]!),
						{
							func: () => {
								func(1000 + i);
							},
						},
					];
				},
			),
		),
	};
}

export function material_menu(
	func: (material: LevelNodeMaterial) => void,
): Menu {
	return {
		...Object.fromEntries(
			Array.from(
				{
					length: Object.entries(materials()).length,
				},
				(_, i) => {
					return [
						format_type(materials()[i]!),
						{
							func: () => {
								func(i);
							},
							num: i,
						},
					] as [string, { func: () => void; num: LevelNodeMaterial }];
				},
			).filter((item) => item[1].num !== LevelNodeMaterial.TRIGGER),
		),
	};
}

export function type_menu(
	func: (type: LevelNodeKey) => void,
	exclude: LevelNodeKey[] = [],
): Menu {
	return {
		...Object.fromEntries(
			levelNodeMetadata
				.filter((metadata) => !exclude.includes(metadata.camel))
				.map((metadata) => [
					metadata.scope,
					{
						func: () => {
							func(metadata.camel);
						},
					},
				]),
		),
	};
}
