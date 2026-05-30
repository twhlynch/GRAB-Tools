// MIDI Tool by TheTrueFax (https://github.com/thetruefax/)

import { load } from '@/assets/encoding/root';
import { deepClone } from '@/assets/encoding/utils';
import { levelNodeWith, triggerSourceWith, triggerTargetWith } from '@/generated/util';
import { triggerTargetSound } from '@/generated/helpers';
import { animation, animationFrame } from '@/generated/helpers';
import {
    levelNodeWithGroup,
    levelNodeWithSound,
    levelNodeWithStatic,
    levelNodeWithTrigger,
    triggerSourceWithBasic,
    triggerTargetWithSound,
} from '@/generated/nodes';
import { ComplexArray } from 'jsfft';
import { groupNodes } from '../encoding/group';

// MIDI file helper
import "https://unpkg.com/@tonejs/midi@2.0.28/build/Midi.js";

/**
 * @param {File} file - An image file
 * @param {Number} samples - samples
 * @returns {Promise<Object>} - A group level node
 */
async function midi(file, node_count) {

    try {
        const level_nodes = await generate(file, node_count);
        if (!level_nodes) return null;
        return groupNodes(level_nodes);
    } catch (e) {
        window.toast(e, 'error');
        return null;
    }
}

// Node helpers
function getBasicSoundBlock(pitch, amplitude, isNoise) {
    const node = levelNodeWithSound();
    node.levelNodeSound.position.z = -2;
    node.levelNodeSound.name = uniqueSoundName();
    node.levelNodeSound.volume = amplitude;
    node.levelNodeSound.maxRangeFactor = 1000;
    node.levelNodeSound.parameters = {
        ...node.levelNodeSound.parameters,
        ...{
            waveType: (isNoise)? 3:2, // 2 = sine, 3 = noise
            envelopeAttack: 0,
            envelopeSustain: 0,
            envelopeRelease: 5,
            frequencyBase: pitch,
            frequencyLimit: 35,
            pitchJumpMod: 0.10000000149011612,
            lowPassFilterFrequency: 10000,
        },
    };
    return node;
}
function getSoundTriggerBlock(x, y, targetID) {
	const targetSoundModes = load().COD.Level.TriggerTargetSound.Mode;
	const sourceBasicTypes = load().COD.Level.TriggerSourceBasic.Type;

	const node = levelNodeWithTrigger();
	node.levelNodeTrigger.position.z = x;
	node.levelNodeTrigger.scale = { x: 0.03, y: 0.9, z: 0.9 };
	node.levelNodeTrigger.position.y = y;

	const source = triggerSourceWithBasic();
	source.triggerSourceBasic.type = sourceBasicTypes.BLOCK;
	node.levelNodeTrigger.triggerSources.push(source);

	const startTarget = triggerTargetWithSound();
	startTarget.triggerTargetSound.objectID = targetID;
    startTarget.triggerTargetSound.repeat = true;
	node.levelNodeTrigger.triggerTargets.push(startTarget);

    const stopTarget = triggerTargetWithSound();
	stopTarget.triggerTargetSound.objectID = targetID;
	stopTarget.triggerTargetSound.mode = targetSoundModes.STOP;
    stopTarget.mode = 1; // On exit, its easier to not import the TriggerTarget mode enum
	node.levelNodeTrigger.triggerTargets.push(stopTarget);

	const anim = animation();
	anim.frames.push(animationFrame());
	node.animations = [anim];

	return node;
}
function soundTarget(mode, object_id) {
	const target = triggerTargetWithSound();
	target.triggerTargetSound.objectID = object_id;
	target.triggerTargetSound.mode = mode;
	return target;
}

