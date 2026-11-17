// SFX2GL Tool by TheTrueFax (https://github.com/thetruefax/)

import { append, deepClone, maximum } from '@/common/utils';
import { levelNodeGroupFrom } from '@grab-tools/lib/common/group';
import { animation, animationFrame } from '@grab-tools/lib/generated/helpers';
import {
	LevelNodeWith,
	levelNodeWithGroup,
	levelNodeWithSound,
	levelNodeWithStatic,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithSound,
} from '@grab-tools/lib/generated/nodes';
import {
	LevelNodeGroup,
	TriggerSourceBasicType,
	TriggerTargetSoundMode,
} from '@grab-tools/lib/generated/proto';
import { ComplexArray } from 'jsfft';

/**
 * @param file An image file
 * @param samples samples
 * @returns A group level node
 */
async function audio(
	file: File,
	samples: number,
): Promise<LevelNodeWith<LevelNodeGroup> | null> {
	console.log(file);

	const volume_samples = 2;
	try {
		const level_nodes = await generate(samples, volume_samples, file);
		return levelNodeGroupFrom({ childNodes: level_nodes });
	} catch (e) {
		if (e instanceof Error) {
			window.toast(e, 'error');
		}
		return null;
	}
}

// FFT helpers
function magnitudeSpectrum(complexArray: ComplexArray) {
	const fullMags = complexArray.magnitude();
	const halfLength = fullMags.length / 2;
	return fullMags.slice(0, halfLength);
}

function hannWindow(length: number) {
	const win = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
	}
	return win;
}

function findPeaks(magnitudes: Float32Array<ArrayBuffer>, threshold = 0.01) {
	const peaks: { bin: number; magnitude: number }[] = [];
	for (let i = 1; i < magnitudes.length - 1; i++) {
		const item = magnitudes[i]!;
		if (
			item > magnitudes[i - 1]! &&
			item > magnitudes[i + 1]! &&
			item > threshold
		) {
			peaks.push({ bin: i, magnitude: item });
		}
	}
	return peaks;
}

function roundToClosest(val: number, list: number[]): number {
	const distances = [];
	let closest = Infinity;
	let index = 0;
	for (let i = 0; i < list.length; i++) {
		const item = list[i]!;
		distances.push(Math.abs(item - val));
		if (Math.abs(item - val) < closest) {
			index = i;
			closest = Math.abs(item - val);
		}
	}
	return list[index]!;
}

function binToFreq(bin: number, sampleRate: number, fftSize: number) {
	return (bin * sampleRate) / fftSize;
}

async function wavToPolyphonicNotes(file: File) {
	const arrayBuffer = await file.arrayBuffer();
	const audioContext = new AudioContext();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

	const channelData = audioBuffer.getChannelData(0);
	const sampleRate = audioBuffer.sampleRate;

	const fftSize = 2048;
	const hopSize = 512;
	const win = hannWindow(fftSize);

	const allPeaks = [];

	for (
		let start = 0;
		start + fftSize <= channelData.length;
		start += hopSize
	) {
		const frameSamples = new Float32Array(fftSize);
		for (let i = 0; i < fftSize; i++) {
			frameSamples[i] = channelData[start + i]! * win[i]!;
		}

		const complexInput = new ComplexArray(fftSize);
		for (let i = 0; i < fftSize; i++) {
			complexInput.real[i] = frameSamples[i]!;
			complexInput.imag[i] = 0;
		}

		const fftOutput = complexInput.FFT();

		const mags = magnitudeSpectrum(fftOutput);

		const peaks = findPeaks(mags, 0.02);

		allPeaks.push(peaks);
	}

	const notes = trackNotesAcrossFrames(
		allPeaks,
		sampleRate,
		fftSize,
		hopSize,
	);

	return notes;
}

interface Note {
	startTime: number;
	endTime: number;
	pitch: number;
	intensity: number;
	checked: boolean;
}

