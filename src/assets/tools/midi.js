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
function get_basic_sound_block(pitch, amplitude, isNoise) {
    const node = levelNodeWithSound();
    node.levelNodeSound.position.z = -2;
    node.levelNodeSound.name = unique_sound_name();
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
function get_sound_trigger_block(x, y, target_id) {
	const targetSoundModes = load().COD.Level.TriggerTargetSound.Mode;
	const sourceBasicTypes = load().COD.Level.TriggerSourceBasic.Type;

	const node = levelNodeWithTrigger();
	node.levelNodeTrigger.position.z = x;
	node.levelNodeTrigger.scale = { x: 0.03, y: 0.9, z: 0.9 };
	node.levelNodeTrigger.position.y = y;

	const source = triggerSourceWithBasic();
	source.triggerSourceBasic.type = sourceBasicTypes.BLOCK;
	node.levelNodeTrigger.triggerSources.push(source);

	const start_target = triggerTargetWithSound();
	start_target.triggerTargetSound.objectID = target_id;
    start_target.triggerTargetSound.repeat = true;
	node.levelNodeTrigger.triggerTargets.push(start_target);

    const stop_target = triggerTargetWithSound();
	stop_target.triggerTargetSound.objectID = target_id;
	stop_target.triggerTargetSound.mode = targetSoundModes.STOP;
    stop_target.mode = 1; // On exit, its easier to not import the TriggerTarget mode enum
	node.levelNodeTrigger.triggerTargets.push(stop_target);

	const anim = animation();
	anim.frames.push(animationFrame());
	node.animations = [anim];

	return node;
}

// Other helpers
function unique_sound_name() {
	const chars =
		'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890';
	let output = '';
	for (let i = 0; i < 5; i++) {
		output += chars[Math.floor(Math.random() * chars.length)];
	}
	return `MIDI-${output}`;
}
async function decode_midi_file_as_json(file) {
    if (!file) return;

    const buffer = await file.arrayBuffer();

    return new Midi(buffer);
}
function midi_to_hz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}
function get_useable_tracks(midi) {
    var tracks = [];
    midi.tracks.forEach(track => {
        if (track.notes.length == 0) { // No notes, no track
            return;
        }
        tracks.push(track);
    });
    return tracks;
}
function parse_unparsed_tracks(tracks) {
    var new_tracks = [];
    tracks.forEach(track => {
        var notes = [];

        var average_velocity = 0;

        track.notes.forEach(note => {
            notes.push({
                start: note.time,
                duration: note.duration,
                frequency_hertz: midi_to_hz(note.midi),
                midi: note.midi
            });
            average_velocity += note.velocity;
        });
        average_velocity /= track.notes.length;

        var track_volume = 1;
        if (track.controlChanges[7]) {
            track_volume = track.controlChanges[7][0].value;
        }

        new_tracks.push({
            channel: track.channel,
            volume: track_volume * average_velocity,
            instrument: track.instrument.number,
            name: track.name,
            notes: notes,
            isDrums: track.channel == 9
        });
    });
    return new_tracks;
}
function get_unique_pitches(track) {
    var unique_pitches = [];
    track.notes.forEach(note => {
        if (!unique_pitches.includes(note.frequency_hertz)) {
            unique_pitches.push(note.frequency_hertz);
        }
    });
    return unique_pitches;
}
function get_notes_by_pitch(track) {
    var notes_by_pitch = {};
    track.notes.forEach(note => {
        let frequency_string = note.frequency_hertz.toString();
        if (notes_by_pitch[frequency_string]) {
            notes_by_pitch[frequency_string].push(note);
        } else {
            notes_by_pitch[frequency_string] = [note];
        }
    });
    return notes_by_pitch;
}
function get_duration(tracks) {
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
    const midi = await decode_midi_file_as_json(file);

    // Get the available tracks that can be parsed
    const unparsed_tracks = get_useable_tracks(midi);

    // Turn the units inside the note into useable units by GRAB
    // Eg: turn the midi pitch value into hz
    const tracks = parse_unparsed_tracks(unparsed_tracks);
    console.log(tracks, unparsed_tracks);

    // Get duration of song in seconds
    const duration = get_duration(tracks);
    
    var sound_blocks = [];
    var triggers = [];
    var wall_blocks = [];

    for (let t=0; t<tracks.length;t++) {
        // Get unique pitches to create sound blocks and triggers from
        const unique_pitches = get_unique_pitches(tracks[t]);

        let current_soundblocks = sound_blocks.length;
        let current_triggers = triggers.length;

        // Make each sound block for each pitch
        unique_pitches.forEach(hz => sound_blocks.push(get_basic_sound_block(hz * ((tracks[t].isDrums)? 2.5:1), tracks[t].volume, tracks[t].isDrums)));

        // Create triggers linked to each sound block
        for (let i=0; i<unique_pitches.length; i++) {
            triggers.push(get_sound_trigger_block(i, t+1, i + node_count + 2 + current_soundblocks));
        }

        // For efficient access
        const notes_by_pitch = get_notes_by_pitch(tracks[t]);

        // Create animations for each trigger according to the notes
        for (let i=0; i<unique_pitches.length; i++) {
            let current_trigger_animation = triggers[i+current_triggers].animations[0];
            let hz = unique_pitches[i];

            let notes = notes_by_pitch[hz.toString()];
            for (let x=0; x<notes.length; x++) {
                let previous_frame = animationFrame();
                previous_frame.time = notes[x].start - 0.05;
                previous_frame.position.x = 0;
                current_trigger_animation.frames.push(previous_frame);

                let frame = animationFrame();
                frame.time = notes[x].start;
                frame.position.x = 1;
                current_trigger_animation.frames.push(frame);

                let next_frame = animationFrame();
                next_frame.time = notes[x].start + notes[x].duration + 0.05;
                next_frame.position.x = 0;
                current_trigger_animation.frames.push(next_frame);
            }

            let last_frame = animationFrame();
            last_frame.time = Math.ceil(duration);
            current_trigger_animation.frames.push(last_frame);
        }

        let wall_block = levelNodeWithStatic();
        wall_block.levelNodeStatic.position = { x: 0.55, y: t+1, z: (unique_pitches.length - 1)/2 };
        wall_block.levelNodeStatic.scale = { x: 1, y: 1, z: unique_pitches.length };
        wall_blocks.push(wall_block);
    }

    return [...sound_blocks, ...triggers, ...wall_blocks];
}


export default {
    midi,
}