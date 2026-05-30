import {
	levelNodeWithGASM,
	levelNodeWithSound,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithSound,
} from '@/generated/nodes';
import {
	LevelNode,
	LevelNodeGASM,
	LevelNodeSound,
	LevelNodeTrigger,
	TriggerSourceBasicType,
	TriggerTargetSoundMode,
} from '@/generated/proto';
import { LevelNodeWith } from '@/types/levelNodes';
import { asm_to_json } from '../AssemblyConversion';
import { create_connection } from '../encoding/gasm/connections';
import {
	analyseAudio,
	maxPitchesForBudget,
	Note,
	quantizeAndSelect,
} from './audioProcessing';

// MARK: Constants

const FRAME_INTERVAL_MS = 50; // 20fps

// Per frame a block may emit: N×(SET 1 + SET 0) + 1 SLEEP.
// Worst case = all sounds fire: N*2 + 1 <= 80 → N <= 39.
// Be conservative to leave headroom.
const SOUNDS_PER_BLOCK = 19;

const COST_SOUND = 8;
const COST_TRIGGER = 5;
const COST_GASM = 5;

// MARK: Sound node

/**
 * Each pitch gets ONE sound node. The sound is configured for a clean,
 * sustained tone that can be started and stopped by the trigger.
 *
 * Because Trg.Force 0 has no effect on a playing envelope, we use
 * TriggerTargetSoundMode.RESTART + a pulse trigger (Force 1 then Force 0
 * in the same frame). This causes the sound to restart from the top of
 * its envelope each time it's triggered — giving clean re-triggers.
 *
 * The envelope shape:
 *  - Short attack so the note speaks immediately
 *  - Sustain = 0 so the note decays naturally after one trigger pulse
 *  - Release tuned to the expected note duration in the source material
 *  - envelopePunch adds a transient bite at the start
 *
 * For longer notes we rely on the GASM re-triggering the same note
 * repeatedly (every ~50ms) to keep it "held". The release is long enough
 * that there's no audible gap between re-triggers.
 */
function makeSoundNode(
	pitch: number,
	index: number,
): LevelNodeWith<LevelNodeSound> {
	const node = levelNodeWithSound();
	const s = node.levelNodeSound;
	s.position = { x: index, y: 0, z: -2 };
	s.name = `SND_${index}`;
	s.volume = 1;
	s.maxRangeFactor = 1000;
	s.repeat = false;
	s.startActive = false;
	s.parameters = {
		...s.parameters,
		waveType: 2, // Sine — clean carrier for pitch
		frequencyBase: pitch,
		frequencyLimit: 20,
		// Envelope: fast attack, zero sustain, release long enough to
		// bridge the 50ms re-trigger gap with no audible dropout
		envelopeAttack: 0.008,
		envelopeSustain: 0.0,
		envelopeRelease: 0.12,
		envelopePunch: 0.2,
		// Gentle low-pass to remove harshness from the sine
		lowPassFilterFrequency: Math.min(pitch * 4, 8000),
		// Light reverb so consecutive triggers blend smoothly
		reverbDelay: 0.025,
		reverbDecayFactor: 0.35,
	};
	return node;
}

// MARK: Trigger node

function makeTriggerNode(index: number): LevelNodeWith<LevelNodeTrigger> {
	const node = levelNodeWithTrigger();
	node.levelNodeTrigger.position = { x: index, y: -1, z: -2 };
	return node;
}

// MARK: GASM codegen

/**
 * Converts a note list into per-block GASM assembly.
 *
 * Key insight from the original SFX2GL tool: to play a note you must
 * SET Force 1 AND THEN SET Force 0 in the same frame. This pulses the
 * trigger — the sound plays its full envelope — and leaves the trigger
 * ready to fire again next time without needing to reset it manually.
 *
 * Strategy for held notes:
 *   - A note with duration > FRAME_INTERVAL_MS is re-triggered every
 *     frame it occupies. The 120ms release bridges the 50ms gap.
 *   - This means a 300ms note fires on frames 0, 1, 2, 3, 4, 5 (every
 *     50ms), each time restarting the envelope — creating a held tone.
 *
 * All blocks emit exactly one SLEEP per frame to stay in lock-step.
 * Consecutive empty frames are collapsed into a single longer SLEEP
 * to keep the assembly compact.
 *
 * The assembly does NOT loop (no LABEL/GOTO) — audio plays once.
 */
