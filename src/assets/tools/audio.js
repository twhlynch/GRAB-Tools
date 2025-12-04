// SFX2GL Tool by TheTrueFax (https://github.com/thetruefax/)

import group from '@/assets/tools/group.js';
import encoding from './encoding';
import { ComplexArray } from 'jsfft';

/**
 * @param {File} file - An image file
 * @param {Number} samples - samples
 * @returns {Promise<Object>} - A group level node
 */
async function audio(file, samples) {
	const volume_samples = 2;
	const level_nodes = await generate(samples, volume_samples, file);

	return group.groupNodes(level_nodes);
}

// FFT helpers
function magnitudeSpectrum(complexArray) {
	const fullMags = complexArray.magnitude();
	const halfLength = fullMags.length / 2;
	return fullMags.slice(0, halfLength);
}
function hannWindow(length) {
	const win = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
	}
	return win;
}
function findPeaks(magnitudes, threshold = 0.01) {
	const peaks = [];
	for (let i = 1; i < magnitudes.length - 1; i++) {
		if (
			magnitudes[i] > magnitudes[i - 1] &&
			magnitudes[i] > magnitudes[i + 1] &&
			magnitudes[i] > threshold
		) {
			peaks.push({ bin: i, magnitude: magnitudes[i] });
		}
	}
	return peaks;
}
function roundToClosest(val, list) {
	let distances = [];
	let closest = Infinity;
	let index = 0;
	for (let i = 0; i < list.length; i++) {
		distances.push(Math.abs(list[i] - val));
		if (Math.abs(list[i] - val) < closest) {
			index = i;
			closest = Math.abs(list[i] - val);
		}
	}
	return list[index];
}
function binToFreq(bin, sampleRate, fftSize) {
	return (bin * sampleRate) / fftSize;
}
async function wavToPolyphonicNotes(file) {
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
			frameSamples[i] = channelData[start + i] * win[i];
		}

		const complexInput = new ComplexArray(fftSize);
		for (let i = 0; i < fftSize; i++) {
			complexInput.real[i] = frameSamples[i];
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
function trackNotesAcrossFrames(
	allPeaks,
	sampleRate,
	frameSize,
	hopSize,
	freqToleranceHz = 20,
) {
	const notes = [];
	const activeNotes = [];

	for (let frameIndex = 0; frameIndex < allPeaks.length; frameIndex++) {
		const time = (frameIndex * hopSize) / sampleRate;
		const peaks = allPeaks[frameIndex];

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
			if (!activeNotes[i].checked) {
				notes.push(activeNotes[i]);
				activeNotes.splice(i, 1);
			}
		}
	}

	notes.push(...activeNotes);

	return notes;
}
async function getNotesWithLimits(file, highpass, volume_cap) {
	const all_notes = await wavToPolyphonicNotes(file);
	const notes = all_notes.filter(
		(note) => note.endTime - note.startTime > 0.02 && note.pitch < highpass,
	);

	notes.forEach(
		(note) => (note.intensity = Math.min(note.intensity, volume_cap)),
	);

	return notes;
}
function getPitches(notes, samples, cull, round) {
	const pitches = [];

	notes.forEach((note) => {
		const { pitch: raw_pitch, intensity } = note;
		const pitch = Math.floor(raw_pitch / round) * round;
		let index = pitches.findIndex((p) => p[1] === pitch);
		if (index === -1) {
			index = pitches.length;
			pitches.push([0, pitch]);
		}
		pitches[index][0] += intensity;
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
			notes.push(...kept);
		}
	}

	return pitches.map((pitch) => pitch[1]);
}
function getVolumes(notes, samples, cull, round) {
	const volumes = [];

	notes.forEach((note) => {
		const { intensity: raw_intensity } = note;
		const intensity = Math.floor(raw_intensity / round) * round;
		let index = volumes.findIndex((p) => p[1] === intensity);
		if (index === -1) {
			index = volumes.length;
			volumes.push([0, intensity]);
		}
		volumes[index][0]++;
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
			notes.push(...kept);
		}
	}

	return volumes.map((volume) => volume[1]);
}

