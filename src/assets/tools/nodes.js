function levelNode(nodeData) {
	return {
		...nodeData,
		isLocked: false,
		animations: [],
		activeAnimation: 0,
	};
}

function vec3(x = 0, y = 0, z = 0) {
	return { y, x, z };
}

function vec2(x = 0, y = 0) {
	return { x, y };
}

function quat(x = 0, y = 0, z = 0, w = 1) {
	return { x, y, z, w };
}

function color(r = 0, g = 0, b = 0, a = 1) {
	return { r, g, b, a };
}

function levelNodeStart() {
	return levelNode({
		levelNodeStart: {
			position: vec3(),
			rotation: quat(),
			radius: 0.5,
			name: 'start0',
		},
	});
}

function levelNodeFinish() {
	return levelNode({
		levelNodeFinish: {
			position: vec3(),
			radius: 0.5,
		},
	});
}

function levelNodeStatic() {
	return levelNode({
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

function levelNodeSign() {
	return levelNode({
		levelNodeSign: {
			position: vec3(),
			rotation: quat(),
			scale: 1,
			text: 'Text',
			color: color(),
			weight: 0,
			hideModel: false,
		},
	});
}

function levelNodeCrumbling() {
	return levelNode({
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

function levelNodeGroup() {
	return levelNode({
		levelNodeGroup: {
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			childNodes: [],
		},
	});
}

function levelNodeGravity() {
	return levelNode({
		levelNodeGravity: {
			mode: 0,
			position: vec3(),
			scale: vec3(1, 1, 1),
			rotation: quat(),
			direction: vec3(0, 1, 0),
		},
	});
}

function levelNodeLobbyTerminal() {
	return levelNode({
		levelNodeLobbyTerminal: {
			position: vec3(),
			rotation: quat(),
		},
	});
}

function levelNodeTrigger() {
	return levelNode({
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

function levelNodeParticleEmitter() {
	return levelNode({
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

function levelNodeSound() {
	return levelNode({
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

function animation() {
	return {
		name: 'idle',
		speed: 1,
		frames: [],
		interpolation: 0,
		direction: 0,
	};
}

function frame() {
	return {
		time: 0,
		position: vec3(),
		rotation: quat(),
	};
}

function triggerTarget(target) {
	return {
		mode: 0,
		...target,
	};
}

function triggerTargetAnimation() {
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

function triggerTargetSubLevel() {
	return triggerTarget({
		triggerTargetSubLevel: {
			levelIdentifier: '29r46v7djliny6t4rzvq7:1654257963',
			spawnPoint: 'default',
		},
	});
}

function triggerTargetSound() {
	return triggerTarget({
		triggerTargetSound: {
			objectID: 1,
			repear: false,
			mode: 1,
		},
	});
}

function triggerTargetAmbience() {
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

function triggerSource(source) {
	return {
		...source,
	};
}

function triggerSourceBasic() {
	return triggerSource({
		triggerSourceBasic: {
			type: 0,
		},
	});
}

function triggerSourceBlockNames() {
	return triggerSource({
		triggerSourceBlockNames: {
			names: ['name'],
		},
	});
}

export default {
	levelNodeStart,
	levelNodeFinish,
	levelNodeStatic,
	levelNodeSign,
	levelNodeCrumbling,
	levelNodeGroup,
	levelNodeGravity,
	levelNodeLobbyTerminal,
	levelNodeTrigger,
	levelNodeParticleEmitter,
	levelNodeSound,
	animation,
	frame,
	triggerTargetAnimation,
	triggerTargetSubLevel,
	triggerTargetSound,
	triggerTargetAmbience,
	triggerSourceBasic,
	triggerSourceBlockNames,
};
