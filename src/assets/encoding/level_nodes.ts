import {
	Animation,
	AnimationFrame,
	LevelNodeCrumbling,
	LevelNodeFinish,
	LevelNodeGASM,
	LevelNodeGASMConnection,
	LevelNodeGravity,
	LevelNodeGroup,
	LevelNodeLobbyTerminal,
	LevelNodeParticleEmitter,
	LevelNodeSign,
	LevelNodeSound,
	LevelNodeStart,
	LevelNodeStatic,
	LevelNodeTrigger,
	ProgrammablePropertyData,
	ProgrammablePropertyDataComponent,
	RegisterData,
	TriggerSource,
	TriggerTarget,
} from '@/generated/proto';
import { LevelNodeTypes, LevelNodeWith } from '@/types/levelNodes';

export function levelNode<T extends LevelNodeTypes>(
	nodeData: LevelNodeWith<T>,
): LevelNodeWith<T> {
	return {
		...nodeData,
		isLocked: false,
		animations: [],
		activeAnimation: 0,
	};
}

export function vec3(x = 0, y = 0, z = 0) {
	return { y, x, z };
}

export function vec2(x = 0, y = 0) {
	return { x, y };
}

export function quat(x = 0, y = 0, z = 0, w = 1) {
	return { x, y, z, w };
}

export function color(r = 0, g = 0, b = 0, a = 1) {
	return { r, g, b, a };
}

export function levelNodeStart() {
	return levelNode<LevelNodeStart>({
		levelNodeStart: {
			position: vec3(),
			rotation: quat(),
			radius: 0.5,
			name: 'start0',
			isHidden: false,
		},
	});
}

export function levelNodeFinish() {
	return levelNode<LevelNodeFinish>({
		levelNodeFinish: {
			position: vec3(),
			radius: 0.5,
		},
	});
}

export function levelNodeStatic() {
	return levelNode<LevelNodeStatic>({
		levelNodeStatic: {
			shape: 1000,
			material: 0,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			color1: color(),
			color2: color(),
			isNeon: false,
			isTransparent: false,
			isGrabbable: false,
			isGrapplable: false,
			isPassable: false,
		},
	});
}

export function levelNodeSign() {
	return levelNode<LevelNodeSign>({
		levelNodeSign: {
			position: vec3(),
			rotation: quat(),
			scale: 1,
			text: 'Text',
			color: color(1, 1, 1),
			weight: 0,
			hideModel: false,
		},
	});
}

export function levelNodeCrumbling() {
	return levelNode<LevelNodeCrumbling>({
		levelNodeCrumbling: {
			shape: 1000,
			material: 7,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			stableTime: 5,
			respawnTime: 5,
		},
	});
}

export function levelNodeGroup() {
	return levelNode<LevelNodeGroup>({
		levelNodeGroup: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			name: 'group',
			physicsObject: false,
			localPhysicsObject: false,
			mass: 1,
			childNodes: [],
		},
	});
}

export function levelNodeGravity() {
	return levelNode<LevelNodeGravity>({
		levelNodeGravity: {
			mode: 0,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			direction: vec3(0, 1, 0),
		},
	});
}

export function levelNodeLobbyTerminal() {
	return levelNode<LevelNodeLobbyTerminal>({
		levelNodeLobbyTerminal: {
			position: vec3(),
			rotation: quat(),
		},
	});
}

export function levelNodeTrigger() {
	return levelNode<LevelNodeTrigger>({
		levelNodeTrigger: {
			shape: 1000,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			isShared: false,
			triggerSources: [],
			triggerTargets: [],
		},
	});
}

export function levelNodeParticleEmitter() {
	return levelNode<LevelNodeParticleEmitter>({
		levelNodeParticleEmitter: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			particlesPerSecond: 10,
			lifeSpan: vec2(1, 2),
			startColor: color(1, 1, 1),
			endColor: color(0, 0, 0),
			startSize: vec2(1, 2),
			endSize: vec2(0.5, 1),
			velocity: vec3(0.1, 0.1, 0.1),
			velocityMin: vec3(-0.1, -0.1, -0.1),
			velocityMax: vec3(0.1, 0.1, 0.1),
			accelerationMin: vec3(-0.1, -0.1, -0.1),
			accelerationMax: vec3(0.1, 0.1, 0.1),
		},
	});
}

