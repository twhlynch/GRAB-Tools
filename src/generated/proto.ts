export interface Level {
	formatVersion?: number;
	title?: string;
	creators?: string;
	description?: string;
	complexity?: number;
	levelNodes?: LevelNode[];
	maxCheckpointCount?: number;
	ambienceSettings?: AmbienceSettings;
	tags?: string[];
	defaultSpawnPointID?: number;
	unlisted?: boolean;
	showReplays?: boolean;
}

export interface Vector {
	x?: number;
	y?: number;
	z?: number;
}

export interface Vector2 {
	x?: number;
	y?: number;
}

export interface Quaternion {
	x?: number;
	y?: number;
	z?: number;
	w?: number;
}

export interface Color {
	r?: number;
	g?: number;
	b?: number;
	a?: number;
}

export interface AmbienceSettings {
	skyZenithColor?: Color;
	skyHorizonColor?: Color;
	sunAltitude?: number;
	sunAzimuth?: number;
	sunSize?: number;
	fogDensity?: number;
}

export enum LevelNodeShape {
	START = 0,
	FINISH = 1,
	SIGN = 2,
	GRAVITY = 3,
	LOBBYTERMINAL = 4,
	PARTICLE_EMITTER = 5,
	SOUND = 6,
	GASM = 7,
	__END_OF_SPECIAL_PARTS__ = 8,
	CUBE = 1000,
	SPHERE = 1001,
	CYLINDER = 1002,
	PYRAMID = 1003,
	PRISM = 1004,
	CONE = 1005,
	PYRAMIDSQUARE = 1006,
}

export enum LevelNodeMaterial {
	DEFAULT = 0,
	GRABBABLE = 1,
	ICE = 2,
	LAVA = 3,
	WOOD = 4,
	GRAPPLABLE = 5,
	GRAPPLABLE_LAVA = 6,
	GRABBABLE_CRUMBLING = 7,
	DEFAULT_COLORED = 8,
	BOUNCING = 9,
	SNOW = 10,
	TRIGGER = 11,
}

export enum InterpolationType {
	LINEAR = 0,
	QUADRATIC_EASE_IN = 1,
	QUADRATIC_EASE_OUT = 2,
	QUADRATIC_EASE_IN_OUT = 3,
	SINUSOIDAL_EASE_IN = 4,
	SINUSOIDAL_EASE_OUT = 5,
	SINUSOIDAL_EASE_IN_OUT = 6,
	EXPONENTIAL_EASE_IN = 7,
	EXPONENTIAL_EASE_OUT = 8,
	EXPONENTIAL_EASE_IN_OUT = 9,
	CIRCULAR_EASE_IN = 10,
	CIRCULAR_EASE_OUT = 11,
	CIRCULAR_EASE_IN_OUT = 12,
	CUBIC_EASE_IN = 13,
	CUBIC_EASE_OUT = 14,
	CUBIC_EASE_IN_OUT = 15,
	QUARTIC_EASE_IN = 16,
	QUARTIC_EASE_OUT = 17,
	QUARTIC_EASE_IN_OUT = 18,
	QUINTIC_EASE_IN = 19,
	QUINTIC_EASE_OUT = 20,
	QUINTIC_EASE_IN_OUT = 21,
}

export interface LevelNodeGroup {
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	childNodes?: LevelNode[];
	name?: string;
	physicsObject?: boolean;
	localPhysicsObject?: boolean;
	mass?: number;
}

export interface LevelNodeStart {
	position?: Vector;
	rotation?: Quaternion;
	radius?: number;
	name?: string;
	isHidden?: boolean;
}

export interface LevelNodeFinish {
	position?: Vector;
	radius?: number;
}

export interface LevelNodeStatic {
	shape?: LevelNodeShape;
	material?: LevelNodeMaterial;
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	color1?: Color;
	isNeon?: boolean;
	isTransparent?: boolean;
	color2?: Color;
	isGrabbable?: boolean;
	isGrapplable?: boolean;
	isPassable?: boolean;
}

export interface LevelNodeCrumbling {
	shape?: LevelNodeShape;
	material?: LevelNodeMaterial;
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	stableTime?: number;
	respawnTime?: number;
}

export interface LevelNodeSign {
	position?: Vector;
	rotation?: Quaternion;
	text?: string;
	scale?: number;
	color?: Color;
	hideModel?: boolean;
	weight?: LevelNodeSignSignFontWeight;
}

export interface LevelNodeGravity {
	mode?: LevelNodeGravityMode;
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	direction?: Vector;
}

