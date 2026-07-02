import { groupNodes } from '@/common/group';
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
import { get_instrument } from './instrument_map';

/**
 * @param {File} file - A midi file
 * @param {Number} node_count - node count to offset ids
 * @param {String} inst_type - instrument generation type
 * @param {Boolean} start_active - should the animation be start active
 * @param {Boolean} loop - should the animation loop
 * @param {Boolean} optimize - option to merge tracks which can optimize complexity
 * @param {Number} volume - volume multiplier for whole song (0-1)
 * @returns {Promise<Object>} - A group level node
 */
async function midi(
	file,
	node_count,
	inst_type,
	start_active,
	loop,
	optimize,
	volume,
) {
	//console.log(inst_type);
	if (start_active && !loop) {
		// Can't make a non-looping start active animation in grab.
		window.toast(
			'Cannot make an animation start active and not looping.',
			'error',
		);
		return null;
	}
	if (optimize && inst_type == 'Auto Instrument') {
		// Merging tracks with instruments is a no-go and also plain dosent work
		window.toast(
			'Cannot optimize an "Auto Instrument" MIDI song.',
			'error',
		);
		return null;
	}
	try {
		const level_nodes = await generate(
			file,
			node_count,
			start_active,
			loop,
			optimize,
			volume,
			inst_type,
		);
		if (!level_nodes) return null;
		return groupNodes(level_nodes);
	} catch (e) {
		window.toast(e, 'error');
		return null;
	}
}

// Node helpers
function get_basic_sound_block(position, pitch, amplitude, instrument) {
	return levelNodeWithSound({
		position: position,
		name: generate_sound_name(instrument.name, Math.floor(pitch)),
		volume: amplitude * instrument.volume,
		maxRangeFactor: 1000,
		parameters: {
			...levelNodeWithSound().levelNodeSound.parameters,
			...instrument.parameters,
			frequencyBase: pitch,
			frequencyLimit: 35,
			pitchJumpMod: 0.10000000149011612,
			lowPassFilterFrequency: 10000,
			dutyCycle:
				instrument.wave == SoundGeneratorParametersWaveType.Square
					? 0.5
					: 0, // Duty cycle required for square waves
		},
	});
}
function get_basic_sound_block_drums(position, amplitude, instrument) {
	return levelNodeWithSound({
		position: position,
		name: generate_sound_name(instrument.name, null),
		volume: amplitude * instrument.volume,
		maxRangeFactor: 1000,
		parameters: {
			...instrument.parameters,
			waveType: SoundGeneratorParametersWaveType.Noise,
			frequencyBase: 440,
			frequencyLimit: 35,
			pitchJumpMod: 0.10000000149011612,
			lowPassFilterFrequency: 10000,
		},
	});
}
function get_basic_sound_block_classic(
	position,
	pitch,
	amplitude,
	isNoise,
	waveType,
) {
	return levelNodeWithSound({
		position: position,
		name: generate_sound_name(null, Math.floor(pitch)),
		volume: amplitude * (isNoise ? 0.3 : 1),
		maxRangeFactor: 1000,
		parameters: {
			...levelNodeWithSound().levelNodeSound.parameters,
			waveType: isNoise
				? SoundGeneratorParametersWaveType.Noise
				: waveType,
			envelopeAttack: 0,
			envelopeSustain: 0,
			envelopeRelease: isNoise ? 0.3 : 5,
			envelopePunch: isNoise ? 100 : 0,
			frequencyBase: pitch,
			frequencyLimit: 35,
			pitchJumpMod: 0.10000000149011612,
			lowPassFilterFrequency: 10000,
			dutyCycle:
				waveType == SoundGeneratorParametersWaveType.Square ? 0.5 : 0, // Duty cycle required for square waves
		},
	});
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

	node.activeAnimation = start_active ? 0 : -1;

	return node;
}

