import {
	AmbienceSettings,
	Color,
	Vector,
	Vector2,
} from '@grab-tools/lib/generated/proto';
import { Euler, MathUtils, Vector3 } from 'three';

type ColorData = [number, number, number, number];
type VectorData = [number, number, number];
type Vector2Data = [number, number];

/**
 * AmbienceSettings but:
 * replace all { key: value, ... } types with same size arrays
 * everything is required and cannot be undefined
 */
export type AmbienceSettingsData = {
	[K in keyof AmbienceSettings]-?: NonNullable<
		AmbienceSettings[K]
	> extends Color
		? ColorData
		: NonNullable<AmbienceSettings[K]> extends Vector
			? VectorData
			: NonNullable<AmbienceSettings[K]> extends Vector2
				? Vector2Data
				: AmbienceSettings[K];
};

export interface ComputedAmbienceData {
	fogDistanceX: number;
	cameraAmbientColor: number[];
}

/** clamp mimicking Raynes NaN haldling */
export function clamp(value: number, min: number, max: number) {
	const v = value <= max ? value : max;
	return v <= min ? min : v;
}

/** wrap an angle to be between 0-360 */
function normalise_angle(angle: number) {
	let normalised = angle % 360.0;
	if (normalised < 0.0) normalised += 360.0;
	return normalised;
}

/** 'key' in object but safe for protobufjs data */
function has<T extends object, K extends keyof T>(
	message: T | null,
	key: K,
): message is T & Record<K, NonNullable<T[K]>> {
	return (
		message != null &&
		Object.prototype.hasOwnProperty.call(message, key) &&
		message[key] != null
	);
}

/** Color -> ColorData */
function color(col: Color | undefined, alpha?: number): ColorData {
	if (!col) return [0, 0, 0, 0];
	return [col.r ?? 0, col.g ?? 0, col.b ?? 0, alpha ?? col.a ?? 0];
}

function vec3(vec: Vector | undefined): VectorData {
	if (!vec) return [0, 0, 0];
	return [vec.x ?? 0, vec.y ?? 0, vec.z ?? 0];
}

/**
 * compute sun color from horizon color and sun altitude
 * when not using advanced settings
 */
export function simple_sun_color(
	horizon: ColorData,
	sun_altitude: number,
): ColorData {
	let color_factor = 1.0 - sun_altitude / 90.0;
	color_factor = (1.0 - color_factor * color_factor) * 0.8 + 0.2;
	const inv = 1.0 - color_factor;
	return [
		horizon[0] * inv + color_factor,
		horizon[1] * inv + color_factor,
		horizon[2] * inv + color_factor,
		horizon[3] * inv + color_factor,
	];
}

/**
 * compute sun brightness from sun size
 * when not using advanced settings
 */
export function simple_sun_brightness(sun_size: number) {
	const brightness = sun_size * 0.7 + 0.3;
	return brightness < 0.0 ? 0.0 : brightness > 1.0 ? 1.0 : brightness;
}

const defaults: AmbienceSettingsData = {
	skyHorizonColor: [0.916, 0.9574, 0.9574, 1.0],
	skyZenithColor: [0.28, 0.476, 0.73, 1.0],
	fogDensity: 0.0,
	sunAltitude: 45.0,
	sunAzimuth: 315.0,
	sunSize: 1.0,
	sunColor: [1.0, 1.0, 1.0, 1.0],
	sunBrightness: 1.0,
	useAdvancedSunSettings: false,
	ambientColor: [1.0, 1.0, 1.0, 1.0],
	ambientBrightness: 1.0,
	starDensity: 1.0,
	starClustering: 0.5,
	starRotationEuler: [0.0, 0.0, 0.0],
	starSize: 1.0,
	starVisibility: 0.0,
	cloudDensity: 0.0,
	cloudHeight: 300.0,
	cloudSpeedX: 5.0,
	cloudSpeedZ: 0.0,
	cloudColor: [1.0, 1.0, 1.0, 1.0],
	cloudShading: 1.0,
};

/** default ambience settings */
export function defaultAmbience() {
	return precomputeValues(sanitizeAmbience({ ...defaults }));
}