export interface LevelNodeLobbyTerminal {
	position?: Vector;
	rotation?: Quaternion;
}

export interface LevelNodeParticleEmitter {
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	particlesPerSecond?: number;
	lifeSpan?: Vector2;
	startColor?: Color;
	endColor?: Color;
	startSize?: Vector2;
	endSize?: Vector2;
	velocity?: Vector;
	velocityMin?: Vector;
	velocityMax?: Vector;
	accelerationMin?: Vector;
	accelerationMax?: Vector;
}

export interface TriggerSourceBasic {
	type?: TriggerSourceBasicType;
}

export interface TriggerSourceBlockNames {
	names?: string[];
}

export interface TriggerSource {
	triggerSourceBasic?: TriggerSourceBasic;
	triggerSourceBlockNames?: TriggerSourceBlockNames;
}

export interface TriggerTargetAnimation {
	objectID?: number;
	animationName?: string;
	loop?: boolean;
	reverse?: boolean;
	mode?: TriggerTargetAnimationMode;
}

export interface TriggerTargetSound {
	objectID?: number;
	mode?: TriggerTargetSoundMode;
	repeat?: boolean;
}

export interface TriggerTargetGASM {
	objectID?: number;
	mode?: TriggerTargetGASMMode;
}

export interface TriggerTargetSubLevel {
	levelIdentifier?: string;
	spawnPoint?: string;
}

export interface TriggerTargetAmbience {
	skyColor0?: Color;
	skyColor1?: Color;
	sunAltitude?: number;
	sunAzimuth?: number;
	sunSize?: number;
	fogDensity?: number;
	changeDuration?: number;
	interpolationType?: InterpolationType;
}

export interface TriggerTarget {
	triggerTargetAnimation?: TriggerTargetAnimation;
	triggerTargetSubLevel?: TriggerTargetSubLevel;
	triggerTargetSound?: TriggerTargetSound;
	mode?: TriggerTargetMode;
	triggerTargetAmbience?: TriggerTargetAmbience;
	triggerTargetGASM?: TriggerTargetGASM;
}

export interface LevelNodeTrigger {
	shape?: LevelNodeShape;
	position?: Vector;
	scale?: Vector;
	rotation?: Quaternion;
	isShared?: boolean;
	triggerSources?: TriggerSource[];
	triggerTargets?: TriggerTarget[];
}

export interface SoundGeneratorParameters {
	volume?: number;
	waveType?: SoundGeneratorParametersWaveType;
	envelopeAttack?: number;
	envelopeSustain?: number;
	envelopeRelease?: number;
	envelopePunch?: number;
	frequencyBase?: number;
	frequencyLimit?: number;
	frequencyRamp?: number;
	frequencyDeltaRamp?: number;
	vibratoStrength?: number;
	vibratoSpeed?: number;
	pitchJumpMod?: number;
	pitchJumpSpeed?: number;
	dutyCycle?: number;
	dutyCycleRamp?: number;
	repeatSpeed?: number;
	flangerFrequency?: number;
	flangerDepth?: number;
	lowPassFilterFrequency?: number;
	highPassFilterFrequency?: number;
	reverbDelay?: number;
	reverbDecayFactor?: number;
}

export interface LevelNodeSound {
	position?: Vector;
	parameters?: SoundGeneratorParameters;
	name?: string;
	repeat?: boolean;
	volume?: number;
	startActive?: boolean;
	rotation?: Quaternion;
	maxRangeFactor?: number;
}

export interface LevelNodeGASM {
	position?: Vector;
	program?: ProgramData;
	connections?: LevelNodeGASMConnection[];
	startActive?: boolean;
	scale?: Vector;
	rotation?: Quaternion;
	isShared?: boolean;
}

export interface AnimationFrame {
	time?: number;
	position?: Vector;
	rotation?: Quaternion;
}

export interface Animation {
	name?: string;
	frames?: AnimationFrame[];
	direction?: AnimationDirection;
	speed?: number;
	interpolation?: AnimationInterpolation;
}

export interface LevelNode {
	levelNodeStart?: LevelNodeStart;
	levelNodeFinish?: LevelNodeFinish;
	levelNodeStatic?: LevelNodeStatic;
	levelNodeSign?: LevelNodeSign;
	levelNodeCrumbling?: LevelNodeCrumbling;
	isLocked?: boolean;
	levelNodeGroup?: LevelNodeGroup;
	levelNodeGravity?: LevelNodeGravity;
	levelNodeLobbyTerminal?: LevelNodeLobbyTerminal;
	levelNodeTrigger?: LevelNodeTrigger;
	levelNodeParticleEmitter?: LevelNodeParticleEmitter;
	levelNodeSound?: LevelNodeSound;
	levelNodeGASM?: LevelNodeGASM;
	animations?: Animation[];
	activeAnimation?: number;
	wantsCreationHistory?: boolean;
}

