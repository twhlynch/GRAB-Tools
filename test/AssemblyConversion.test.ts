import { asm_to_json, json_to_asm } from '@/assets/AssemblyConversion';
import {
	create_connection,
	PropertyType,
} from '@/assets/encoding/gasm/connections';
import { levelNodeWithGASM } from '@/generated/nodes';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
	// eslint-disable-next-line
	(globalThis as any).window = {};
});

const tests: Record<string, ([PropertyType, string] | [PropertyType])[]> = {
	copy_properties: [['player'], ['position', 'Obj'], ['rotation', 'Obj']],
	get_player_by_name: [['player'], ['position', 'Obj'], ['rotation', 'Obj']],
	write_text_on_sign: [['sign', 'Obj']],
};

describe('asm_to_json roundtrip', () => {
	it.each(Object.keys(tests))(
		'%s compiles and converts successfully',
		(file) => {
			const path = resolve(__dirname, '../public/gasm', `${file}.asm`);
			const source = readFileSync(path, 'utf-8');

			const node = levelNodeWithGASM();

			for (const register of tests[file] ?? []) {
				const [type, name] = register;
				const id = type === 'player' ? 0 : 1;
				create_connection(node, undefined, id, type, name);
			}

			expect(asm_to_json(source, node)).toBeDefined();
			expect(json_to_asm(node).length).toBeGreaterThan(0);
		},
	);
});