function buildBlockAsm(
	notes: Note[],
	pitchToIndex: Map<number, number>,
	blockCount: number,
	frameCount: number,
): string[][] {
	// Build a set of (frame, sndIndex) pairs that should fire
	const fires = new Set<number>(); // encoded as frame * 1000 + sndIndex
	const encode = (frame: number, idx: number) => frame * 10000 + idx;

	for (const note of notes) {
		const sndIndex = pitchToIndex.get(note.pitch);
		if (sndIndex === undefined) continue;

		const startFrame = Math.round(
			(note.startTime * 1000) / FRAME_INTERVAL_MS,
		);
		const endFrame = Math.round((note.endTime * 1000) / FRAME_INTERVAL_MS);

		// Re-trigger every frame the note is active
		for (let f = startFrame; f <= endFrame && f < frameCount; f++) {
			fires.add(encode(f, sndIndex));
		}
	}

	// Build per-block assembly, collapsing silent stretches
	const blockAsm: string[][] = Array.from({ length: blockCount }, () => []);

	// Track which blocks had any fires at all (for later: skip empty blocks)
	const blockHasFire = new Array(blockCount).fill(false);

	// Per block, track pending silent ms to collapse
	const pendingMs = new Array(blockCount).fill(0);

	for (let fi = 0; fi < frameCount; fi++) {
		// Collect fires for each block this frame
		const blockFires: number[][] = Array.from(
			{ length: blockCount },
			() => [],
		);
		for (let b = 0; b < blockCount; b++) {
			const firstIdx = b * SOUNDS_PER_BLOCK;
			const lastIdx = Math.min(
				firstIdx + SOUNDS_PER_BLOCK,
				pitchToIndex.size,
			);
			for (let idx = firstIdx; idx < lastIdx; idx++) {
				if (fires.has(encode(fi, idx))) blockFires[b]!.push(idx);
			}
		}

		for (let b = 0; b < blockCount; b++) {
			const bf = blockFires[b]!;
			if (bf.length === 0) {
				// Nothing this frame — accumulate sleep
				pendingMs[b] += FRAME_INTERVAL_MS;
			} else {
				// Flush accumulated sleep
				if (pendingMs[b] > 0) {
					blockAsm[b]!.push(`SLEEP ${pendingMs[b]}`);
					pendingMs[b] = 0;
				}
				for (const idx of bf) {
					// Pulse: SET 1 then SET 0 in same frame → clean re-triggerable onset
					blockAsm[b]!.push(`SET SND_${idx}.Trg.Force 1`);
					blockAsm[b]!.push(`SET SND_${idx}.Trg.Force 0`);
				}
				blockAsm[b]!.push(`SLEEP ${FRAME_INTERVAL_MS}`);
				blockHasFire[b] = true;
			}
		}
	}

	// Flush any trailing sleep (keeps blocks idle cleanly)
	for (let b = 0; b < blockCount; b++) {
		if (pendingMs[b] > 0) blockAsm[b]!.push(`SLEEP ${pendingMs[b]}`);
	}

	return blockAsm;
}

// MARK: Main

async function audio(
	file: File,
	maxComplexity: number,
): Promise<LevelNode[] | null> {
	try {
		return await generate(file, maxComplexity);
	} catch (e) {
		if (e instanceof Error) window.toast(e, 'error');
		return null;
	}
}

async function generate(
	file: File,
	maxComplexity: number,
): Promise<LevelNode[]> {
	// How many distinct pitches fit in the budget?
	const maxPitches = maxPitchesForBudget(
		maxComplexity,
		SOUNDS_PER_BLOCK,
		COST_SOUND,
		COST_TRIGGER,
		COST_GASM,
	);
	if (maxPitches === 0)
		throw new Error('Complexity budget too low to fit even one note.');

	// Analyse audio → quality-filtered notes
	const notes = await analyseAudio(file);
	if (!notes.length) throw new Error('No notes detected in audio file.');

	// Quantize pitches and select top N within budget
	const uniquePitches = quantizeAndSelect(notes, maxPitches);

	const totalDuration = Math.max(...notes.map((n) => n.endTime)) + 0.5;
	const frameCount = Math.ceil((totalDuration * 1000) / FRAME_INTERVAL_MS);
	const blockCount = Math.ceil(uniquePitches.length / SOUNDS_PER_BLOCK);

	// Stable pitch → index map
	const pitchToIndex = new Map<number, number>(
		uniquePitches.map((p, i) => [p, i]),
	);

	// Code nodes
	const code_nodes: LevelNodeWith<LevelNodeGASM>[] = [];
	for (let b = 0; b < blockCount; b++) {
		const code = levelNodeWithGASM();
		const cn = code.levelNodeGASM;
		cn.startActive = true;
		(cn.position ??= {}).z = -2;
		cn.position.x = b * SOUNDS_PER_BLOCK;
		cn.position.y = -3;
		code_nodes.push(code);
	}

	// Sound + trigger nodes
	const sound_nodes: LevelNodeWith<LevelNodeSound>[] = [];
	const trigger_nodes: LevelNodeWith<LevelNodeTrigger>[] = [];

	for (const [pitch, sndIndex] of pitchToIndex) {
		const objectID = sndIndex + 1;
		const blockIndex = Math.floor(sndIndex / SOUNDS_PER_BLOCK);
		const alias = `SND_${sndIndex}`;

		const sndNode = makeSoundNode(pitch, sndIndex);
		sound_nodes.push(sndNode);

		const trgNode = makeTriggerNode(sndIndex);
		trigger_nodes.push(trgNode);

		// Source: BLOCK type — activated by code block
		const source = triggerSourceWithBasic();
		source.triggerSourceBasic!.type = TriggerSourceBasicType.BLOCK;
		(trgNode.levelNodeTrigger!.triggerSources ??= []).push(source);

		// Target: RESTART — clean re-trigger even mid-envelope
		const target = triggerTargetWithSound();
		target.triggerTargetSound!.objectID = objectID;
		target.triggerTargetSound!.mode = TriggerTargetSoundMode.RESTART;
		(trgNode.levelNodeTrigger!.triggerTargets ??= []).push(target);

		// Connect code block → trigger via alias
		create_connection(
			code_nodes[blockIndex]!,
			trgNode,
			objectID + uniquePitches.length,
			'triggerActive',
			alias,
		);
	}

	// Build GASM and compile — no LABEL/GOTO, plays once
	const blockAsm = buildBlockAsm(notes, pitchToIndex, blockCount, frameCount);

	for (let b = 0; b < blockCount; b++) {
		asm_to_json(blockAsm[b]!.join('\n'), code_nodes[b]!);
	}

	return [...sound_nodes, ...trigger_nodes, ...code_nodes];
}

export default { audio };