export interface OperandData {
	type?: OperandDataType;
	index?: number;
	value?: number;
}

export interface InstructionData {
	type?: InstructionDataType;
	operands?: OperandData[];
}

export interface RegisterData {
	name?: string;
}

export interface LabelData {
	name?: string;
}

export interface ProgramData {
	inputRegisters?: RegisterData[];
	outputRegisters?: RegisterData[];
	workingRegisters?: RegisterData[];
	labels?: LabelData[];
	instructions?: InstructionData[];
	inoutRegisters?: RegisterData[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammablePositionData {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammableRotationData {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammableTriggerActive {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammablePlayerData {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammableSignData {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgrammableColorData {}

export interface ProgrammablePropertyData {
	objectID?: number;
	components?: ProgrammablePropertyDataComponent[];
	position?: ProgrammablePositionData;
	triggerActive?: ProgrammableTriggerActive;
	rotation?: ProgrammableRotationData;
	player?: ProgrammablePlayerData;
	sign?: ProgrammableSignData;
	color?: ProgrammableColorData;
}

export interface ProgrammableSignUpdateData {
	text?: string;
}

export interface ProgrammablePropertyUpdateData {
	components?: number[];
	sign?: ProgrammableSignUpdateData;
}

export enum LevelNodeSignSignFontWeight {
	REGULAR = 0,
	LIGHT = 1,
	SEMIBOLD = 2,
	BOLD = 3,
	ITALIC = 4,
}

export enum LevelNodeGravityMode {
	DEFAULT = 0,
	NOLEGS = 1,
}

export enum TriggerSourceBasicType {
	HAND = 0,
	HEAD = 1,
	GRAPPLE = 2,
	FEET = 3,
	BLOCK = 4,
}

export enum TriggerTargetAnimationMode {
	STOP = 0,
	START = 1,
	TOGGLE = 2,
	TOGGLE_REVERSE = 3,
	RESTART = 4,
	RESET = 5,
}

export enum TriggerTargetSoundMode {
	STOP = 0,
	START = 1,
	TOGGLE = 2,
	RESTART = 3,
	RESET = 4,
}

export enum TriggerTargetGASMMode {
	STOP = 0,
	START = 1,
	TOGGLE = 2,
	RESTART = 3,
	RESET = 4,
}

export enum TriggerTargetMode {
	ONENTER = 0,
	ONLEAVE = 1,
	ONENTERONLEAVE = 2,
	NONE = 3,
}

export enum SoundGeneratorParametersWaveType {
	Square = 0,
	Sawtooth = 1,
	Sine = 2,
	Noise = 3,
}

export interface LevelNodeGASMConnection {
	objectID?: number;
	name?: string;
	properties?: ProgrammablePropertyData[];
	type?: ConnectionType;
}

export enum AnimationDirection {
	RESTART = 0,
	PINGPONG = 1,
}

export enum AnimationInterpolation {
	LINEAR = 0,
	CATMULL_ROM = 1,
}

export enum OperandDataType {
	OpInputRegister = 0,
	OpOutputRegister = 1,
	OpWorkingRegister = 2,
	OpSpecialRegister = 3,
	OpConstant = 4,
	OpLabel = 5,
	OpJumpAddress = 6,
	OpInOutRegister = 7,
}

export enum InstructionDataType {
	InNoop = 0,
	InSet = 1,
	InSwap = 2,
	InAdd = 3,
	InSub = 4,
	InMul = 5,
	InDiv = 6,
	InEqual = 7,
	InLess = 8,
	InGreater = 9,
	InAnd = 10,
	InOr = 11,
	InNot = 12,
	InLabel = 13,
	InGoto = 14,
	InIf = 15,
	InSleep = 16,
	InEnd = 17,
	InRand = 18,
	InFloor = 19,
	InMod = 20,
	InSin = 21,
	InCos = 22,
	InSqrt = 23,
	InAtan2 = 24,
}

export interface ProgrammablePropertyDataComponent {
	inputRegisterIndex?: number;
	outputRegisterIndex?: number;
	inoutRegisterIndex?: number;
}

export enum ConnectionType {
	NODE = 0,
	PLAYER = 1,
}