function trackNotesAcrossFrames(
	allPeaks: { bin: number; magnitude: number }[][],
	sampleRate: number,
	frameSize: number,
	hopSize: number,
	freqToleranceHz = 20,
): Note[] {
	const notes: Note[] = [];
	const activeNotes: Note[] = [];

	for (let frameIndex = 0; frameIndex < allPeaks.length; frameIndex++) {
		const time = (frameIndex * hopSize) / sampleRate;
		const peaks = allPeaks[frameIndex]!;

		activeNotes.forEach((n) => (n.checked = false));

		peaks.forEach(({ bin, magnitude }) => {
			const freq = binToFreq(bin, sampleRate, frameSize);

			let matchedNote = null;
			for (const note of activeNotes) {
				if (
					Math.abs(note.pitch - freq) < freqToleranceHz &&
					!note.checked
				) {
					matchedNote = note;
					break;
				}
			}

			if (matchedNote) {
				matchedNote.endTime = time;
				matchedNote.intensity = Math.max(
					matchedNote.intensity,
					magnitude,
				);
				matchedNote.checked = true;
			} else {
				activeNotes.push({
					startTime: time,
					endTime: time,
					pitch: freq,
					intensity: magnitude,
					checked: true,
				});
			}
		});

		for (let i = activeNotes.length - 1; i >= 0; i--) {
			if (!activeNotes[i]!.checked) {
				notes.push(activeNotes[i]!);
				activeNotes.splice(i, 1);
			}
		}
	}

	append(notes, activeNotes);

	return notes;
}
async function getNotesWithLimits(
	file: File,
	highpass: number,
	volume_cap: number,
) {
	const all_notes = await wavToPolyphonicNotes(file);
	const notes = all_notes.filter(
		(note) => note.endTime - note.startTime > 0.02 && note.pitch < highpass,
	);

	notes.forEach(
		(note) => (note.intensity = Math.min(note.intensity, volume_cap)),
	);

	return notes;
}
function getPitches(
	notes: Note[],
	samples: number,
	cull: boolean,
	round: number,
) {
	const pitches: [number, number][] = [];

	notes.forEach((note) => {
		const { pitch: raw_pitch, intensity } = note;
		const pitch = Math.floor(raw_pitch / round) * round;
		let index = pitches.findIndex((p) => p[1] === pitch);
		if (index === -1) {
			index = pitches.length;
			pitches.push([0, pitch]);
		}
		pitches[index]![0] += intensity;
	});

	if (pitches.length >= samples) {
		pitches.sort((a, b) => b[0] - a[0]);
		pitches.splice(samples, pitches.length);
		const bares = pitches.map((pitch) => pitch[1]);

		notes.forEach((note) => {
			note.pitch = roundToClosest(note.pitch, bares);
		});

		if (cull) {
			const kept = notes.filter((note) => bares.includes(note.pitch));
			notes.length = 0;
			append(notes, kept);
		}
	}

	return pitches.map((pitch) => pitch[1]);
}
function getVolumes(
	notes: Note[],
	samples: number,
	cull: boolean,
	round: number,
) {
	const volumes: [number, number][] = [];

	notes.forEach((note) => {
		const { intensity: raw_intensity } = note;
		const intensity = Math.floor(raw_intensity / round) * round;
		let index = volumes.findIndex((p) => p[1] === intensity);
		if (index === -1) {
			index = volumes.length;
			volumes.push([0, intensity]);
		}
		volumes[index]![0]++;
	});

	volumes.forEach((volume) => {
		volume[1] /= 4;
	});

	if (volumes.length >= samples) {
		volumes.sort((a, b) => b[0] - a[0]);
		volumes.splice(samples, volumes.length);
		const bares = volumes.map((volume) => volume[1]);

		notes.forEach((note) => {
			note.intensity = roundToClosest(note.intensity, bares);
		});

		if (cull) {
			const kept = notes.filter((note) => bares.includes(note.intensity));
			notes.length = 0;
			append(notes, kept);
		}
	}

	return volumes.map((volume) => volume[1]);
}

// node helpers
function getSoundBlock(pitch: number, amplitude: number) {
	const node = levelNodeWithSound({
		position: { z: -2 },
		name: uniqueSoundName(),
		volume: amplitude,
		maxRangeFactor: 1000,
	});
	node.levelNodeSound.parameters = {
		...node.levelNodeSound.parameters,
		...{
			waveType: 2,
			envelopeAttack: 0.1,
			envelopeSustain: 5,
			envelopeRelease: 0.1,
			frequencyBase: pitch,
			frequencyLimit: 35,
			pitchJumpMod: 0.10000000149011612,
			lowPassFilterFrequency: 10000,
		},
	};
	return node;
}
function getSoundTriggerBlock(
	x: number,
	y: number,
	isStop: boolean,
	targetID: number,
) {
	const source = triggerSourceWithBasic({
		type: TriggerSourceBasicType.BLOCK,
	});
	const target = triggerTargetWithSound({
		objectID: targetID,
		mode: isStop
			? TriggerTargetSoundMode.STOP
			: TriggerTargetSoundMode.START,
	});

	const node = levelNodeWithTrigger({
		position: { x: x, y: isStop ? -y - 1 : y },
		scale: { x: 0.03 },
		triggerSources: [source],
		triggerTargets: [target],
	});
	node.animations = [animation({ frames: [animationFrame()] })];

	return node;
}
function soundTarget(mode: TriggerTargetSoundMode, object_id: number) {
	return triggerTargetWithSound({ objectID: object_id, mode: mode });
}

