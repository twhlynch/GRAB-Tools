import { LevelNodeGASMConnection, ProgramData } from '@/generated/proto';

// key of ProgramData matching /^.*Registers$/
export type RegisterType = {
	[K in keyof ProgramData & string]: K extends `${string}Registers`
		? K
		: never;
}[keyof ProgramData];

export const SPECIAL_REGISTERS = [
	'ProgramCounter', // index of instruction
	'Halt', // is the program halted
	'HaltFrame', // is the frame halted
	'SleepTimer', // how long is the frame still sleeping for
	'DeltaTime', // time since last frame
];

/**
 * @brief Add a register to a LevelNodeGASM program
 *
 * If the object is already connected, merge properties and components.
 * Returns the index of the register.
 */
export function add_register(
	program: ProgramData,
	register: LevelNodeGASMConnection,
	type: RegisterType,
): number {
	const registers = (program[type] ??= []);

	const existing_index = registers.findIndex(
		(reg) => reg.name === register.name,
	);

	if (existing_index === -1) {
		registers.push(register);
		return registers.length - 1;
	} else {
		return existing_index;
	}
}