// node helpers
function getSoundBlock(pitch, amplitude) {
	const node = encoding.levelNodeSound();
	node.levelNodeSound.position.z = -2;
	node.levelNodeSound.name = uniqueSoundName();
	node.levelNodeSound.volume = amplitude;
	node.levelNodeSound.maxRangeFactor = 1000;
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
function getSoundTriggerBlock(x, y, isStop, targetID) {
	const targetSoundModes = encoding.load().COD.Level.TriggerTargetSound.Mode;
	const sourceBasicTypes = encoding.load().COD.Level.TriggerSourceBasic.Type;

	const node = encoding.levelNodeTrigger();
	node.levelNodeTrigger.position.x = x;
	node.levelNodeTrigger.scale.x = 0.03;
	const source = encoding.triggerSourceBasic();
	source.type = sourceBasicTypes.BLOCK;
	node.levelNodeTrigger.triggerSources.push(source);
	const target = encoding.triggerTargetSound();
	target.triggerTargetSound.objectID = targetID;
	node.levelNodeTrigger.triggerTargets.push(target);
	const animation = encoding.animation();
	animation.frames.push(encoding.frame());
	node.animations = [animation];

	if (isStop) {
		node.levelNodeTrigger.position.y = -y - 1;
		target.triggerTargetSound.mode = targetSoundModes.STOP;
	} else {
		target.triggerTargetSound.mode = targetSoundModes.START;
		node.levelNodeTrigger.position.y = y;
	}
	return node;
}
function soundTarget(mode, object_id) {
	const target = encoding.triggerTargetSound();
	target.triggerTargetSound.objectID = object_id;
	target.triggerTargetSound.mode = mode;
	return target;
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

async function generate(pitchSamps, volumeSamps, file) {
	let notes = await getNotesWithLimits(file, 2000, 0.65);

	let pitches = getPitches(notes, pitchSamps, true, 2);
	let volumes = getVolumes(notes, volumeSamps, false, 0.01);

	let triggerGroup = encoding.levelNodeGroup();

	const soundBlocks = volumes.flatMap((v) =>
		pitches.map((p) => getSoundBlock(p, v)),
	);

	let key = [];
	const makeTrigger = (pitch, volume1, x, y, isStop) => {
		key.push(JSON.stringify([pitch, volume1, isStop]));
		const trigger = getSoundTriggerBlock(
			x,
			y,
			isStop,
			soundBlocks.findIndex(
				(node) =>
					pitch == node.levelNodeSound.parameters.frequencyBase &&
					volume1 == node.levelNodeSound.volume,
			) + 1,
		);
		return trigger;
	};

	const sourceBasicTypes = encoding.load().COD.Level.TriggerSourceBasic.Type;
	const trig1 = encoding.levelNodeTrigger();
	trig1.levelNodeTrigger.position.x = -5;
	const source = encoding.triggerSourceBasic();
	source.triggerSourceBasic.type = sourceBasicTypes.BLOCK;
	trig1.levelNodeTrigger.triggerSources.push(source);

	let trig2 = encoding.deepClone(trig1);
	let trig3 = encoding.deepClone(trig1);

	const targetSoundModes = encoding.load().COD.Level.TriggerTargetSound.Mode;

	for (let i = soundBlocks.length + 2; i < soundBlocks.length * 2 + 2; i++) {
		trig1.levelNodeTrigger.triggerTargets.push(
			soundTarget(targetSoundModes.START, i),
		);
		trig2.levelNodeTrigger.triggerTargets.push(
			soundTarget(targetSoundModes.STOP, i),
		);
		trig3.levelNodeTrigger.triggerTargets.push(
			soundTarget(targetSoundModes.RESET, i),
		);
	}

	volumes.forEach((v, x) =>
		pitches.forEach((p, y) => {
			triggerGroup.levelNodeGroup.childNodes.push(
				makeTrigger(p, v, x, y, false),
			);
			triggerGroup.levelNodeGroup.childNodes.push(
				makeTrigger(p, v, x, y, true),
			);
		}),
	);

	let last = 0;
	const makeStaticNote = (pitch, volume, startPos, endPos) => {
		if (endPos > last) {
			last = endPos;
		}
		let index1 = key.indexOf(JSON.stringify([pitch, volume, false]));
		let index2 = key.indexOf(JSON.stringify([pitch, volume, true]));

		let trigs = triggerGroup.levelNodeGroup.childNodes;
		if (trigs[index1].animations[0].frames.length > 0) {
			if (
				trigs[index1].animations[0].frames[
					trigs[index1].animations[0].frames.length - 1
				].time > startPos
			) {
				return;
			}
			if (
				trigs[index2].animations[0].frames[
					trigs[index2].animations[0].frames.length - 1
				].time > endPos
			) {
				return;
			}
		}

		const preframe = encoding.frame();
		preframe.time = startPos - 0.01;
		preframe.position.x = -1;
		trigs[index1].animations[0].frames.push(preframe);

		const frame = encoding.frame();
		frame.time = startPos;
		trigs[index1].animations[0].frames.push(frame);

		const postframe = encoding.frame();
		postframe.time = endPos - 0.01;
		postframe.position.x = -1;
		trigs[index2].animations[0].frames.push(postframe);

		const endframe = encoding.frame();
		endframe.time = endPos;
		trigs[index2].animations[0].frames.push(endframe);
	};

	for (let i = 0; i < notes.length; i++) {
		makeStaticNote(
			notes[i].pitch,
			notes[i].intensity,
			notes[i].startTime,
			notes[i].endTime,
		);
	}

	let best = 0;
	let trigs = triggerGroup.levelNodeGroup.childNodes;
	for (let i = 0; i < trigs.length; i++) {
		if (trigs[i].animations[0].frames.length > best) {
			best = trigs[i].animations[0].frames.length;
		}
		const frame = encoding.frame();
		frame.time = last;
		trigs[i].animations[0].frames.push(frame);
	}

	const nodes = [...soundBlocks, triggerGroup, trig1, trig2, trig3];

	return nodes;
}

export default {
	audio,
};
