import { animation, animationFrame } from '@/generated/helpers';
import {
	levelNodeWithSound,
	levelNodeWithStatic,
	levelNodeWithTrigger,
	triggerSourceWithBasic,
	triggerTargetWithAnimation,
	triggerTargetWithSound,
} from '@/generated/nodes';
import {
	SoundGeneratorParametersWaveType,
	TriggerSourceBasicType,
	TriggerTargetAnimationMode,
	TriggerTargetMode,
	TriggerTargetSoundMode,
} from '@/generated/proto';
import { Midi } from '@tonejs/midi';
import { groupNodes } from '../encoding/group';

/**
 * @param {File} file - A midi file
 * @param {Number} node_count - node count to offset ids
 * @param {Boolean} start_active - should the animation be start active
 * @param {Boolean} loop - should the animation loop
 * @returns {Promise<Object>} - A group level node
 */
async function midi(file, node_count, start_active, loop) {
	if (start_active && !loop) {
		window.toast('Cannot make an animation start active and not looping.', 'error');
		return null;
	}
	try {
		const level_nodes = await generate(file, node_count, start_active, loop);
		if (!level_nodes) return null;
		return groupNodes(level_nodes);
	} catch (e) {
		window.toast(e, 'error');
		return null;
	}
}

// Node helpers
function get_basic_sound_block(position, pitch, amplitude, isNoise) {
	const node = levelNodeWithSound();
	node.levelNodeSound.position = position;
	node.levelNodeSound.name = unique_sound_name();
	node.levelNodeSound.volume = amplitude * (isNoise ? 0.3 : 1);
	node.levelNodeSound.maxRangeFactor = 1000;
	node.levelNodeSound.parameters = {
		...node.levelNodeSound.parameters,
		...{
			waveType: isNoise
				? SoundGeneratorParametersWaveType.Noise
				: SoundGeneratorParametersWaveType.Sine,
			envelopeAttack: 0,
			envelopeSustain: 0,
			envelopeRelease: isNoise ? 0.3 : 5,
			envelopePunch: isNoise ? 100 : 10,
			frequencyBase: pitch,
			frequencyLimit: 35,
			pitchJumpMod: 0.10000000149011612,
			lowPassFilterFrequency: 10000,
		},
	};
	return node;
}
function get_sound_trigger_block(x, y, target_id, start_active, looping) {
	const node = levelNodeWithTrigger();
	node.levelNodeTrigger.position.z = x;
	node.levelNodeTrigger.scale = { x: 0.03, y: 0.9, z: 0.9 };
	node.levelNodeTrigger.position.y = y;

	const source = triggerSourceWithBasic();
	source.triggerSourceBasic.type = TriggerSourceBasicType.BLOCK;
	node.levelNodeTrigger.triggerSources.push(source);

	const start_target = triggerTargetWithSound();
	start_target.triggerTargetSound.objectID = target_id;
	start_target.triggerTargetSound.repeat = looping;
	node.levelNodeTrigger.triggerTargets.push(start_target);

	const stop_target = triggerTargetWithSound();
	stop_target.triggerTargetSound.objectID = target_id;
	stop_target.triggerTargetSound.mode = TriggerTargetSoundMode.STOP;
	stop_target.mode = TriggerTargetMode.ONLEAVE;
	node.levelNodeTrigger.triggerTargets.push(stop_target);

	const anim = animation();
	anim.frames.push(animationFrame());
	node.animations = [anim];

	node.activeAnimation = (start_active) ? 0:-1;

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
function midi_to_hz(m) {
	return 440 * Math.pow(2, (m - 69) / 12);
}
function get_useable_tracks(m) {
	var tracks = [];
	m.tracks.forEach((track) => {
		if (track.notes.length == 0) {
			// No notes, no track
			return;
		}
		tracks.push(track);
	});
	return tracks;
}
function parse_unparsed_tracks(tracks) {
	var new_tracks = [];
	tracks.forEach((track) => {
		var notes = [];

		var average_velocity = 0;

		track.notes.forEach((note) => {
			notes.push({
				start: note.time,
				duration: note.duration,
				frequency_hertz: midi_to_hz(note.midi),
				midi: note.midi,
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
			isDrums: track.channel == 9,
		});
	});
	return new_tracks;
}
function get_unique_pitches(track) {
	var unique_pitches = [];
	track.notes.forEach((note) => {
		if (!unique_pitches.includes(note.frequency_hertz)) {
			unique_pitches.push(note.frequency_hertz);
		}
	});
	return unique_pitches;
}
function get_unique_pitches_tracks(tracks) {
	var unique_pitches = [];
	tracks.forEach((track) => {
		track.notes.forEach((note) => {
			if (!unique_pitches.includes(note.frequency_hertz)) {
				unique_pitches.push(note.frequency_hertz);
			}
		});
	});
	return unique_pitches;
}
function get_notes_by_pitch(track) {
	var notes_by_pitch = {};
	track.notes.forEach((note) => {
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
	tracks.forEach((track) => {
		track.notes.forEach((note) => {
			if (note.start + note.duration > longest) {
				longest = note.start + note.duration;
			}
		});
	});
	return longest;
}
function make_connected_trigger(
	position,
	current_soundblocks,
	trigger_count,
	node_count,
	target_mode,
	do_loop,
) {
	var trigger = levelNodeWithTrigger();
	trigger.levelNodeTrigger.position = position;
	trigger.levelNodeTrigger.scale = { x: 1, y: 1, z: 1 };

	for (
		let i = current_soundblocks + node_count + 1;
		i < trigger_count + current_soundblocks + node_count + 2;
		i++
	) {
		let target = triggerTargetWithAnimation();
		target.triggerTargetAnimation.objectID = i;
		target.triggerTargetAnimation.loop = do_loop;
		target.triggerTargetAnimation.mode = target_mode;

		trigger.levelNodeTrigger.triggerTargets.push(target);
	}

	return trigger;
}

// This function isn't used yet, It has the capability to save complexity more than any other method, ill get it working later
function combine_notes(tracks) {
	var notes_by_time = [];
	tracks.forEach(track => {
		if (track.isDrums) return;
		track.notes.forEach(note => {
			notes_by_time.push({
				original_track: track.name,
				pitch: note.frequency_hertz,
				start: note.start,
				end: note.start + note.duration,
			});
		});
	});
	notes_by_time = notes_by_time.toSorted((a, b) => a.start - b.start);
	console.log(notes_by_time);
	var pitches_left_to_merge = get_unique_pitches_tracks(tracks);
	console.log(pitches_left_to_merge.length);
	for (let i=0;i<notes_by_time.length-1;i++) {
		let searchIndex = i+1;
		while (notes_by_time[searchIndex].start < notes_by_time[i].end && searchIndex < notes_by_time.length-1) {
			let my_pitch = notes_by_time[i].pitch;
			if (notes_by_time[searchIndex].pitch == my_pitch && pitches_left_to_merge.includes(my_pitch)) {
				let index = pitches_left_to_merge.indexOf(my_pitch);
				pitches_left_to_merge.splice(index, 1);
			}
			searchIndex++;
		}
	}
	console.log(pitches_left_to_merge);
	var merged_track_notes = [];
	tracks.forEach(track => {
		if (track.isDrums) return;
		var new_notes = [];
		track.notes.forEach(note => {
			if (pitches_left_to_merge.includes(note.frequency_hertz)) {
				merged_track_notes.push(note);
			} else {
				new_notes.push(note);
			}
		});
		track.notes = new_notes;
	});
	tracks.push({
		channel: 0,
		instrument: 0,
		isDrums: false,
		name: "Merged track",
		volume: 0.7, // idk?
		notes: merged_track_notes,
	});
	return tracks;
}

async function generate(file, node_count, start_active, loop) {
	// Decode midi file into JSON
	const m = await decode_midi_file_as_json(file);

	// Get the available tracks that can be parsed
	const unparsed_tracks = get_useable_tracks(m);

	// Turn the units inside the note into useable units by GRAB
	// Eg: turn the midi pitch value into hz
	const tracks = parse_unparsed_tracks(unparsed_tracks);
	console.log(tracks, unparsed_tracks);

	// Get duration of song in seconds
	const duration = get_duration(tracks);

	var sound_blocks = [];
	var triggers = [];
	var wall_blocks = [];

	for (let t = 0; t < tracks.length; t++) {
		// Get unique pitches to create sound blocks and triggers from
		const unique_pitches = get_unique_pitches(tracks[t]);

		let current_soundblocks = sound_blocks.length;
		let current_triggers = triggers.length;

		// Make each sound block for each pitch
		unique_pitches.forEach((hz) =>
			sound_blocks.push(
				get_basic_sound_block(
					{ x: 0, y: t, z: -1 },
					hz * (tracks[t].isDrums ? 2.5 : 1),
					tracks[t].volume,
					tracks[t].isDrums,
				),
			),
		);

		// Create triggers linked to each sound block
		for (let i = 0; i < unique_pitches.length; i++) {
			triggers.push(
				get_sound_trigger_block(
					i,
					t,
					i + node_count + 2 + current_soundblocks,
					start_active,
				),
			);
		}

		// For efficient access
		const notes_by_pitch = get_notes_by_pitch(tracks[t]);

		// Create animations for each trigger according to the notes
		for (let i = 0; i < unique_pitches.length; i++) {
			let current_trigger_animation =
				triggers[i + current_triggers].animations[0];
			let hz = unique_pitches[i];

			let notes = notes_by_pitch[hz.toString()];
			for (let x = 0; x < notes.length; x++) {
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
		wall_block.levelNodeStatic.position = {
			x: 0.55,
			y: t,
			z: (unique_pitches.length - 1) / 2,
		};
		wall_block.levelNodeStatic.scale = {
			x: 1,
			y: 1,
			z: unique_pitches.length,
		};
		wall_blocks.push(wall_block);
	}

	var trigger_stop = make_connected_trigger(
		{ x: 0, y: 0, z: -3 },
		sound_blocks.length,
		triggers.length,
		node_count,
		TriggerTargetAnimationMode.STOP,
		loop,
	);
	var trigger_start = make_connected_trigger(
		{ x: 0, y: 1, z: -3 },
		sound_blocks.length,
		triggers.length,
		node_count,
		TriggerTargetAnimationMode.START,
		loop,
	);
	var trigger_restart = make_connected_trigger(
		{ x: 0, y: 2, z: -3 },
		sound_blocks.length,
		triggers.length,
		node_count,
		TriggerTargetAnimationMode.RESTART,
		loop,
	);

	return [
		...sound_blocks,
		...triggers,
		...wall_blocks,
		trigger_stop,
		trigger_start,
		trigger_restart,
	];
}

export default {
	midi,
};
