import { SoundGeneratorParameters } from '@/generated/proto';
import { sfxr } from 'jsfxr';

// missing some keys:
// p_lpf_ramp p_lpf_resonance p_hpf_ramp
// reverbDelay reverbDecayFactor

const PARAM_MAP: Record<string, string> = {
	waveType: 'wave_type',
	envelopeAttack: 'p_env_attack',
	envelopeSustain: 'p_env_sustain',
	envelopePunch: 'p_env_punch',
	envelopeRelease: 'p_env_decay',
	frequencyBase: 'p_base_freq',
	frequencyLimit: 'p_freq_limit',
	frequencyRamp: 'p_freq_ramp',
	frequencyDeltaRamp: 'p_freq_dramp',
	vibratoStrength: 'p_vib_strength',
	vibratoSpeed: 'p_vib_speed',
	pitchJumpMod: 'p_arp_mod',
	pitchJumpSpeed: 'p_arp_speed',
	dutyCycle: 'p_duty',
	dutyCycleRamp: 'p_duty_ramp',
	repeatSpeed: 'p_repeat_speed',
	flangerFrequency: 'p_pha_offset',
	flangerDepth: 'p_pha_ramp',
	lowPassFilterFrequency: 'p_lpf_freq',
	highPassFilterFrequency: 'p_hpf_freq',
};

const CONVERSION_MAP: Record<string, (v: number) => number> = {
	p_env_attack: (v) => clamp(v / 2.5, 0, 1),
	p_env_sustain: (v) => clamp(v / 5.0, 0, 1),
	p_env_punch: (v) => clamp(v / 10.0, 0, 1),
	p_env_decay: (v) => clamp(v / 2.5, 0, 1),
	p_base_freq: (v) => log_norm(v, 35, 3500),
	p_freq_limit: (v) => log_norm(v, 35, 3500),
	p_freq_ramp: (v) => clamp(v / 100, -1, 1),
	p_freq_dramp: (v) => clamp(v / 100, -1, 1),
	p_vib_strength: (v) => clamp(v / 0.5, 0, 1),
	p_vib_speed: (v) => clamp(v / 400, 0, 1),
	p_arp_mod: (v) => clamp((v - 1) / 9, -1, 1),
	p_arp_speed: (v) => clamp(v / 2.5, 0, 1),
	p_duty: (v) => clamp(v / 0.5, 0, 1),
	p_duty_ramp: (v) => clamp(v, -1, 1),
	p_repeat_speed: (v) => clamp(v / 2.5, 0, 1),
	p_pha_offset: (v) => clamp(v / 100, 0, 1),
	p_pha_ramp: (v) => clamp(v, 0, 1),
	p_lpf_freq: (v) => log_norm(v, 1, 10000),
	p_hpf_freq: (v) => log_norm(v, 1, 10000),
};

export function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function log_norm(value: number, min: number, max: number) {
	const safe_min = Math.max(min, 1e-8);
	const safe_value = Math.max(value, safe_min);

	const min_log = Math.log(safe_min);
	const max_log = Math.log(max);

	return clamp((Math.log(safe_value) - min_log) / (max_log - min_log), 0, 1);
}

export function play_sound(params: SoundGeneratorParameters) {
	// prettier-ignore
	const sfxr_params: Record<string, number | boolean> = {
		oldParams: true,
		wave_type: 0,
		p_env_attack: 0, p_env_sustain: 0, p_env_punch: 0, p_env_decay: 0,
		p_base_freq: 0, p_freq_limit: 0, p_freq_ramp: 0, p_freq_dramp: 0,
		p_vib_strength: 0, p_vib_speed: 0,
		p_arp_mod: 0, p_arp_speed: 0,
		p_duty: 0, p_duty_ramp: 0,
		p_repeat_speed: 0,
		p_pha_offset: 0, p_pha_ramp: 0,
		p_lpf_freq: 0, p_lpf_ramp: 0, p_lpf_resonance: 0,
		p_hpf_freq: 0, p_hpf_ramp: 0,
		sound_vol: 0.5,
		sample_rate: 44100,
		sample_size: 8,
	}

	for (const [key, value] of Object.entries(params)) {
		const sfxr_key = PARAM_MAP[key];
		if (sfxr_key)
			sfxr_params[sfxr_key] = CONVERSION_MAP[sfxr_key]?.(value) ?? value;
	}

	sfxr.play(sfxr_params);
}