export function ambienceFromProto(settings: AmbienceSettings | undefined) {
	const amb = { ...defaults };
	if (!settings) return precomputeValues(sanitizeAmbience(amb));

	amb.skyHorizonColor = color(settings.skyHorizonColor);
	amb.skyZenithColor = color(settings.skyZenithColor);
	amb.fogDensity = settings.fogDensity ?? 0;
	amb.sunAltitude = settings.sunAltitude ?? 0;
	amb.sunAzimuth = settings.sunAzimuth ?? 0;
	amb.sunSize = settings.sunSize ?? 0;

	if (has(settings, 'useAdvancedSunSettings'))
		amb.useAdvancedSunSettings = !!settings.useAdvancedSunSettings;

	amb.sunColor = settings.sunColor
		? color(settings.sunColor)
		: simple_sun_color(amb.skyHorizonColor, amb.sunAltitude);
	amb.sunBrightness = has(settings, 'sunBrightness')
		? settings.sunBrightness
		: simple_sun_brightness(amb.sunSize);

	if (settings.ambientColor) amb.ambientColor = color(settings.ambientColor);
	if (has(settings, 'ambientBrightness'))
		amb.ambientBrightness = settings.ambientBrightness;

	if (has(settings, 'starDensity')) amb.starDensity = settings.starDensity;
	if (has(settings, 'starClustering'))
		amb.starClustering = settings.starClustering;
	if (settings.starRotationEuler)
		amb.starRotationEuler = vec3(settings.starRotationEuler);

	if (has(settings, 'starSize')) amb.starSize = settings.starSize;
	if (has(settings, 'starVisibility'))
		amb.starVisibility = settings.starVisibility;

	if (has(settings, 'cloudDensity')) amb.cloudDensity = settings.cloudDensity;
	if (has(settings, 'cloudHeight')) amb.cloudHeight = settings.cloudHeight;
	if (has(settings, 'cloudSpeedX')) amb.cloudSpeedX = settings.cloudSpeedX;
	if (has(settings, 'cloudSpeedZ')) amb.cloudSpeedZ = settings.cloudSpeedZ;
	if (settings.cloudColor) amb.cloudColor = color(settings.cloudColor, 1.0);

	if (has(settings, 'cloudShading')) amb.cloudShading = settings.cloudShading;

	return precomputeValues(sanitizeAmbience(amb));
}

/** inject additional computed values for fog and camera ambience */
function precomputeValues(
	amb: AmbienceSettingsData,
): AmbienceSettingsData & ComputedAmbienceData {
	const d4 =
		amb.fogDensity * amb.fogDensity * amb.fogDensity * amb.fogDensity;
	const fogDistanceX = (1.0 - d4) * 1e-6 + d4 * 0.5;

	const cameraAmbientColor = [
		amb.ambientColor[0] * amb.ambientBrightness * 0.3,
		amb.ambientColor[1] * amb.ambientBrightness * 0.3,
		amb.ambientColor[2] * amb.ambientBrightness * 0.3,
	];

	return Object.assign(amb, { fogDistanceX, cameraAmbientColor });
}

export function sanitizeAmbience(amb: AmbienceSettingsData) {
	amb.sunAzimuth = normalise_angle(amb.sunAzimuth);

	amb.starDensity = clamp(amb.starDensity, 0.0, 1.0);
	amb.starClustering = clamp(amb.starClustering, 0.0, 1.0);
	amb.starRotationEuler = amb.starRotationEuler.map(
		normalise_angle,
	) as VectorData;
	amb.starSize = clamp(amb.starSize, 0.0, 2.0);
	amb.starVisibility = clamp(amb.starVisibility, 0.0, 1.0);

	Object.assign(amb, sanitizeClouds(amb));

	if (!amb.useAdvancedSunSettings) {
		amb.sunColor = simple_sun_color(amb.skyHorizonColor, amb.sunAltitude);
		amb.sunBrightness = simple_sun_brightness(amb.sunSize);
	}

	return amb;
}

/** clamp and replace non finite values with the defaults */
export function sanitizeClouds(c: AmbienceSettingsData) {
	// heheh nanor 🍌
	const nanOr = (val: number, fallback: number, min: number, max: number) =>
		!Number.isFinite(val) ? fallback : clamp(val, min, max);

	return {
		cloudDensity: nanOr(c.cloudDensity, defaults.cloudDensity, 0, 1),
		cloudHeight: nanOr(c.cloudHeight, defaults.cloudHeight, -1000, 1000),
		cloudSpeedX: nanOr(c.cloudSpeedX, defaults.cloudSpeedX, -50, 50),
		cloudSpeedZ: nanOr(c.cloudSpeedZ, defaults.cloudSpeedZ, -50, 50),
		cloudColor: [c.cloudColor[0], c.cloudColor[1], c.cloudColor[2], 1],
		cloudShading: nanOr(c.cloudShading, defaults.cloudShading, 0, 2),
	};
}

export function sunDirectionThree(amb: AmbienceSettingsData) {
	const euler = new Euler(
		-amb.sunAltitude * MathUtils.DEG2RAD,
		amb.sunAzimuth * MathUtils.DEG2RAD,
		0,
		'XYZ',
	);

	return new Vector3(0, 0, -1).applyEuler(euler).toArray();
}
