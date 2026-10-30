export interface BaseInput {
	label?: string;
	text?: string;
}

export type TextareaInput = BaseInput & {
	type: 'textarea';
};
export type RangeInput = BaseInput & {
	type: 'range';
	min: number;
	max: number;
	value: number;
	step?: number;
};
export type CheckboxInput = BaseInput & {
	type: 'checkbox';
	default?: boolean;
};
export type FileInput = BaseInput & {
	type: 'file';
	accept?: string;
	multiple?: boolean;
};

export type OptionInput<Options extends readonly string[] = readonly string[]> =
	BaseInput & {
		type: 'option';
		options: Options;
	};

export type SpecificInput =
	OptionInput | TextareaInput | RangeInput | CheckboxInput | FileInput;
export type UnspecifiedInput = BaseInput & {
	type: Exclude<string, Pick<SpecificInput, 'type'>>;
	text?: string;
	accept?: string;
	multiple?: boolean;
};

export type Input = SpecificInput | UnspecifiedInput;

export type InputResult<I> = I extends { type: 'file' }
	? File[]
	: I extends { type: 'checkbox' }
		? boolean
		: I extends { type: 'range' }
			? number
			: I extends { type: 'option'; options: readonly (infer O)[] }
				? O
				: string;

export type InputResults<Options extends readonly Input[]> = {
	[K in keyof Options]: InputResult<Options[K]>;
};

export type PopupFunction = <const Options extends readonly Input[]>(
	inputs: Options,
	func: (...data: InputResults<Options>) => void | Promise<void>,
) => void;

export interface PopupOptions<
	Options extends readonly Input[] = readonly Input[],
> {
	inputs: Options;
	func: (...data: InputResults<Options>) => void | Promise<void>;
}
