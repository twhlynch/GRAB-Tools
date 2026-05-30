// @ts-expect-error no types for jsfft
import { ComplexArray } from 'jsfft';

// MARK: Types

export interface Note {
	startTime: number;
	endTime: number;
	/** Frequency in Hz, snapped to a quantized pitch set after analysis */
	pitch: number;
	intensity: number;
}

interface Peak {
	bin: number;
	magnitude: number;
}

// MARK: FFT helpers

function magnitudeSpectrum(complexArray: ComplexArray): Float32Array {
	const mags = complexArray.magnitude() as Float32Array;
	return mags.slice(0, mags.length / 2);
}

function hannWindow(length: number): Float32Array {
	const win = new Float32Array(length);
	for (let i = 0; i < length; i++)
		win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
	return win;
}

function findPeaks(magnitudes: Float32Array, threshold: number): Peak[] {
	const peaks: Peak[] = [];
	for (let i = 1; i < magnitudes.length - 1; i++) {
		if (
			magnitudes[i]! > magnitudes[i - 1]! &&
			magnitudes[i]! > magnitudes[i + 1]! &&
			magnitudes[i]! > threshold
		) {
			peaks.push({ bin: i, magnitude: magnitudes[i]! });
		}
	}
	return peaks;
}

function binToFreq(bin: number, sampleRate: number, fftSize: number): number {
	return (bin * sampleRate) / fftSize;
}

function nearestIn(val: number, list: number[]): number {
	return list.reduce((best, v) =>
		Math.abs(v - val) < Math.abs(best - val) ? v : best,
	);
}

// MARK: STFT analysis

async function stftPeaks(
	file: File,
): Promise<{ peaks: Peak[][]; sampleRate: number }> {
	const arrayBuffer = await file.arrayBuffer();
	const audioContext = new AudioContext();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	await audioContext.close();

	// Mix to mono
	const length = audioBuffer.length;
	const sampleRate = audioBuffer.sampleRate;
	const mono = new Float32Array(length);
	for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
		const ch = audioBuffer.getChannelData(c);
		for (let i = 0; i < length; i++)
			mono[i]! += ch[i]! / audioBuffer.numberOfChannels;
	}

	const fftSize = 4096; // larger = better freq resolution for pitch detection
	const hopSize = 512;
	const win = hannWindow(fftSize);
	const allPeaks: Peak[][] = [];

	for (let start = 0; start + fftSize <= length; start += hopSize) {
		const frame = new ComplexArray(fftSize);
		for (let i = 0; i < fftSize; i++) {
			frame.real[i] = mono[start + i]! * win[i]!;
			frame.imag[i] = 0;
		}
		allPeaks.push(findPeaks(magnitudeSpectrum(frame.FFT()), 0.01));
	}

	return { peaks: allPeaks, sampleRate };
}

// MARK: Note tracking

function trackNotes(
	allPeaks: Peak[][],
	sampleRate: number,
	fftSize: number,
	hopSize: number,
	freqToleranceHz = 15,
): Note[] {
	const notes: Note[] = [];
	const active: (Note & { checked: boolean })[] = [];

	for (let fi = 0; fi < allPeaks.length; fi++) {
		const time = (fi * hopSize) / sampleRate;
		active.forEach((n) => (n.checked = false));

		for (const { bin, magnitude } of allPeaks[fi]!) {
			const freq = binToFreq(bin, sampleRate, fftSize);
			const match =
				active.find(
					(n) =>
						!n.checked &&
						Math.abs(n.pitch - freq) < freqToleranceHz,
				) ?? null;

			if (match) {
				match.endTime = time;
				match.intensity = Math.max(match.intensity, magnitude);
				match.checked = true;
			} else {
				active.push({
					startTime: time,
					endTime: time,
					pitch: freq,
					intensity: magnitude,
					checked: true,
				});
			}
		}

		for (let i = active.length - 1; i >= 0; i--) {
			if (!active[i]!.checked) notes.push(...active.splice(i, 1));
		}
	}
	notes.push(...active);
	return notes;
}

// MARK: Public API

/**
 * Analyses the audio file and returns quality-filtered notes.
 *
 * Filtering:
 *  - Frequency range: 80–2000 Hz (speech and instrument fundamentals)
 *  - Minimum duration: 30ms (removes single-frame FFT artifacts)
 *  - Relative intensity: must be >= 15% of the loudest note detected
 *  - Hard intensity floor: 0.02
 */
export async function analyseAudio(
	file: File,
	highpassHz = 2000,
	minDuration = 0.03,
	relativeFloor = 0.15,
	absoluteFloor = 0.02,
): Promise<Note[]> {
	const { peaks, sampleRate } = await stftPeaks(file);
	const raw = trackNotes(peaks, sampleRate, 4096, 512);

	// Basic structural filter
	const structural = raw.filter(
		(n) =>
			n.pitch >= 80 &&
			n.pitch < highpassHz &&
			n.endTime - n.startTime >= minDuration,
	);

	if (!structural.length) return [];

	// Relative intensity gate
	const peak = Math.max(...structural.map((n) => n.intensity));
	const floor = Math.max(absoluteFloor, relativeFloor * peak);
	return structural.filter((n) => n.intensity >= floor);
}

/**
 * Selects the top N pitches by cumulative intensity, snaps all notes to
 * that set, and returns the deduplicated pitch list.
 * Mutates notes in place.
 */
export function quantizeAndSelect(notes: Note[], maxPitches: number): number[] {
	// Bin pitches in 2Hz buckets
	const pitchMap = new Map<number, number>();
	for (const n of notes) {
		const k = Math.floor(n.pitch / 2) * 2;
		pitchMap.set(k, (pitchMap.get(k) ?? 0) + n.intensity);
	}

	const topPitches = [...pitchMap.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxPitches)
		.map(([p]) => p);

	for (const n of notes) {
		n.pitch = nearestIn(n.pitch, topPitches);
	}

	return [...new Set(notes.map((n) => n.pitch))];
}

/**
 * Returns the maximum number of distinct pitches (sound+trigger pairs)
 * that fit within a complexity budget.
 *
 * Per pitch: COST_SOUND + COST_TRIGGER
 * Per block: COST_GASM (one block per soundsPerBlock pitches)
 */
export function maxPitchesForBudget(
	budget: number,
	soundsPerBlock: number,
	costSound = 8,
	costTrigger = 5,
	costGasm = 5,
): number {
	let n = 0;
	for (let next = 1; ; next++) {
		const cost =
			next * (costSound + costTrigger) +
			Math.ceil(next / soundsPerBlock) * costGasm;
		if (cost > budget) break;
		n = next;
	}
	return n;
}