// Other helpers
function uniqueSoundName() {
	const chars =
		'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890';
	let output = '';
	for (let i = 0; i < 5; i++) {
		output += chars[Math.floor(Math.random() * chars.length)];
	}
	return `SFX2GRAB-${output}`;
}
async function decodeMidiFileAsJson(file) {
    if (!file) return;

    const buffer = await file.arrayBuffer();

    return new Midi(buffer);
}
function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}
function getUseableTracks(midi) {
    var tracks = [];
    midi.tracks.forEach(track => {
        if (track.notes.length == 0) { // No notes, no track
            return;
        }
        tracks.push(track);
    });
    return tracks;
}
function parseUnparsedTracks(tracks) {
    var newTracks = [];
    tracks.forEach(track => {
        var notes = [];

        var avgVelocity = 0;

        track.notes.forEach(note => {
            notes.push({
                start: note.time,
                duration: note.duration,
                freqHz: midiToHz(note.midi),
                midi: note.midi
            });
            avgVelocity += note.velocity;
        });
        avgVelocity /= track.notes.length;

        var trackVolume = 1;
        if (track.controlChanges[7]) {
            trackVolume = track.controlChanges[7][0].value;
        }

        newTracks.push({
            channel: track.channel,
            volume: trackVolume * avgVelocity,
            instrument: track.instrument.number,
            name: track.name,
            notes: notes,
            isDrums: track.channel == 9
        });
    });
    return newTracks;
}
function getUniquePitches(track) {
    var uniquePitches = [];
    track.notes.forEach(note => {
        if (!uniquePitches.includes(note.freqHz)) {
            uniquePitches.push(note.freqHz);
        }
    });
    return uniquePitches;
}
function getNotesByPitch(track) {
    var notesByPitch = {};
    track.notes.forEach(note => {
        let strHz = note.freqHz.toString();
        if (notesByPitch[strHz]) {
            notesByPitch[strHz].push(note);
        } else {
            notesByPitch[strHz] = [note];
        }
    });
    return notesByPitch;
}
function getDuration(tracks) {
    var longest = 0;
    tracks.forEach(track => {
        track.notes.forEach(note => {
            if (note.start + note.duration>longest) {
                longest = note.start + note.duration;
            }
        });
    });
    return longest;
}


async function generate(file, node_count) {
    // Decode midi file into JSON
    const midi = await decodeMidiFileAsJson(file);

    // Get the available tracks that can be parsed
    const unparsedTracks = getUseableTracks(midi);

    // Turn the units inside the note into useable units by GRAB
    // Eg: turn the midi pitch value into hz
    const tracks = parseUnparsedTracks(unparsedTracks);
    console.log(tracks, unparsedTracks);

    // Get duration of song in seconds
    const duration = getDuration(tracks);
    
    var soundBlocks = [];
    var triggers = [];
    var wallNodes = [];

    var biggestTriggerCount = 0;

    for (let t=0; t<tracks.length;t++) {
        // Get unique pitches to create sound blocks and triggers from
        const uniquePitches = getUniquePitches(tracks[t]);

        let current_soundblocks = soundBlocks.length;
        let current_triggers = triggers.length;

        // Make each sound block for each pitch
        uniquePitches.forEach(hz => soundBlocks.push(getBasicSoundBlock(hz * ((tracks[t].isDrums)? 2.5:1), tracks[t].volume, tracks[t].isDrums)));

        // Create triggers linked to each sound block
        for (let i=0; i<uniquePitches.length; i++) {
            triggers.push(getSoundTriggerBlock(i, t+1, i + node_count + 2 + current_soundblocks));
        }
        if (uniquePitches.length>biggestTriggerCount) {
            biggestTriggerCount = uniquePitches.length;
        }

        // For efficient access
        const notesByPitch = getNotesByPitch(tracks[t]);

        // Create animations for each trigger according to the notes
        for (let i=0; i<uniquePitches.length; i++) {
            let currentTriggerAnim = triggers[i+current_triggers].animations[0];
            let hz = uniquePitches[i];

            let notes = notesByPitch[hz.toString()];
            for (let x=0; x<notes.length; x++) {
                let prevFrame = animationFrame();
                prevFrame.time = notes[x].start - 0.05;
                prevFrame.position.x = 0;
                currentTriggerAnim.frames.push(prevFrame);

                let frame = animationFrame();
                frame.time = notes[x].start;
                frame.position.x = 1;
                currentTriggerAnim.frames.push(frame);

                let postFrame = animationFrame();
                postFrame.time = notes[x].start + notes[x].duration + 0.05;
                postFrame.position.x = 0;
                currentTriggerAnim.frames.push(postFrame);
            }

            let endFrame = animationFrame();
            endFrame.time = Math.ceil(duration);
            currentTriggerAnim.frames.push(endFrame);
        }

        let wallNode = levelNodeWithStatic();
        wallNode.levelNodeStatic.position = { x: 0.55, y: t+1, z: (uniquePitches.length - 1)/2 };
        wallNode.levelNodeStatic.scale = { x: 1, y: 1, z: uniquePitches.length };
        wallNodes.push(wallNode);
    }

    return [...soundBlocks, ...triggers, ...wallNodes];
}


export default {
    midi,
}