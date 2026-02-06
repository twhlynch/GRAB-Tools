import * as proto from './proto';

function merge<T extends object>(target: T, source: Partial<T>): T {
	for (const key in source) {
		const srcVal = source[key];
		const tgtVal = target[key];

		if (
			srcVal !== undefined &&
			typeof srcVal === 'object' &&
			!Array.isArray(srcVal)
		) {
			if (
				!tgtVal ||
				typeof tgtVal !== 'object' ||
				Array.isArray(tgtVal)
			) {
				target[key] = {} as T[typeof key];
			}
			merge(
				target[key] as T[keyof T] & object,
				srcVal as Partial<T[keyof T]>,
			);
		} else {
			target[key] = srcVal as T[Extract<keyof T, string>];
		}
	}
	return target;
}

export function level(overrides?: Partial<proto.Level>): proto.Level {
	const obj: proto.Level = {
		formatVersion: 0,
		title: '',
		creators: '',
		description: '',
		complexity: 0,
		levelNodes: [],
		maxCheckpointCount: 0,
		ambienceSettings: ambienceSettings(),
		tags: [],
		defaultSpawnPointID: 0,
		unlisted: false,
		showReplays: true,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function vector(overrides?: Partial<proto.Vector>): proto.Vector {
	const obj: proto.Vector = {
		x: 0,
		y: 0,
		z: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function vector2(overrides?: Partial<proto.Vector2>): proto.Vector2 {
	const obj: proto.Vector2 = {
		x: 0,
		y: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function quaternion(
	overrides?: Partial<proto.Quaternion>,
): proto.Quaternion {
	const obj: proto.Quaternion = {
		x: 0,
		y: 0,
		z: 0,
		w: 1,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function color(overrides?: Partial<proto.Color>): proto.Color {
	const obj: proto.Color = {
		r: 0,
		g: 0,
		b: 0,
		a: 1,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ambienceSettings(
	overrides?: Partial<proto.AmbienceSettings>,
): proto.AmbienceSettings {
	const obj: proto.AmbienceSettings = {
		skyZenithColor: color(),
		skyHorizonColor: color(),
		sunAltitude: 0,
		sunAzimuth: 0,
		sunSize: 0,
		fogDensity: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeGroup(
	overrides?: Partial<proto.LevelNodeGroup>,
): proto.LevelNodeGroup {
	const obj: proto.LevelNodeGroup = {
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		childNodes: [],
		name: '',
		physicsObject: false,
		localPhysicsObject: false,
		mass: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeStart(
	overrides?: Partial<proto.LevelNodeStart>,
): proto.LevelNodeStart {
	const obj: proto.LevelNodeStart = {
		position: vector(),
		rotation: quaternion(),
		radius: 0.5,
		name: 'start0',
		isHidden: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeFinish(
	overrides?: Partial<proto.LevelNodeFinish>,
): proto.LevelNodeFinish {
	const obj: proto.LevelNodeFinish = {
		position: vector(),
		radius: 0.5,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeStatic(
	overrides?: Partial<proto.LevelNodeStatic>,
): proto.LevelNodeStatic {
	const obj: proto.LevelNodeStatic = {
		shape: proto.LevelNodeShape.CUBE,
		material: proto.LevelNodeMaterial.DEFAULT,
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		color1: color(),
		isNeon: false,
		isTransparent: false,
		color2: color(),
		isGrabbable: false,
		isGrapplable: false,
		isPassable: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeCrumbling(
	overrides?: Partial<proto.LevelNodeCrumbling>,
): proto.LevelNodeCrumbling {
	const obj: proto.LevelNodeCrumbling = {
		shape: proto.LevelNodeShape.CUBE,
		material: proto.LevelNodeMaterial.GRABBABLE_CRUMBLING,
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		stableTime: 5,
		respawnTime: 5,
		isLocal: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeSign(
	overrides?: Partial<proto.LevelNodeSign>,
): proto.LevelNodeSign {
	const obj: proto.LevelNodeSign = {
		position: vector(),
		rotation: quaternion(),
		text: 'Text',
		scale: 1,
		color: { r: 1, g: 1, b: 1 },
		hideModel: false,
		weight: proto.LevelNodeSignSignFontWeight.REGULAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeGravity(
	overrides?: Partial<proto.LevelNodeGravity>,
): proto.LevelNodeGravity {
	const obj: proto.LevelNodeGravity = {
		mode: proto.LevelNodeGravityMode.DEFAULT,
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		direction: { x: 0, y: 1, z: 0 },
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeLobbyTerminal(
	overrides?: Partial<proto.LevelNodeLobbyTerminal>,
): proto.LevelNodeLobbyTerminal {
	const obj: proto.LevelNodeLobbyTerminal = {
		position: vector(),
		rotation: quaternion(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeParticleEmitter(
	overrides?: Partial<proto.LevelNodeParticleEmitter>,
): proto.LevelNodeParticleEmitter {
	const obj: proto.LevelNodeParticleEmitter = {
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		particlesPerSecond: 10,
		lifeSpan: { x: 1, y: 2 },
		startColor: { r: 1, g: 1, b: 1 },
		endColor: color(),
		startSize: { x: 1, y: 2 },
		endSize: { x: 0.5, y: 1 },
		velocity: { x: 0.1, y: 0.1, z: 0.1 },
		velocityMin: { x: -0.1, y: -0.1, z: -0.1 },
		velocityMax: { x: 0.1, y: 0.1, z: 0.1 },
		accelerationMin: { x: -0.1, y: -0.1, z: -0.1 },
		accelerationMax: { x: 0.1, y: 0.1, z: 0.1 },
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerSourceBasic(
	overrides?: Partial<proto.TriggerSourceBasic>,
): proto.TriggerSourceBasic {
	const obj: proto.TriggerSourceBasic = {
		type: proto.TriggerSourceBasicType.HAND,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerSourceBlockNames(
	overrides?: Partial<proto.TriggerSourceBlockNames>,
): proto.TriggerSourceBlockNames {
	const obj: proto.TriggerSourceBlockNames = {
		names: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerSource(
	overrides?: Partial<proto.TriggerSource>,
): proto.TriggerSource {
	const obj: proto.TriggerSource = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTargetAnimation(
	overrides?: Partial<proto.TriggerTargetAnimation>,
): proto.TriggerTargetAnimation {
	const obj: proto.TriggerTargetAnimation = {
		objectID: 0,
		animationName: 'idle',
		loop: false,
		reverse: false,
		mode: proto.TriggerTargetAnimationMode.TOGGLE_REVERSE,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTargetSound(
	overrides?: Partial<proto.TriggerTargetSound>,
): proto.TriggerTargetSound {
	const obj: proto.TriggerTargetSound = {
		objectID: 0,
		mode: proto.TriggerTargetSoundMode.RESTART,
		repeat: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTargetGASM(
	overrides?: Partial<proto.TriggerTargetGASM>,
): proto.TriggerTargetGASM {
	const obj: proto.TriggerTargetGASM = {
		objectID: 0,
		mode: proto.TriggerTargetGASMMode.RESTART,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTargetSubLevel(
	overrides?: Partial<proto.TriggerTargetSubLevel>,
): proto.TriggerTargetSubLevel {
	const obj: proto.TriggerTargetSubLevel = {
		levelIdentifier: '29r46v7djliny6t4rzvq7:1654257963',
		spawnPoint: 'default',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTargetAmbience(
	overrides?: Partial<proto.TriggerTargetAmbience>,
): proto.TriggerTargetAmbience {
	const obj: proto.TriggerTargetAmbience = {
		skyColor0: color(),
		skyColor1: color(),
		sunAltitude: 0,
		sunAzimuth: 0,
		sunSize: 1,
		fogDensity: 1,
		changeDuration: 1,
		interpolationType: proto.InterpolationType.LINEAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function triggerTarget(
	overrides?: Partial<proto.TriggerTarget>,
): proto.TriggerTarget {
	const obj: proto.TriggerTarget = {
		mode: proto.TriggerTargetMode.ONENTER,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeTrigger(
	overrides?: Partial<proto.LevelNodeTrigger>,
): proto.LevelNodeTrigger {
	const obj: proto.LevelNodeTrigger = {
		shape: proto.LevelNodeShape.CUBE,
		position: vector(),
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		isShared: false,
		triggerSources: [],
		triggerTargets: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function soundGeneratorParameters(
	overrides?: Partial<proto.SoundGeneratorParameters>,
): proto.SoundGeneratorParameters {
	const obj: proto.SoundGeneratorParameters = {
		volume: 1,
		waveType: proto.SoundGeneratorParametersWaveType.Square,
		envelopeAttack: 0,
		envelopeSustain: 0,
		envelopeRelease: 0,
		envelopePunch: 0,
		frequencyBase: 0,
		frequencyLimit: 0,
		frequencyRamp: 0,
		frequencyDeltaRamp: 0,
		vibratoStrength: 0,
		vibratoSpeed: 0,
		pitchJumpMod: 0,
		pitchJumpSpeed: 0,
		dutyCycle: 0,
		dutyCycleRamp: 0,
		repeatSpeed: 0,
		flangerFrequency: 0,
		flangerDepth: 0,
		lowPassFilterFrequency: 0,
		highPassFilterFrequency: 0,
		reverbDelay: 0,
		reverbDecayFactor: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeSound(
	overrides?: Partial<proto.LevelNodeSound>,
): proto.LevelNodeSound {
	const obj: proto.LevelNodeSound = {
		position: vector(),
		parameters: soundGeneratorParameters(),
		name: 'sound0',
		repeat: false,
		volume: 1,
		startActive: false,
		rotation: quaternion(),
		maxRangeFactor: 1,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeGASM(
	overrides?: Partial<proto.LevelNodeGASM>,
): proto.LevelNodeGASM {
	const obj: proto.LevelNodeGASM = {
		position: vector(),
		program: programData(),
		connections: [],
		startActive: false,
		scale: { x: 1, y: 1, z: 1 },
		rotation: quaternion(),
		isShared: false,
		lateUpdate: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function animationFrame(
	overrides?: Partial<proto.AnimationFrame>,
): proto.AnimationFrame {
	const obj: proto.AnimationFrame = {
		time: 0,
		position: vector(),
		rotation: quaternion(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function animation(
	overrides?: Partial<proto.Animation>,
): proto.Animation {
	const obj: proto.Animation = {
		name: 'idle',
		frames: [],
		direction: proto.AnimationDirection.RESTART,
		speed: 1,
		interpolation: proto.AnimationInterpolation.LINEAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNode(
	overrides?: Partial<proto.LevelNode>,
): proto.LevelNode {
	const obj: proto.LevelNode = {
		isLocked: false,
		animations: [],
		activeAnimation: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function operandData(
	overrides?: Partial<proto.OperandData>,
): proto.OperandData {
	const obj: proto.OperandData = {
		type: proto.OperandDataType.OpInputRegister,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function instructionData(
	overrides?: Partial<proto.InstructionData>,
): proto.InstructionData {
	const obj: proto.InstructionData = {
		type: proto.InstructionDataType.InNoop,
		operands: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function registerData(
	overrides?: Partial<proto.RegisterData>,
): proto.RegisterData {
	const obj: proto.RegisterData = {
		name: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function labelData(
	overrides?: Partial<proto.LabelData>,
): proto.LabelData {
	const obj: proto.LabelData = {
		name: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programData(
	overrides?: Partial<proto.ProgramData>,
): proto.ProgramData {
	const obj: proto.ProgramData = {
		inputRegisters: [],
		outputRegisters: [],
		workingRegisters: [
			{ name: 'R0' },
			{ name: 'R1' },
			{ name: 'R2' },
			{ name: 'R3' },
			{ name: 'R4' },
			{ name: 'R5' },
			{ name: 'R6' },
			{ name: 'R7' },
		],
		labels: [],
		instructions: [],
		inoutRegisters: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmablePositionData(
	overrides?: Partial<proto.ProgrammablePositionData>,
): proto.ProgrammablePositionData {
	const obj: proto.ProgrammablePositionData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableRotationData(
	overrides?: Partial<proto.ProgrammableRotationData>,
): proto.ProgrammableRotationData {
	const obj: proto.ProgrammableRotationData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableScaleData(
	overrides?: Partial<proto.ProgrammableScaleData>,
): proto.ProgrammableScaleData {
	const obj: proto.ProgrammableScaleData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableTriggerActive(
	overrides?: Partial<proto.ProgrammableTriggerActive>,
): proto.ProgrammableTriggerActive {
	const obj: proto.ProgrammableTriggerActive = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmablePlayerData(
	overrides?: Partial<proto.ProgrammablePlayerData>,
): proto.ProgrammablePlayerData {
	const obj: proto.ProgrammablePlayerData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableSignData(
	overrides?: Partial<proto.ProgrammableSignData>,
): proto.ProgrammableSignData {
	const obj: proto.ProgrammableSignData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableColorData(
	overrides?: Partial<proto.ProgrammableColorData>,
): proto.ProgrammableColorData {
	const obj: proto.ProgrammableColorData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmablePropertyData(
	overrides?: Partial<proto.ProgrammablePropertyData>,
): proto.ProgrammablePropertyData {
	const obj: proto.ProgrammablePropertyData = {
		objectID: 0,
		components: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmableSignUpdateData(
	overrides?: Partial<proto.ProgrammableSignUpdateData>,
): proto.ProgrammableSignUpdateData {
	const obj: proto.ProgrammableSignUpdateData = {
		text: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmablePropertyUpdateData(
	overrides?: Partial<proto.ProgrammablePropertyUpdateData>,
): proto.ProgrammablePropertyUpdateData {
	const obj: proto.ProgrammablePropertyUpdateData = {
		components: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function levelNodeGASMConnection(
	overrides?: Partial<proto.LevelNodeGASMConnection>,
): proto.LevelNodeGASMConnection {
	const obj: proto.LevelNodeGASMConnection = {
		objectID: 0,
		name: '',
		properties: [],
		type: proto.ConnectionType.NODE,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function programmablePropertyDataComponent(
	overrides?: Partial<proto.ProgrammablePropertyDataComponent>,
): proto.ProgrammablePropertyDataComponent {
	const obj: proto.ProgrammablePropertyDataComponent = {
		inputRegisterIndex: -1,
		outputRegisterIndex: -1,
		inoutRegisterIndex: -1,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}