// Other helpers
function generate_sound_name(instrument_name, pitch) {
	return [instrument_name && `${instrument_name}`, pitch && `${pitch}hz`]
		.filter(Boolean)
		.join(' ');
}
async function decode_midi_file_as_json(file) {
	if (!file) return;

	const buffer = await file.arrayBuffer();

	return new Midi(buffer);
}
function midi_to_hz(m) {
	const hz_value = 440 * Math.pow(2, (m - 69) / 12);
	return hz_value;
}
function get_usable_tracks(m) {
	let tracks = [];
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
	let new_tracks = [];
	tracks.forEach((track) => {
		let notes = [];

		let average_velocity = 0;
		let average_note_volumes = {};
		let average_note_volumes_count = {};

		track.notes.forEach((note) => {
			notes.push({
				start: note.time,
				duration: note.duration,
				frequency_hertz:
					track.channel == 9 ? note.midi : midi_to_hz(note.midi), // the midi value needs to be preserved for drums
				midi: note.midi,
				velocity: note.velocity,
			});
			average_velocity += note.velocity;
			let hz = String(midi_to_hz(note.midi));
			if (average_note_volumes[hz]) {
				average_note_volumes[hz] += note.velocity;
				average_note_volumes_count[hz]++;
			} else {
				average_note_volumes[hz] = note.velocity;
				average_note_volumes_count[hz] = 1;
			}
		});
		average_velocity /= track.notes.length;

		// Sometimes tracks can have a volume control on controlChanges[7]
		const track_volume = track.controlChanges[7]
			? track.controlChanges[7][0].value
			: 1;

		Object.keys(average_note_volumes).forEach((key) => {
			average_note_volumes[key] =
				(average_note_volumes[key] / average_note_volumes_count[key]) *
				track_volume;
		});

		//console.log(average_note_volumes);

		new_tracks.push({
			channel: track.channel,
			volume: track_volume * average_velocity,
			note_volumes: average_note_volumes,
			instrument: track.instrument.number,
			name: track.name,
			notes: notes,
			isDrums: track.channel == 9,
		});
	});
	return new_tracks;
}
function get_unique_pitches(track) {
	let unique_pitches = [];
	track.notes.forEach((note) => {
		if (!unique_pitches.includes(note.frequency_hertz)) {
			unique_pitches.push(note.frequency_hertz);
		}
	});
	return unique_pitches;
}
function get_notes_by_pitch(track) {
	let notes_by_pitch = {};
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
	let longest = 0;
	tracks.forEach((track) => {
		track.notes.forEach((note) => {
			const note_end_time = note.start + note.duration;
			if (note_end_time > longest) {
				longest = note_end_time;
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
	const trigger = levelNodeWithTrigger();
	trigger.levelNodeTrigger.position = position;
	trigger.levelNodeTrigger.scale = { x: 1, y: 1, z: 1 };

	const trigger_start_index = current_soundblocks + node_count + 1;
	for (
		let i = trigger_start_index;
		i < trigger_count + trigger_start_index + 1;
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

// Split one track of overlapping notes into many tracks of non-overlapping notes
function split_overlapping_notes(initial_track) {
	let new_tracks = [initial_track];

	let splitted_index = 0;

	while (true) {
		let origin = [];
		let splitted = [];
		let i = 0;
		while (i < new_tracks[splitted_index].length) {
			let track = new_tracks[splitted_index];
			origin.push(track[i]);
			let scan_index = i + 1;
			while (
				scan_index < track.length - 1 &&
				track[scan_index].start < track[i].start + track[i].duration
			) {
				if (track[scan_index].midi == track[i].midi) {
					splitted.push(track[scan_index]);
				} else {
					origin.push(track[scan_index]);
				}
				scan_index++;
			}
			i = scan_index;
		}
		if (splitted.length == 0) {
			break;
		}
		new_tracks[splitted_index] = origin;
		new_tracks.push(splitted);
		splitted_index++;
	}
	return new_tracks;
}

function refactor_as_optimised(tracks) {
	const track_name_instrument = 'Combined-';
	const track_name_drums = 'Combined-drums-';

	let tracks_inst = [[]];
	let tracks_drum = [[]];
	tracks.forEach((track) => {
		track.notes.forEach((note) => {
			if (track.isDrums) {
				tracks_drum[0].push(note);
			} else {
				tracks_inst[0].push(note);
			}
		});
	});
	tracks_inst[0] = tracks_inst[0].toSorted((a, b) => a.start - b.start);
	tracks_drum[0] = tracks_drum[0].toSorted((a, b) => a.start - b.start);

	tracks_inst = split_overlapping_notes(tracks_inst[0]);
	tracks_drum = split_overlapping_notes(tracks_drum[0]);

	let new_tracks = [];

	tracks_inst.forEach((track, index) => {
		let average_note_volumes = {};
		let average_note_volumes_count = {};
		track.forEach((note) => {
			let hz = String(note.frequency_hertz);
			if (average_note_volumes[hz]) {
				average_note_volumes[hz] += note.velocity;
				average_note_volumes_count[hz]++;
			} else {
				average_note_volumes[hz] = note.velocity;
				average_note_volumes_count[hz] = 1;
			}
		});
		Object.keys(average_note_volumes).forEach((key) => {
			average_note_volumes[key] =
				average_note_volumes[key] / average_note_volumes_count[key];
		});
		new_tracks.push({
			channel: 0,
			volume: 1,
			note_volumes: average_note_volumes,
			instrument: 0,
			name: track_name_instrument + index.toString(),
			notes: track,
			isDrums: false,
		});
	});
	if (tracks_drum[0].length > 0) {
		tracks_drum.forEach((track, index) => {
			let average_note_volumes = {};
			let average_note_volumes_count = {};
			track.forEach((note) => {
				let hz = String(note.frequency_hertz);
				if (average_note_volumes[hz]) {
					average_note_volumes[hz] += note.velocity;
					average_note_volumes_count[hz]++;
				} else {
					average_note_volumes[hz] = note.velocity;
					average_note_volumes_count[hz] = 1;
				}
			});
			Object.keys(average_note_volumes).forEach((key) => {
				average_note_volumes[key] =
					average_note_volumes[key] / average_note_volumes_count[key];
			});
			new_tracks.push({
				channel: 9,
				volume: 1,
				note_volumes: average_note_volumes,
				instrument: 0,
				name: track_name_drums + index.toString(),
				notes: track,
				isDrums: true,
			});
		});
	}

	return new_tracks;
}

async function generate(
	file,
	node_count,
	start_active,
	loop,
	optimize,
	volume,
	instrument,
) {
	// Decode midi file into JSON
	const m = await decode_midi_file_as_json(file);

	// Get the available tracks that can be parsed
	const unparsed_tracks = get_usable_tracks(m);

	// Turn the units inside the note into useable units by GRAB
	const tracks = optimize
		? refactor_as_optimised(parse_unparsed_tracks(unparsed_tracks))
		: parse_unparsed_tracks(unparsed_tracks);
	console.log(tracks, unparsed_tracks);

	// Get duration of song in seconds
	const duration = get_duration(tracks);

	const is_auto_inst = instrument == 'Auto Instrument';
	const wave_type_classic = instrument.includes('Sine')
		? SoundGeneratorParametersWaveType.Sine
		: instrument.includes('Saw')
			? SoundGeneratorParametersWaveType.Sawtooth
			: SoundGeneratorParametersWaveType.Square;

	let sound_blocks = [];
	let triggers = [];
	let wall_blocks = [];

	for (let t = 0; t < tracks.length; t++) {
		// Get unique pitches to create sound blocks and triggers from
		const unique_pitches = get_unique_pitches(tracks[t]);

		let current_soundblocks = sound_blocks.length;
		let current_triggers = triggers.length;

		// Make each sound block for each pitch
		unique_pitches.forEach((hz) => {
			let track = tracks[t];
			if (track.isDrums) {
				if (is_auto_inst) {
					sound_blocks.push(
						get_basic_sound_block_drums(
							{ x: 0, y: t, z: -1 },
							track.note_volumes[String(midi_to_hz(hz))] * volume,
							get_instrument(hz, true), // hz is a preserved midi value for drum tracks
						),
					);
				} else {
					sound_blocks.push(
						get_basic_sound_block_classic(
							{ x: 0, y: t, z: -1 },
							midi_to_hz(hz) * (track.isDrums ? 2.5 : 1), // Frequency is doubled for drum tracks
							track.note_volumes[String(hz)] * volume,
							true, // is drums
							'noise',
						),
					);
				}
			} else {
				if (is_auto_inst) {
					sound_blocks.push(
						get_basic_sound_block(
							{ x: 0, y: t, z: -1 },
							hz,
							track.note_volumes[String(hz)] * volume,
							get_instrument(track.instrument, false),
						),
					);
				} else {
					sound_blocks.push(
						get_basic_sound_block_classic(
							{ x: 0, y: t, z: -1 },
							hz,
							track.note_volumes[String(hz)] * volume,
							false, // isnt drums
							wave_type_classic,
						),
					);
				}
			}
		});

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
			for (const note of notes) {
				let previous_frame = animationFrame();
				previous_frame.time = note.start - 0.05;
				previous_frame.position.x = 0;
				current_trigger_animation.frames.push(previous_frame);

				let frame = animationFrame();
				frame.time = note.start;
				frame.position.x = 1;
				current_trigger_animation.frames.push(frame);

				let next_frame = animationFrame();
				next_frame.time = note.start + note.duration - 0.05;
				next_frame.position.x = 1;
				current_trigger_animation.frames.push(next_frame);

				let next_next_frame = animationFrame();
				next_next_frame.time = note.start + note.duration;
				next_next_frame.position.x = 0;
				current_trigger_animation.frames.push(next_next_frame);
			}

			// Last frame for each block has to be at the same time to ensure sync
			let last_frame = animationFrame();
			last_frame.time = Math.ceil(duration);
			current_trigger_animation.frames.push(last_frame);
		}

		let wall_block = levelNodeWithStatic();
		wall_block.levelNodeStatic.position = {
			x: 1,
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

	const trigger_stop = make_connected_trigger(
		{ x: 0, y: 0, z: -3 },
		sound_blocks.length,
		triggers.length,
		node_count,
		TriggerTargetAnimationMode.STOP,
		loop,
	);
	const trigger_start = make_connected_trigger(
		{ x: 0, y: 1, z: -3 },
		sound_blocks.length,
		triggers.length,
		node_count,
		TriggerTargetAnimationMode.START,
		loop,
	);
	const trigger_restart = make_connected_trigger(
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