// other helpers
function uniqueSoundName() {
	const chars =
		'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890';
	let output = '';
	for (let i = 0; i < 5; i++) {
		output += chars[Math.floor(Math.random() * chars.length)];
	}
	return `SFX2GRAB-${output}`;
}

async function generate(pitchSamps: number, volumeSamps: number, file: File) {
	const notes = await getNotesWithLimits(file, 2000, 0.65);

	const pitches = getPitches(notes, pitchSamps, true, 2);
	const volumes = getVolumes(notes, volumeSamps, false, 0.01);

	const soundBlocks = volumes.flatMap((v) =>
		pitches.map((p) => getSoundBlock(p, v)),
	);

	const key: string[] = [];
	const makeTrigger = (
		pitch: number,
		volume1: number,
		x: number,
		y: number,
		isStop: boolean,
	) => {
		key.push(JSON.stringify([pitch, volume1, isStop]));
		const trigger = getSoundTriggerBlock(
			x,
			y,
			isStop,
			soundBlocks.findIndex(
				(node) =>
					pitch ==
						(node.levelNodeSound.parameters ??= {}).frequencyBase &&
					volume1 == node.levelNodeSound.volume,
			) + 1,
		);
		return trigger;
	};

	const source = triggerSourceWithBasic({
		type: TriggerSourceBasicType.BLOCK,
	});
	const trig1 = levelNodeWithTrigger({
		position: { x: -5 },
		triggerSources: [source],
	});

	const trig2 = deepClone(trig1);
	const trig3 = deepClone(trig1);

	trig1.levelNodeTrigger.triggerTargets ??= [];
	trig2.levelNodeTrigger.triggerTargets ??= [];
	trig3.levelNodeTrigger.triggerTargets ??= [];

	for (let i = soundBlocks.length + 2; i < soundBlocks.length * 2 + 2; i++) {
		trig1.levelNodeTrigger.triggerTargets.push(
			soundTarget(TriggerTargetSoundMode.START, i),
		);
		trig2.levelNodeTrigger.triggerTargets.push(
			soundTarget(TriggerTargetSoundMode.STOP, i),
		);
		trig3.levelNodeTrigger.triggerTargets.push(
			soundTarget(TriggerTargetSoundMode.RESET, i),
		);
	}

	const triggers = volumes.flatMap((v, x) =>
		pitches.flatMap((p, y) => [
			makeTrigger(p, v, x, y, false),
			makeTrigger(p, v, x, y, true),
		]),
	);
	const triggerGroup = levelNodeWithGroup({
		childNodes: triggers,
	});

	let last = 0;
	const makeStaticNote = (
		pitch: number,
		volume: number,
		startPos: number,
		endPos: number,
	) => {
		if (endPos > last) {
			last = endPos;
		}
		const index1 = key.indexOf(JSON.stringify([pitch, volume, false]));
		const index2 = key.indexOf(JSON.stringify([pitch, volume, true]));

		const frames1 = ((triggers[index1]!.animations ??= [
			animation(),
		])[0]!.frames ??= []);
		const frames2 = ((triggers[index2]!.animations ??= [
			animation(),
		])[0]!.frames ??= []);

		if (frames1.length > 0) {
			if ((frames1[frames1.length - 1]!.time ?? 0) > startPos) return;
			if ((frames2[frames2.length - 1]!.time ?? 0) > endPos) return;
		}

		frames1.push(
			animationFrame({
				time: startPos - 0.01,
				position: { x: -1 },
			}),
		);
		frames1.push(animationFrame({ time: startPos }));

		frames2.push(
			animationFrame({
				time: endPos - 0.01,
				position: { x: -1 },
			}),
		);
		frames2.push(animationFrame({ time: endPos }));
	};

	for (const note of notes) {
		makeStaticNote(
			note.pitch,
			note.intensity,
			note.startTime,
			note.endTime,
		);
	}

	let best = 0;
	for (const trig of triggers) {
		const frames = trig.animations![0]!.frames!;
		if (frames.length > best) {
			best = frames.length;
		}
		const frm = animationFrame({ time: last });
		frames.push(frm);
	}

	const max = maximum(
		triggers.map((node) => node.levelNodeTrigger.position!.y!),
	);

	const wall = levelNodeWithStatic({
		position: { x: -1, y: -0.5 },
		scale: { y: max * 2 + 2, x: 0.03 },
	});

	const nodes = [...soundBlocks, triggerGroup, trig1, trig2, trig3, wall];

	return nodes;
}

export default {
	audio,
};
