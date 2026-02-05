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

export function Level(overrides?: Partial<proto.Level>): proto.Level {
	const obj: proto.Level = {
		formatVersion: 0,
		title: '',
		creators: '',
		description: '',
		complexity: 0,
		levelNodes: [],
		maxCheckpointCount: 0,
		ambienceSettings: AmbienceSettings(),
		tags: [],
		defaultSpawnPointID: 0,
		unlisted: false,
		showReplays: true,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function Vector(overrides?: Partial<proto.Vector>): proto.Vector {
	const obj: proto.Vector = {
		x: 0,
		y: 0,
		z: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function Vector2(overrides?: Partial<proto.Vector2>): proto.Vector2 {
	const obj: proto.Vector2 = {
		x: 0,
		y: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function Quaternion(
	overrides?: Partial<proto.Quaternion>,
): proto.Quaternion {
	const obj: proto.Quaternion = {
		x: 0,
		y: 0,
		z: 0,
		w: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function Color(overrides?: Partial<proto.Color>): proto.Color {
	const obj: proto.Color = {
		r: 0,
		g: 0,
		b: 0,
		a: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function AmbienceSettings(
	overrides?: Partial<proto.AmbienceSettings>,
): proto.AmbienceSettings {
	const obj: proto.AmbienceSettings = {
		skyZenithColor: Color(),
		skyHorizonColor: Color(),
		sunAltitude: 0,
		sunAzimuth: 0,
		sunSize: 0,
		fogDensity: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeGroup(
	overrides?: Partial<proto.LevelNodeGroup>,
): proto.LevelNodeGroup {
	const obj: proto.LevelNodeGroup = {
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		childNodes: [],
		name: '',
		physicsObject: false,
		localPhysicsObject: false,
		mass: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeStart(
	overrides?: Partial<proto.LevelNodeStart>,
): proto.LevelNodeStart {
	const obj: proto.LevelNodeStart = {
		position: Vector(),
		rotation: Quaternion(),
		radius: 0,
		name: '',
		isHidden: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeFinish(
	overrides?: Partial<proto.LevelNodeFinish>,
): proto.LevelNodeFinish {
	const obj: proto.LevelNodeFinish = {
		position: Vector(),
		radius: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeStatic(
	overrides?: Partial<proto.LevelNodeStatic>,
): proto.LevelNodeStatic {
	const obj: proto.LevelNodeStatic = {
		shape: proto.LevelNodeShape.CUBE,
		material: proto.LevelNodeMaterial.DEFAULT,
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		color1: Color(),
		isNeon: false,
		isTransparent: false,
		color2: Color(),
		isGrabbable: false,
		isGrapplable: false,
		isPassable: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeCrumbling(
	overrides?: Partial<proto.LevelNodeCrumbling>,
): proto.LevelNodeCrumbling {
	const obj: proto.LevelNodeCrumbling = {
		shape: proto.LevelNodeShape.CUBE,
		material: proto.LevelNodeMaterial.DEFAULT,
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		stableTime: 0,
		respawnTime: 0,
		isLocal: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeSign(
	overrides?: Partial<proto.LevelNodeSign>,
): proto.LevelNodeSign {
	const obj: proto.LevelNodeSign = {
		position: Vector(),
		rotation: Quaternion(),
		text: '',
		scale: 0,
		color: Color(),
		hideModel: false,
		weight: proto.LevelNodeSignSignFontWeight.REGULAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeGravity(
	overrides?: Partial<proto.LevelNodeGravity>,
): proto.LevelNodeGravity {
	const obj: proto.LevelNodeGravity = {
		mode: proto.LevelNodeGravityMode.DEFAULT,
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		direction: Vector(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeLobbyTerminal(
	overrides?: Partial<proto.LevelNodeLobbyTerminal>,
): proto.LevelNodeLobbyTerminal {
	const obj: proto.LevelNodeLobbyTerminal = {
		position: Vector(),
		rotation: Quaternion(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeParticleEmitter(
	overrides?: Partial<proto.LevelNodeParticleEmitter>,
): proto.LevelNodeParticleEmitter {
	const obj: proto.LevelNodeParticleEmitter = {
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		particlesPerSecond: 0,
		lifeSpan: Vector2(),
		startColor: Color(),
		endColor: Color(),
		startSize: Vector2(),
		endSize: Vector2(),
		velocity: Vector(),
		velocityMin: Vector(),
		velocityMax: Vector(),
		accelerationMin: Vector(),
		accelerationMax: Vector(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerSourceBasic(
	overrides?: Partial<proto.TriggerSourceBasic>,
): proto.TriggerSourceBasic {
	const obj: proto.TriggerSourceBasic = {
		type: proto.TriggerSourceBasicType.HAND,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerSourceBlockNames(
	overrides?: Partial<proto.TriggerSourceBlockNames>,
): proto.TriggerSourceBlockNames {
	const obj: proto.TriggerSourceBlockNames = {
		names: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerSource(
	overrides?: Partial<proto.TriggerSource>,
): proto.TriggerSource {
	const obj: proto.TriggerSource = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerTargetAnimation(
	overrides?: Partial<proto.TriggerTargetAnimation>,
): proto.TriggerTargetAnimation {
	const obj: proto.TriggerTargetAnimation = {
		objectID: 0,
		animationName: '',
		loop: false,
		reverse: false,
		mode: proto.TriggerTargetAnimationMode.TOGGLE_REVERSE,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerTargetSound(
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

export function TriggerTargetGASM(
	overrides?: Partial<proto.TriggerTargetGASM>,
): proto.TriggerTargetGASM {
	const obj: proto.TriggerTargetGASM = {
		objectID: 0,
		mode: proto.TriggerTargetGASMMode.RESTART,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerTargetSubLevel(
	overrides?: Partial<proto.TriggerTargetSubLevel>,
): proto.TriggerTargetSubLevel {
	const obj: proto.TriggerTargetSubLevel = {
		levelIdentifier: '',
		spawnPoint: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerTargetAmbience(
	overrides?: Partial<proto.TriggerTargetAmbience>,
): proto.TriggerTargetAmbience {
	const obj: proto.TriggerTargetAmbience = {
		skyColor0: Color(),
		skyColor1: Color(),
		sunAltitude: 0,
		sunAzimuth: 0,
		sunSize: 0,
		fogDensity: 0,
		changeDuration: 0,
		interpolationType: proto.InterpolationType.LINEAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function TriggerTarget(
	overrides?: Partial<proto.TriggerTarget>,
): proto.TriggerTarget {
	const obj: proto.TriggerTarget = {
		mode: proto.TriggerTargetMode.ONENTER,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeTrigger(
	overrides?: Partial<proto.LevelNodeTrigger>,
): proto.LevelNodeTrigger {
	const obj: proto.LevelNodeTrigger = {
		shape: proto.LevelNodeShape.CUBE,
		position: Vector(),
		scale: Vector(),
		rotation: Quaternion(),
		isShared: false,
		triggerSources: [],
		triggerTargets: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function SoundGeneratorParameters(
	overrides?: Partial<proto.SoundGeneratorParameters>,
): proto.SoundGeneratorParameters {
	const obj: proto.SoundGeneratorParameters = {
		volume: 0,
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

export function LevelNodeSound(
	overrides?: Partial<proto.LevelNodeSound>,
): proto.LevelNodeSound {
	const obj: proto.LevelNodeSound = {
		position: Vector(),
		parameters: SoundGeneratorParameters(),
		name: '',
		repeat: false,
		volume: 0,
		startActive: false,
		rotation: Quaternion(),
		maxRangeFactor: 0,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeGASM(
	overrides?: Partial<proto.LevelNodeGASM>,
): proto.LevelNodeGASM {
	const obj: proto.LevelNodeGASM = {
		position: Vector(),
		program: ProgramData(),
		connections: [],
		startActive: false,
		scale: Vector(),
		rotation: Quaternion(),
		isShared: false,
		lateUpdate: false,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function AnimationFrame(
	overrides?: Partial<proto.AnimationFrame>,
): proto.AnimationFrame {
	const obj: proto.AnimationFrame = {
		time: 0,
		position: Vector(),
		rotation: Quaternion(),
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function Animation(
	overrides?: Partial<proto.Animation>,
): proto.Animation {
	const obj: proto.Animation = {
		name: '',
		frames: [],
		direction: proto.AnimationDirection.RESTART,
		speed: 0,
		interpolation: proto.AnimationInterpolation.LINEAR,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNode(
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

export function OperandData(
	overrides?: Partial<proto.OperandData>,
): proto.OperandData {
	const obj: proto.OperandData = {
		type: proto.OperandDataType.OpInputRegister,
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function InstructionData(
	overrides?: Partial<proto.InstructionData>,
): proto.InstructionData {
	const obj: proto.InstructionData = {
		type: proto.InstructionDataType.InNoop,
		operands: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function RegisterData(
	overrides?: Partial<proto.RegisterData>,
): proto.RegisterData {
	const obj: proto.RegisterData = {
		name: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LabelData(
	overrides?: Partial<proto.LabelData>,
): proto.LabelData {
	const obj: proto.LabelData = {
		name: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgramData(
	overrides?: Partial<proto.ProgramData>,
): proto.ProgramData {
	const obj: proto.ProgramData = {
		inputRegisters: [],
		outputRegisters: [],
		workingRegisters: [],
		labels: [],
		instructions: [],
		inoutRegisters: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammablePositionData(
	overrides?: Partial<proto.ProgrammablePositionData>,
): proto.ProgrammablePositionData {
	const obj: proto.ProgrammablePositionData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableRotationData(
	overrides?: Partial<proto.ProgrammableRotationData>,
): proto.ProgrammableRotationData {
	const obj: proto.ProgrammableRotationData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableScaleData(
	overrides?: Partial<proto.ProgrammableScaleData>,
): proto.ProgrammableScaleData {
	const obj: proto.ProgrammableScaleData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableTriggerActive(
	overrides?: Partial<proto.ProgrammableTriggerActive>,
): proto.ProgrammableTriggerActive {
	const obj: proto.ProgrammableTriggerActive = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammablePlayerData(
	overrides?: Partial<proto.ProgrammablePlayerData>,
): proto.ProgrammablePlayerData {
	const obj: proto.ProgrammablePlayerData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableSignData(
	overrides?: Partial<proto.ProgrammableSignData>,
): proto.ProgrammableSignData {
	const obj: proto.ProgrammableSignData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableColorData(
	overrides?: Partial<proto.ProgrammableColorData>,
): proto.ProgrammableColorData {
	const obj: proto.ProgrammableColorData = {};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammablePropertyData(
	overrides?: Partial<proto.ProgrammablePropertyData>,
): proto.ProgrammablePropertyData {
	const obj: proto.ProgrammablePropertyData = {
		objectID: 0,
		components: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammableSignUpdateData(
	overrides?: Partial<proto.ProgrammableSignUpdateData>,
): proto.ProgrammableSignUpdateData {
	const obj: proto.ProgrammableSignUpdateData = {
		text: '',
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function ProgrammablePropertyUpdateData(
	overrides?: Partial<proto.ProgrammablePropertyUpdateData>,
): proto.ProgrammablePropertyUpdateData {
	const obj: proto.ProgrammablePropertyUpdateData = {
		components: [],
	};
	if (overrides) merge(obj, overrides);
	return obj;
}

export function LevelNodeGASMConnection(
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

export function ProgrammablePropertyDataComponent(
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