export function levelNodeSound() {
	return levelNode<LevelNodeSound>({
		levelNodeSound: {
			position: vec3(),
			rotation: quat(),
			parameters: {
				volume: 1,
				waveType: 0,
				envelopeAttack: 0.0,
				envelopeSustain: 0.0,
				envelopeRelease: 0.0,
				envelopePunch: 0.0,
				frequencyBase: 0.0,
				frequencyLimit: 0.0,
				frequencyRamp: 0.0,
				frequencyDeltaRamp: 0.0,
				vibratoStrength: 0.0,
				vibratoSpeed: 0.0,
				pitchJumpMod: 0.0,
				pitchJumpSpeed: 0.0,
				dutyCycle: 0.0,
				dutyCycleRamp: 0.0,
				repeatSpeed: 0.0,
				flangerFrequency: 0.0,
				flangerDepth: 0.0,
				lowPassFilterFrequency: 0.0,
				highPassFilterFrequency: 0.0,
				reverbDelay: 0.0,
				reverbDecayFactor: 0.0,
			},
			name: 'sound0',
			repeat: false,
			volume: 1,
			startActive: false,
			maxRangeFactor: 1,
		},
	});
}

export function animation(): Animation {
	return {
		name: 'idle',
		speed: 1,
		frames: [],
		interpolation: 0,
		direction: 0,
	};
}

export function frame(): AnimationFrame {
	return {
		time: 0,
		position: vec3(),
		rotation: quat(),
	};
}

export function triggerTarget(target: TriggerTarget): TriggerTarget {
	return {
		...target,
		mode: 0,
	};
}

export function triggerTargetAnimation() {
	return triggerTarget({
		triggerTargetAnimation: {
			objectID: 1,
			animationName: 'idle',
			loop: false,
			reverse: false,
			mode: 1,
		},
	});
}

export function triggerTargetSubLevel() {
	return triggerTarget({
		triggerTargetSubLevel: {
			levelIdentifier: '29r46v7djliny6t4rzvq7:1654257963',
			spawnPoint: 'default',
		},
	});
}

export function triggerTargetGASM() {
	return triggerTarget({
		triggerTargetGASM: {
			objectID: 0,
			mode: 3,
		},
	});
}

export function triggerTargetSound() {
	return triggerTarget({
		triggerTargetSound: {
			objectID: 1,
			repeat: false,
			mode: 1,
		},
	});
}

export function triggerTargetAmbience() {
	return triggerTarget({
		triggerTargetAmbience: {
			skyColor0: color(),
			skyColor1: color(),
			sunAltitude: 0.0,
			sunAzimuth: 0.0,
			sunSize: 1.0,
			fogDensity: 1.0,
			changeDuration: 1.0,
			interpolationType: 0,
		},
	});
}

export function triggerSource(source: TriggerSource): TriggerSource {
	return {
		...source,
	};
}

export function triggerSourceBasic() {
	return triggerSource({
		triggerSourceBasic: {
			type: 0,
		},
	});
}

export function triggerSourceBlockNames() {
	return triggerSource({
		triggerSourceBlockNames: {
			names: ['name'],
		},
	});
}

export function levelNodeGASM() {
	return levelNode<LevelNodeGASM>({
		levelNodeGASM: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			program: {
				inoutRegisters: [],
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
			},
			connections: [],
			startActive: false,
		},
	});
}

export function registerData(): RegisterData {
	return { name: '' };
}

export function gasmConnection(): LevelNodeGASMConnection {
	return {
		objectID: 0,
		name: 'Obj',
		properties: [],
		type: 0,
	};
}

export function programmablePropertyData(): ProgrammablePropertyData {
	return {
		objectID: 0,
		components: [],
	};
}

export function programmablePropertyDataComponent(): ProgrammablePropertyDataComponent {
	return {
		inputRegisterIndex: -1,
		outputRegisterIndex: -1,
		inoutRegisterIndex: -1,
	};
}
