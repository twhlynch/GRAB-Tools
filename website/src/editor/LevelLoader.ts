import * as SHADERS from '@/assets/shaders/shaders';
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import modelConeURL from '@/assets/models/cone.gltf';
import modelCubeURL from '@/assets/models/cube.gltf';
import modelCylinderURL from '@/assets/models/cylinder.gltf';
import modelPrismURL from '@/assets/models/prism.gltf';
import modelPyramidURL from '@/assets/models/pyramid.gltf';
import modelPyramid4URL from '@/assets/models/pyramid4.gltf';
import modelSignURL from '@/assets/models/sign.gltf';
import modelSphereURL from '@/assets/models/sphere.gltf';
import modelStartDirectionURL from '@/assets/models/start_direction.glb';
import modelStartEndURL from '@/assets/models/start_end.gltf';

import textureBouncingURL from '@/assets/textures/bouncing.png';
import textureCodeURL from '@/assets/textures/code.png';
import textureDefaultURL from '@/assets/textures/default.png';
import textureDefaultColoredURL from '@/assets/textures/default_colored.png';
import textureGrabbableURL from '@/assets/textures/grabbable.png';
import textureGrabbableCrumblingURL from '@/assets/textures/grabbable_crumbling.png';
import textureGrapplableURL from '@/assets/textures/grapplable.png';
import textureGrapplableLavaURL from '@/assets/textures/grapplable_lava.png';
import textureIceURL from '@/assets/textures/ice.png';
import textureLavaURL from '@/assets/textures/lava.png';
import textureLightURL from '@/assets/textures/light.png';
import textureSnowURL from '@/assets/textures/snow.png';
import textureSoundURL from '@/assets/textures/sound.png';
import textureSublevelTriggerURL from '@/assets/textures/sublevel_trigger.png';
import textureTriggerURL from '@/assets/textures/trigger.png';
import textureWoodURL from '@/assets/textures/wood.png';
import { LevelNodeObject, Root } from '@/common/levelNodes';
import { load } from '@/common/root';
import {
	materials as material_types,
	shapes as shape_types,
} from '@/common/utils';
import {
	isLevelNode,
	LevelNodeKey,
	LevelNodeTypeFor,
} from '@grab-tools/lib/generated/nodes';
import {
	Level,
	LevelNode,
	LevelNodeCrumbling,
	LevelNodeFinish,
	LevelNodeGASM,
	LevelNodeGravity,
	LevelNodeGravityMode,
	LevelNodeGroup,
	LevelNodeLight,
	LevelNodeMaterial,
	LevelNodeParticleEmitter,
	LevelNodeShape,
	LevelNodeSign,
	LevelNodeSound,
	LevelNodeStart,
	LevelNodeStatic,
	LevelNodeTrigger,
} from '@grab-tools/lib/generated/proto';

let textureLoader: THREE.TextureLoader;
let gltfLoader: GLTFLoader;
let fontLoader: FontLoader;

export interface LevelData {
	level: Level;
	root: Root;
	nodes: {
		all: LevelNodeObject[];
		animated: LevelNodeObject[];
		material: Partial<Record<LevelNodeMaterial, LevelNodeObject[]>>;
		shape: Partial<Record<LevelNodeShape, LevelNodeObject[]>>;
		defaultSpawn: LevelNodeObject<LevelNodeStart> | undefined;
		namedSpawns: Record<string, LevelNodeObject>;
	} & {
		[K in LevelNodeKey]: LevelNodeObject<LevelNodeTypeFor<K>>[];
	};
	sun: THREE.DirectionalLight | undefined;
	complexity: number;
	scene: THREE.Scene;
	update: (delta: number) => void;
	meta: {
		time: number;
	};
}

interface LevelLoaderOptions {
	sky: boolean;
	lights: boolean;
	text: boolean;
	triggers: boolean;
	sound: boolean;
	light: boolean;
	sublevels: boolean;
	static: boolean;
	fog: boolean;
	GASM: boolean;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type LevelNodeUniforms = {
	colorTexture: THREE.IUniform<THREE.Texture>;
	tileFactor: THREE.IUniform<number>;
	diffuseColor: THREE.IUniform<[number, number, number]>;
	worldNormalMatrix: THREE.IUniform<THREE.Matrix3>;
	frozenNormalMatrix: THREE.IUniform<THREE.Matrix3>;
	worldMatrix: THREE.IUniform<THREE.Matrix4>;
	neonEnabled: THREE.IUniform<number>;
	transparentEnabled: THREE.IUniform<number>;
	fogEnabled: THREE.IUniform<number>;
	isSelected: THREE.IUniform<boolean>;
	specularColor: THREE.IUniform<[number, number, number, number]>;
	isLava: THREE.IUniform<number>;
	isColoredLava: THREE.IUniform<number>;
	isGradient: THREE.IUniform<number>;
	isAdditive: THREE.IUniform<number>;
	diffuseColor2: THREE.IUniform<[number, number, number]>;
	gradientDirection: THREE.IUniform<[number, number, number]>;
};

type LevelNodeShaderMaterial = THREE.ShaderMaterial & {
	uniforms: LevelNodeUniforms;
};

export function levelData(): LevelData {
	const root = load();

	const level: LevelData = {
		level: {},
		root: root,
		nodes: {
			all: [],
			animated: [],
			material: Object.fromEntries(
				Object.values(material_types()).map((value) => [value, []]),
			),
			shape: Object.fromEntries(
				Object.values(shape_types()).map((value) => [value, []]),
			),
			defaultSpawn: undefined,
			namedSpawns: {},
			...(Object.fromEntries(
				root.COD.Level.LevelNode.oneofs.content.fieldsArray.map(
					(field) => [field.name, [] as LevelNodeObject[]],
				),
			) as {
				[K in LevelNodeKey]: LevelNodeObject<LevelNodeTypeFor<K>>[];
			}),
		},
		sun: undefined,
		complexity: 0,
		scene: new THREE.Scene(),
		update: () => {
			// noop
		},
		meta: {
			time: 0.0,
		},
	};

	level.update = (delta: number) => {
		level.meta.time += delta;
	};

	return level;
}

class LevelLoader {
	root: Root;
	font: Font | undefined;
	options: LevelLoaderOptions = {
		sky: true,
		lights: true,
		text: false,
		triggers: false,
		sound: false,
		light: false,
		sublevels: false,
		static: false,
		fog: true,
		GASM: false,
	};
	shapes: THREE.BufferGeometry[] = [];
	objects: THREE.BufferGeometry[] = [];
	shapePromise: Promise<void>;
	objectPromise: Promise<void>;
	fontPromise: Promise<void>;
	materials: [
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
		LevelNodeShaderMaterial,
	];
	objectMaterials: [
		THREE.ShaderMaterial, // start
		THREE.ShaderMaterial, // finish
		LevelNodeShaderMaterial, // sign
		LevelNodeShaderMaterial, // neon
		LevelNodeShaderMaterial, // trigger
		LevelNodeShaderMaterial, // sublevel trigger
		THREE.ShaderMaterial, // alt start
		THREE.ShaderMaterial, // particle
		LevelNodeShaderMaterial, // sound
		LevelNodeShaderMaterial, // code
		THREE.ShaderMaterial, // start direction
		THREE.ShaderMaterial, // alt start
		LevelNodeShaderMaterial, // light
	];
	skyMaterial: THREE.ShaderMaterial;

	constructor(options: Partial<LevelLoaderOptions> = {}) {
		this.config(options);

		textureLoader = new THREE.TextureLoader();
		gltfLoader = new GLTFLoader();
		fontLoader = new FontLoader();

		const shapePromises = [
			getGeometryForModel(modelCubeURL),
			getGeometryForModel(modelSphereURL),
			getGeometryForModel(modelCylinderURL),
			getGeometryForModel(modelPyramidURL),
			getGeometryForModel(modelPrismURL),
			getGeometryForModel(modelConeURL),
			getGeometryForModel(modelPyramid4URL),
		];

		this.shapePromise = Promise.all(shapePromises).then((result) => {
			for (const shape of result) {
				this.shapes.push(shape);
				shape.rotateY(Math.PI);
			}
		});

		const objectPromises = [
			getGeometryForModel(modelStartEndURL),
			getGeometryForModel(modelSignURL),
			getGeometryForModel(modelStartDirectionURL),
		];

		this.objectPromise = Promise.all(objectPromises).then((result) => {
			for (const object of result) {
				this.objects.push(object);
				object.rotateY(Math.PI);
			}
			this.objects[2]!.rotateX(Math.PI / 2); // start arrow
		});

		this.materials = [
			getMaterialForTexture(
				textureDefaultURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureGrabbableURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.2, 0.2, 0.2, 16.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureIceURL,
				0.1,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.6, 0.6, 0.6, 64.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureLavaURL,
				0.1,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.0, 0.0, 0.0, 1.0],
				0.0,
				1.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureWoodURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.2, 0.2, 0.2, 32.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureGrapplableURL,
				0.1,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.3, 0.3, 0.3, 32.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureGrapplableLavaURL,
				0.1,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.0, 0.0, 0.0, 1.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureGrabbableCrumblingURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.2, 0.2, 0.2, 16.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureDefaultColoredURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.15, 0.15, 0.15, 10.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureBouncingURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.8, 0.8, 0.8, 64.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureSnowURL,
				0.1,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.6, 0.6, 0.6, 64.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
		];

		const startMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.startFinishVS,
			fragmentShader: SHADERS.startFinishFS,
			transparent: true,
			depthWrite: false,
			uniforms: {
				diffuseColor: { value: [0.0, 1.0, 0.0, 1.0] },
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		const finishMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.startFinishVS,
			fragmentShader: SHADERS.startFinishFS,
			transparent: true,
			depthWrite: false,
			uniforms: {
				diffuseColor: { value: [1.0, 0.0, 0.0, 1.0] },
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		const altStartMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.startFinishVS,
			fragmentShader: SHADERS.startFinishFS,
			transparent: true,
			depthWrite: false,
			uniforms: {
				diffuseColor: { value: [1.0, 1.0, 0.0, 1.0] },
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		const particleMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.particleVS,
			fragmentShader: SHADERS.particleFS,
			uniforms: {
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		const startDirectionMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.startFinishVS,
			fragmentShader: SHADERS.startDirectionFS,
			transparent: true,
			depthWrite: false,
			uniforms: {
				diffuseColor: { value: [0.0, 1.0, 0.0, 1.0] },
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		const altStartDirectionMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.startFinishVS,
			fragmentShader: SHADERS.startDirectionFS,
			transparent: true,
			depthWrite: false,
			uniforms: {
				diffuseColor: { value: [1.0, 1.0, 0.0, 1.0] },
				fogEnabled: { value: this.options.fog ? 1.0 : 0.0 },
				isSelected: { value: false },
			},
		});

		this.objectMaterials = [
			startMaterial,
			finishMaterial,
			getMaterialForTexture(
				textureWoodURL,
				1.0,
				SHADERS.signVS,
				SHADERS.signFS,
				[0.3, 0.3, 0.3, 16.0],
				0.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureDefaultColoredURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureTriggerURL,
				3.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureSublevelTriggerURL,
				3.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			altStartMaterial,
			particleMaterial,
			getMaterialForTexture(
				textureSoundURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			getMaterialForTexture(
				textureCodeURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
			startDirectionMaterial,
			altStartDirectionMaterial,
			getMaterialForTexture(
				textureLightURL,
				1.0,
				SHADERS.levelVS,
				SHADERS.levelFS,
				[0.4, 0.4, 0.4, 64.0],
				1.0,
				0.0,
				this.options.fog ? 1.0 : 0.0,
			),
		];

		this.skyMaterial = new THREE.ShaderMaterial({
			vertexShader: SHADERS.skyVS,
			fragmentShader: SHADERS.skyFS,
			depthWrite: false,
			side: THREE.BackSide,
		});

		this.root = load();

		this.fontPromise = new Promise<Font>((resolve, reject) => {
			fontLoader.load(
				'/fonts/Roboto_Regular.json',
				resolve,
				undefined,
				reject,
			);
		}).then((font) => {
			this.font = font;
		});
	}

	config(options: Partial<LevelLoaderOptions> = {}) {
		Object.assign(this.options, options);
	}

	async load(data: Uint8Array | Level): Promise<LevelData> {
		const { root, shapes, objects, materials, objectMaterials } = this;

		const level = levelData();

		if (this.options.lights) {
			const ambientLight = new THREE.AmbientLight(0x404040);
			level.scene.add(ambientLight);

			const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
			level.sun = sunLight;
			level.scene.add(sunLight);
		}

		level.update = (delta: number) => {
			level.meta.time += delta;
			for (const object of level.nodes.animated) {
				updateObjectAnimation(object, level.meta.time);
			}
			for (const object of level.nodes.levelNodeGravity) {
				updateObjectParticles(object, delta);
			}
			for (const object of level.nodes.levelNodeParticleEmitter) {
				updateObjectParticles(object, delta);
			}
		};

		const LevelMessage = root.lookupType('COD.Level.Level');

		if (data instanceof Uint8Array) {
			const formattedBuffer = data;
			level.level = LevelMessage.decode(formattedBuffer) as Level;
		} else {
			level.level = data;
		}
		const decoded = level.level;

		await this.shapePromise;
		await this.objectPromise;
		await this.fontPromise;

		const scene = level.scene;
		level.nodes.namedSpawns = {};

		let sunAngle = new THREE.Euler(
			THREE.MathUtils.degToRad(45),
			THREE.MathUtils.degToRad(315),
			0.0,
		);
		let sunAltitude = 45.0;
		let horizonColor: [number, number, number] = [0.916, 0.9574, 0.9574];
		if (decoded.ambienceSettings) {
			sunAngle = new THREE.Euler(
				THREE.MathUtils.degToRad(
					decoded.ambienceSettings.sunAltitude ?? 0,
				),
				THREE.MathUtils.degToRad(
					decoded.ambienceSettings.sunAzimuth ?? 0,
				),
				0.0,
			);
			sunAltitude = decoded.ambienceSettings.sunAltitude ?? 0;
			horizonColor = [
				decoded.ambienceSettings.skyHorizonColor?.r ?? 0,
				decoded.ambienceSettings.skyHorizonColor?.g ?? 0,
				decoded.ambienceSettings.skyHorizonColor?.b ?? 0,
			];

			this.skyMaterial.uniforms.cameraFogColor0 = {
				value: [
					decoded.ambienceSettings.skyHorizonColor?.r ?? 0,
					decoded.ambienceSettings.skyHorizonColor?.g ?? 0,
					decoded.ambienceSettings.skyHorizonColor?.b ?? 0,
				],
			};
			this.skyMaterial.uniforms.cameraFogColor1 = {
				value: [
					decoded.ambienceSettings.skyZenithColor?.r ?? 0,
					decoded.ambienceSettings.skyZenithColor?.g ?? 0,
					decoded.ambienceSettings.skyZenithColor?.b ?? 0,
				],
			};
			this.skyMaterial.uniforms.sunSize = {
				value: decoded.ambienceSettings.sunSize ?? 0,
			};
		} else {
			this.skyMaterial.uniforms.cameraFogColor0 = {
				value: [0.916, 0.9574, 0.9574],
			};
			this.skyMaterial.uniforms.cameraFogColor1 = {
				value: [0.28, 0.476, 0.73],
			};
			this.skyMaterial.uniforms.sunSize = { value: 1.0 };
		}

		const sunDirection = new THREE.Vector3(0, 0, 1);
		sunDirection.applyEuler(sunAngle);
		sunDirection.normalize();

		if (level.sun) {
			const distance = 1000;
			level.sun.position.copy(
				sunDirection.clone().multiplyScalar(-distance),
			);
			level.sun.target.position.set(0, 0, 0);
			level.sun.userData.direction = sunDirection.clone();
		}

		const skySunDirection = sunDirection.clone();

		let sunColorFactor = 1.0 - sunAltitude / 90.0;
		sunColorFactor *= sunColorFactor;
		sunColorFactor = 1.0 - sunColorFactor;
		sunColorFactor *= 0.8;
		sunColorFactor += 0.2;
		const sunColor = [
			horizonColor[0] * (1.0 - sunColorFactor) + sunColorFactor,
			horizonColor[1] * (1.0 - sunColorFactor) + sunColorFactor,
			horizonColor[2] * (1.0 - sunColorFactor) + sunColorFactor,
		];

		this.skyMaterial.uniforms.sunDirection = { value: skySunDirection };
		this.skyMaterial.uniforms.sunColor = { value: sunColor };

		const sky = new THREE.Mesh(this.shapes[1], this.skyMaterial);
		sky.frustumCulled = false;
		sky.renderOrder = 1000; // sky should be rendered after opaque, before transparent
		sky.userData.isSky = true;
		scene.add(sky);
		sky.visible = this.options.sky;

		const allMaterials = [...materials, ...objectMaterials];

		for (const material of allMaterials) {
			let density = 0.0;
			if (decoded.ambienceSettings) {
				material.uniforms.cameraFogColor0 = {
					value: [
						decoded.ambienceSettings.skyHorizonColor?.r ?? 0,
						decoded.ambienceSettings.skyHorizonColor?.g ?? 0,
						decoded.ambienceSettings.skyHorizonColor?.b ?? 0,
					],
				};
				material.uniforms.cameraFogColor1 = {
					value: [
						decoded.ambienceSettings.skyZenithColor?.r ?? 0,
						decoded.ambienceSettings.skyZenithColor?.g ?? 0,
						decoded.ambienceSettings.skyZenithColor?.b ?? 0,
					],
				};
				material.uniforms.sunSize = {
					value: decoded.ambienceSettings.sunSize ?? 0,
				};
				density = decoded.ambienceSettings.fogDensity ?? 0;
			} else {
				material.uniforms.cameraFogColor0 = {
					value: [0.916, 0.9574, 0.9574],
				};
				material.uniforms.cameraFogColor1 = {
					value: [0.28, 0.476, 0.73],
				};
				material.uniforms.sunSize = { value: 1.0 };
			}

			material.uniforms.sunDirection = { value: skySunDirection };
			material.uniforms.sunColor = { value: sunColor };

			const densityFactor = density * density * density * density;
			const fogDensityX =
				0.5 * densityFactor + 0.000001 * (1.0 - densityFactor);
			const fogDensityY = 1.0 / (1.0 - Math.exp(-1500.0 * fogDensityX));

			material.uniforms.cameraFogDistance = {
				value: [fogDensityX, fogDensityY],
			};
		}

		level.complexity = 0;

		const loadLevelNodes = (
			nodes: (LevelNode | undefined)[],
			parentNode: LevelNodeObject | THREE.Scene,
		) => {
			for (const node of nodes) {
				if (!node || !isLevelNode(node)) continue;
				let obj: LevelNodeObject | undefined = undefined;
				if (node.levelNodeGroup) {
					const object =
						new THREE.Object3D() as LevelNodeObject<LevelNodeGroup>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeGroup.position?.x ?? 0;
					object.position.y = node.levelNodeGroup.position?.y ?? 0;
					object.position.z = node.levelNodeGroup.position?.z ?? 0;

					object.scale.x = node.levelNodeGroup.scale?.x ?? 0;
					object.scale.y = node.levelNodeGroup.scale?.y ?? 0;
					object.scale.z = node.levelNodeGroup.scale?.z ?? 0;

					object.quaternion.x = node.levelNodeGroup.rotation?.x ?? 0;
					object.quaternion.y = node.levelNodeGroup.rotation?.y ?? 0;
					object.quaternion.z = node.levelNodeGroup.rotation?.z ?? 0;
					object.quaternion.w = node.levelNodeGroup.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					level.nodes.all.push(object); // before children
					object.userData.id = level.nodes.all.length;
					loadLevelNodes(
						node.levelNodeGroup.childNodes ?? [],
						object,
					);

					level.nodes.levelNodeGroup.push(object);
				} else if (node.levelNodeGravity) {
					const object =
						new THREE.Object3D() as LevelNodeObject<LevelNodeGravity>;
					obj = object;

					object.position.x = node.levelNodeGravity.position?.x ?? 0;
					object.position.y = node.levelNodeGravity.position?.y ?? 0;
					object.position.z = node.levelNodeGravity.position?.z ?? 0;

					object.scale.x = node.levelNodeGravity.scale?.x ?? 0;
					object.scale.y = node.levelNodeGravity.scale?.y ?? 0;
					object.scale.z = node.levelNodeGravity.scale?.z ?? 0;

					object.quaternion.x =
						node.levelNodeGravity.rotation?.x ?? 0;
					object.quaternion.y =
						node.levelNodeGravity.rotation?.y ?? 0;
					object.quaternion.z =
						node.levelNodeGravity.rotation?.z ?? 0;
					object.quaternion.w =
						node.levelNodeGravity.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					if (!node.levelNodeGravity.hideParticles) {
						const particleGeometry = new THREE.BufferGeometry();

						let particleColor = new THREE.Color(1.0, 1.0, 1.0);
						if (
							node.levelNodeGravity.mode !=
							LevelNodeGravityMode.DEFAULT
						) {
							particleColor = new THREE.Color(1.0, 0.6, 0.6);
						}

						const lifeSpan = 1;
						const particleCount = Math.min(
							Math.floor(
								object.scale.x *
									object.scale.y *
									object.scale.z *
									10,
							),
							2000,
						);

						const size = 0.1;

						const initialPositions = new Float32Array(
							particleCount * 3,
						);
						const colors = new Float32Array(particleCount * 3);
						const scales = new Float32Array(particleCount);
						const lifeSpans = new Float32Array(particleCount);

						const worldPosition = new THREE.Vector3();
						const worldScale = new THREE.Vector3();
						const worldQuaternion = new THREE.Quaternion();
						object.getWorldPosition(worldPosition);
						object.getWorldScale(worldScale);
						object.getWorldQuaternion(worldQuaternion);

						for (let i = 0; i < particleCount; i++) {
							lifeSpans[i] = Math.random() * lifeSpan;

							scales[i] = size;

							const particlePosition = new THREE.Vector3(
								(Math.random() - 0.5) * worldScale.x,
								(Math.random() - 0.5) * worldScale.y,
								(Math.random() - 0.5) * worldScale.z,
							);
							particlePosition.applyQuaternion(worldQuaternion);

							initialPositions[i * 3] =
								worldPosition.x + particlePosition.x;
							initialPositions[i * 3 + 1] =
								worldPosition.y + particlePosition.y;
							initialPositions[i * 3 + 2] =
								worldPosition.z + particlePosition.z;

							colors[i * 3] = particleColor.r;
							colors[i * 3 + 1] = particleColor.g;
							colors[i * 3 + 2] = particleColor.b;
						}

						particleGeometry.setAttribute(
							'position',
							new THREE.Float32BufferAttribute(
								initialPositions,
								3,
							),
						);
						particleGeometry.setAttribute(
							'color',
							new THREE.Float32BufferAttribute(colors, 3),
						);
						particleGeometry.setAttribute(
							'scale',
							new THREE.Float32BufferAttribute(scales, 1),
						);

						const particleMaterial = objectMaterials[7].clone();

						const particlePoints = new THREE.Points(
							particleGeometry,
							particleMaterial,
						);

						scene.add(particlePoints);

						object.userData.update = (delta: number) => {
							if (!node.levelNodeGravity) return;

							const positions =
								particleGeometry.attributes.position?.array ??
								[];

							const newWorldPosition = new THREE.Vector3();
							const newWorldScale = new THREE.Vector3();
							const newWorldQuaternion = new THREE.Quaternion();
							object.getWorldPosition(newWorldPosition);
							object.getWorldScale(newWorldScale);
							object.getWorldQuaternion(newWorldQuaternion);

							const velocity = new THREE.Vector3(
								node.levelNodeGravity.direction?.x ?? 0,
								node.levelNodeGravity.direction?.y ?? 0,
								node.levelNodeGravity.direction?.z ?? 0,
							);
							velocity.applyQuaternion(newWorldQuaternion);

							for (let i = 0; i < particleCount; i++) {
								lifeSpans[i]! -= delta;
								if (lifeSpans[i]! <= 0) {
									lifeSpans[i] = lifeSpan;

									const particlePosition = new THREE.Vector3(
										(Math.random() - 0.5) * newWorldScale.x,
										(Math.random() - 0.5) * newWorldScale.y,
										(Math.random() - 0.5) * newWorldScale.z,
									);
									particlePosition.applyQuaternion(
										newWorldQuaternion,
									);

									positions[i * 3] =
										newWorldPosition.x + particlePosition.x;
									positions[i * 3 + 1] =
										newWorldPosition.y + particlePosition.y;
									positions[i * 3 + 2] =
										newWorldPosition.z + particlePosition.z;
								}
								positions[i * 3]! += velocity.x * delta;
								positions[i * 3 + 1]! += velocity.y * delta;
								positions[i * 3 + 2]! += velocity.z * delta;
							}

							particleGeometry.getAttribute(
								'position',
							).needsUpdate = true;
						};
					}

					parentNode.add(object);

					level.nodes.levelNodeGravity.push(object);
					level.complexity += 10;
				} else if (node.levelNodeParticleEmitter) {
					const object =
						new THREE.Object3D() as LevelNodeObject<LevelNodeParticleEmitter>;
					obj = object;

					object.position.x =
						node.levelNodeParticleEmitter.position?.x ?? 0;
					object.position.y =
						node.levelNodeParticleEmitter.position?.y ?? 0;
					object.position.z =
						node.levelNodeParticleEmitter.position?.z ?? 0;

					object.scale.x =
						node.levelNodeParticleEmitter.scale?.x ?? 0;
					object.scale.y =
						node.levelNodeParticleEmitter.scale?.y ?? 0;
					object.scale.z =
						node.levelNodeParticleEmitter.scale?.z ?? 0;

					object.quaternion.x =
						node.levelNodeParticleEmitter.rotation?.x ?? 0;
					object.quaternion.y =
						node.levelNodeParticleEmitter.rotation?.y ?? 0;
					object.quaternion.z =
						node.levelNodeParticleEmitter.rotation?.z ?? 0;
					object.quaternion.w =
						node.levelNodeParticleEmitter.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const particleGeometry = new THREE.BufferGeometry();

					const particlesPerSecond =
						node.levelNodeParticleEmitter.particlesPerSecond ?? 0;

					const lifeSpanMin =
						node.levelNodeParticleEmitter.lifeSpan?.x ?? 0;
					const lifeSpanMax =
						node.levelNodeParticleEmitter.lifeSpan?.y ?? 0;
					const particleCount = Math.min(
						Math.floor(particlesPerSecond * lifeSpanMax),
						1000,
					);

					const startSizeMin =
						(node.levelNodeParticleEmitter.startSize?.x ?? 0) * 2;
					const startSizeMax =
						(node.levelNodeParticleEmitter.startSize?.y ?? 0) * 2;
					const endSizeMin =
						(node.levelNodeParticleEmitter.endSize?.x ?? 0) * 2;
					const endSizeMax =
						(node.levelNodeParticleEmitter.endSize?.y ?? 0) * 2;

					const velocityMin = new THREE.Vector3(
						node.levelNodeParticleEmitter.velocityMin?.x ?? 0,
						node.levelNodeParticleEmitter.velocityMin?.y ?? 0,
						node.levelNodeParticleEmitter.velocityMin?.z ?? 0,
					);
					const velocityMax = new THREE.Vector3(
						node.levelNodeParticleEmitter.velocityMax?.x ?? 0,
						node.levelNodeParticleEmitter.velocityMax?.y ?? 0,
						node.levelNodeParticleEmitter.velocityMax?.z ?? 0,
					);

					const accelerationMin = new THREE.Vector3(
						node.levelNodeParticleEmitter.accelerationMin?.x ?? 0,
						node.levelNodeParticleEmitter.accelerationMin?.y ?? 0,
						node.levelNodeParticleEmitter.accelerationMin?.z ?? 0,
					);
					const accelerationMax = new THREE.Vector3(
						node.levelNodeParticleEmitter.accelerationMax?.x ?? 0,
						node.levelNodeParticleEmitter.accelerationMax?.y ?? 0,
						node.levelNodeParticleEmitter.accelerationMax?.z ?? 0,
					);

					const startColor: [number, number, number] = [
						node.levelNodeParticleEmitter.startColor?.r ?? 0,
						node.levelNodeParticleEmitter.startColor?.g ?? 0,
						node.levelNodeParticleEmitter.startColor?.b ?? 0,
					];
					const endColor: [number, number, number] = [
						node.levelNodeParticleEmitter.endColor?.r ?? 0,
						node.levelNodeParticleEmitter.endColor?.g ?? 0,
						node.levelNodeParticleEmitter.endColor?.b ?? 0,
					];

					// all default to 0, mimics slowly spawning in at the start
					const initialPositions = new Float32Array(
						particleCount * 3,
					);
					const initialColors = new Float32Array(particleCount * 3);
					const initialScales = new Float32Array(particleCount);
					const lifeSpans = new Float32Array(particleCount);
					const totalLifeSpans = new Float32Array(particleCount);
					const startSizes = new Float32Array(particleCount);
					const endSizes = new Float32Array(particleCount);
					const velocities = new Float32Array(particleCount * 3);
					const accelerations = new Float32Array(particleCount * 3);

					const randRange = (min: number, max: number) => {
						return Math.random() * (max - min) + min;
					};

					for (let i = 0; i < particleCount; i++) {
						totalLifeSpans[i] = randRange(lifeSpanMin, lifeSpanMax);
						lifeSpans[i] = Math.random() * totalLifeSpans[i]!;
					}

					particleGeometry.setAttribute(
						'position',
						new THREE.Float32BufferAttribute(initialPositions, 3),
					);
					particleGeometry.setAttribute(
						'color',
						new THREE.Float32BufferAttribute(initialColors, 3),
					);
					particleGeometry.setAttribute(
						'scale',
						new THREE.Float32BufferAttribute(initialScales, 1),
					);

					const particleMaterial = objectMaterials[7].clone();

					const particlePoints = new THREE.Points(
						particleGeometry,
						particleMaterial,
					);

					particlePoints.frustumCulled = false;
					scene.add(particlePoints);
					parentNode.add(object);
					object.userData.update = (delta: number) => {
						const positions =
							particleGeometry.getAttribute('position').array;
						const colors =
							particleGeometry.getAttribute('color').array;
						const scales =
							particleGeometry.getAttribute('scale').array;

						const worldPosition = new THREE.Vector3();
						const worldScale = new THREE.Vector3();
						const worldQuaternion = new THREE.Quaternion();
						object.getWorldPosition(worldPosition);
						object.getWorldScale(worldScale);
						object.getWorldQuaternion(worldQuaternion);

						const velocityMaxRotated = new THREE.Vector3().copy(
							velocityMax,
						);
						const velocityMinRotated = new THREE.Vector3().copy(
							velocityMin,
						);
						const accelerationMinRotated = new THREE.Vector3().copy(
							accelerationMin,
						);
						const accelerationMaxRotated = new THREE.Vector3().copy(
							accelerationMax,
						);
						velocityMaxRotated.applyQuaternion(worldQuaternion);
						velocityMinRotated.applyQuaternion(worldQuaternion);
						accelerationMinRotated.applyQuaternion(worldQuaternion);
						accelerationMaxRotated.applyQuaternion(worldQuaternion);

						for (let i = 0; i < particleCount; i++) {
							lifeSpans[i]! -= delta;
							if (lifeSpans[i]! <= 0) {
								delta = -lifeSpans[i]!;
								totalLifeSpans[i] = randRange(
									lifeSpanMin,
									lifeSpanMax,
								);
								lifeSpans[i] = totalLifeSpans[i]!;

								startSizes[i] = randRange(
									startSizeMin,
									startSizeMax,
								);
								endSizes[i] = randRange(endSizeMin, endSizeMax);

								velocities[i * 3] = randRange(
									velocityMinRotated.x,
									velocityMaxRotated.x,
								);
								velocities[i * 3 + 1] = randRange(
									velocityMinRotated.y,
									velocityMaxRotated.y,
								);
								velocities[i * 3 + 2] = randRange(
									velocityMinRotated.z,
									velocityMaxRotated.z,
								);

								accelerations[i * 3] = randRange(
									accelerationMinRotated.x,
									accelerationMaxRotated.x,
								);
								accelerations[i * 3 + 1] = randRange(
									accelerationMinRotated.y,
									accelerationMaxRotated.y,
								);
								accelerations[i * 3 + 2] = randRange(
									accelerationMinRotated.z,
									accelerationMaxRotated.z,
								);

								const particlePosition = new THREE.Vector3(
									(Math.random() - 0.5) * worldScale.x,
									(Math.random() - 0.5) * worldScale.y,
									(Math.random() - 0.5) * worldScale.z,
								);
								particlePosition.applyQuaternion(
									worldQuaternion,
								);

								positions[i * 3] =
									worldPosition.x + particlePosition.x;
								positions[i * 3 + 1] =
									worldPosition.y + particlePosition.y;
								positions[i * 3 + 2] =
									worldPosition.z + particlePosition.z;
							}
							const lifeFactor =
								1 - lifeSpans[i]! / totalLifeSpans[i]!;
							scales[i] = THREE.MathUtils.lerp(
								startSizes[i]!,
								endSizes[i]!,
								lifeFactor,
							);

							colors[i * 3] = THREE.MathUtils.lerp(
								startColor[0],
								endColor[0],
								lifeFactor,
							);
							colors[i * 3 + 1] = THREE.MathUtils.lerp(
								startColor[1],
								endColor[1],
								lifeFactor,
							);
							colors[i * 3 + 2] = THREE.MathUtils.lerp(
								startColor[2],
								endColor[2],
								lifeFactor,
							);

							positions[i * 3]! += velocities[i * 3]! * delta;
							positions[i * 3 + 1]! +=
								velocities[i * 3 + 1]! * delta;
							positions[i * 3 + 2]! +=
								velocities[i * 3 + 2]! * delta;

							velocities[i * 3]! += accelerations[i * 3]! * delta;
							velocities[i * 3 + 1]! +=
								accelerations[i * 3 + 1]! * delta;
							velocities[i * 3 + 2]! +=
								accelerations[i * 3 + 2]! * delta;
						}

						particleGeometry.getAttribute('position').needsUpdate =
							true;
						particleGeometry.getAttribute('color').needsUpdate =
							true;
						particleGeometry.getAttribute('scale').needsUpdate =
							true;
					};

					if (this.options.static) {
						for (let i = 0; i < 10; i++) {
							object.userData.update(lifeSpanMax / 10);
						}
					}

					level.nodes.levelNodeParticleEmitter.push(object);
					level.complexity += 8;
				} else if (node.levelNodeStatic) {
					let material =
						materials[
							Math.min(
								Math.max(node.levelNodeStatic.material ?? 0, 0),
								materials.length - 1,
							)
						]!;

					// Neon
					if (
						(node.levelNodeStatic.material ?? 0) ===
							root.COD.Level.LevelNodeMaterial.DEFAULT_COLORED &&
						node.levelNodeStatic.isNeon
					) {
						material = objectMaterials[3];
					}

					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					// Transparent
					if (
						((node.levelNodeStatic.material ?? 0) ==
							root.COD.Level.LevelNodeMaterial.DEFAULT_COLORED ||
							(node.levelNodeStatic.material ?? 0) ==
								root.COD.Level.LevelNodeMaterial.LAVA) &&
						node.levelNodeStatic.isTransparent
					) {
						newMaterial.transparent = true;
						newMaterial.uniforms.transparentEnabled.value = 1.0;
					}

					if (
						((node.levelNodeStatic.material ?? 0) ==
							root.COD.Level.LevelNodeMaterial.DEFAULT_COLORED ||
							(node.levelNodeStatic.material ?? 0) ===
								root.COD.Level.LevelNodeMaterial.LAVA) &&
						node.levelNodeStatic.color1
					) {
						newMaterial.uniforms.diffuseColor.value = [
							node.levelNodeStatic.color1.r ?? 0,
							node.levelNodeStatic.color1.g ?? 0,
							node.levelNodeStatic.color1.b ?? 0,
						];

						// gradient
						if (
							node.levelNodeStatic.isGradient &&
							node.levelNodeStatic.color2
						) {
							newMaterial.uniforms.isGradient.value = 1.0;
							newMaterial.uniforms.diffuseColor2.value = [
								node.levelNodeStatic.color2.r ?? 0,
								node.levelNodeStatic.color2.g ?? 0,
								node.levelNodeStatic.color2.b ?? 0,
							];
							if (node.levelNodeStatic.gradientDirection) {
								const x =
									node.levelNodeStatic.gradientDirection.x ??
									0;
								const y =
									node.levelNodeStatic.gradientDirection.y ??
									0;
								const z =
									node.levelNodeStatic.gradientDirection.z ??
									0;
								if (x != 0 || y != 0 || z != 0) {
									newMaterial.uniforms.gradientDirection.value =
										[x, y, z];
								}
							}
						}

						const specularFactor =
							Math.sqrt(
								(node.levelNodeStatic.color1.r ?? 0) *
									(node.levelNodeStatic.color1.r ?? 0) +
									(node.levelNodeStatic.color1.g ?? 0) *
										(node.levelNodeStatic.color1.g ?? 0) +
									(node.levelNodeStatic.color1.b ?? 0) *
										(node.levelNodeStatic.color1.b ?? 0),
							) * 0.15;
						let specularColor: [number, number, number, number] = [
							specularFactor,
							specularFactor,
							specularFactor,
							16.0,
						];
						if (
							node.levelNodeStatic.color2 &&
							!node.levelNodeStatic.isGradient
						) {
							specularColor = [
								node.levelNodeStatic.color2.r ?? 0,
								node.levelNodeStatic.color2.g ?? 0,
								node.levelNodeStatic.color2.b ?? 0,
								node.levelNodeStatic.color2.a ?? 0,
							];
							if (
								node.levelNodeStatic.material ===
								root.COD.Level.LevelNodeMaterial.LAVA
							) {
								newMaterial.uniforms.isColoredLava.value = 1.0;
							}
						}
						newMaterial.uniforms.specularColor.value =
							specularColor;
					}

					// additive
					if (node.levelNodeStatic.isAdditive) {
						newMaterial.transparent = true;
						newMaterial.blending = THREE.AdditiveBlending;
						newMaterial.depthWrite = false;
						newMaterial.uniforms.isAdditive.value = 1.0;
					}

					const object = new THREE.Mesh(
						shapes[
							Math.min(
								Math.max(
									(node.levelNodeStatic.shape ?? 1000) - 1000,
									0,
								),
								shapes.length - 1,
							)
						],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeStatic>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeStatic.position?.x ?? 0;
					object.position.y = node.levelNodeStatic.position?.y ?? 0;
					object.position.z = node.levelNodeStatic.position?.z ?? 0;

					object.scale.x = node.levelNodeStatic.scale?.x ?? 0;
					object.scale.y = node.levelNodeStatic.scale?.y ?? 0;
					object.scale.z = node.levelNodeStatic.scale?.z ?? 0;

					object.quaternion.x = node.levelNodeStatic.rotation?.x ?? 0;
					object.quaternion.y = node.levelNodeStatic.rotation?.y ?? 0;
					object.quaternion.z = node.levelNodeStatic.rotation?.z ?? 0;
					object.quaternion.w = node.levelNodeStatic.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					level.nodes.material[
						node.levelNodeStatic.material ?? 0
					]?.push(object);
					level.nodes.shape[node.levelNodeStatic.shape ?? 1000]?.push(
						object,
					);
					level.nodes.levelNodeStatic.push(object);
					level.complexity += 2;
				} else if (node.levelNodeCrumbling) {
					const material = materials[7];
					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					const object = new THREE.Mesh(
						shapes[
							Math.min(
								Math.max(
									(node.levelNodeCrumbling.shape ?? 1000) -
										1000,
									0,
								),
								shapes.length - 1,
							)
						],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeCrumbling>;
					obj = object;

					parentNode.add(object);
					object.position.x =
						node.levelNodeCrumbling.position?.x ?? 0;
					object.position.y =
						node.levelNodeCrumbling.position?.y ?? 0;
					object.position.z =
						node.levelNodeCrumbling.position?.z ?? 0;

					object.scale.x = node.levelNodeCrumbling.scale?.x ?? 0;
					object.scale.y = node.levelNodeCrumbling.scale?.y ?? 0;
					object.scale.z = node.levelNodeCrumbling.scale?.z ?? 0;

					object.quaternion.x =
						node.levelNodeCrumbling.rotation?.x ?? 0;
					object.quaternion.y =
						node.levelNodeCrumbling.rotation?.y ?? 0;
					object.quaternion.z =
						node.levelNodeCrumbling.rotation?.z ?? 0;
					object.quaternion.w =
						node.levelNodeCrumbling.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					level.nodes.material[
						node.levelNodeCrumbling.material ?? 0
					]?.push(object);
					level.nodes.shape[
						node.levelNodeCrumbling.shape ?? 1000
					]?.push(object);
					level.nodes.levelNodeCrumbling.push(object);
					level.complexity += 3;
				} else if (node.levelNodeTrigger) {
					let isSublevelTrigger = false;

					if (node.levelNodeTrigger.triggerTargets) {
						for (const target of node.levelNodeTrigger
							.triggerTargets) {
							if (target.triggerTargetSubLevel?.levelIdentifier) {
								isSublevelTrigger = true;
							}
						}
					}

					let material;
					if (isSublevelTrigger && this.options.sublevels) {
						material = objectMaterials[5];
					} else {
						material = objectMaterials[4];
					}

					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					newMaterial.transparent = true;
					newMaterial.uniforms.transparentEnabled.value = 1.0;
					const object = new THREE.Mesh(
						shapes[
							Math.min(
								Math.max(
									(node.levelNodeTrigger.shape ?? 1000) -
										1000,
									0,
								),
								shapes.length - 1,
							)
						],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeTrigger>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeTrigger.position?.x ?? 0;
					object.position.y = node.levelNodeTrigger.position?.y ?? 0;
					object.position.z = node.levelNodeTrigger.position?.z ?? 0;

					object.scale.x = node.levelNodeTrigger.scale?.x ?? 0;
					object.scale.y = node.levelNodeTrigger.scale?.y ?? 0;
					object.scale.z = node.levelNodeTrigger.scale?.z ?? 0;

					object.quaternion.x =
						node.levelNodeTrigger.rotation?.x ?? 0;
					object.quaternion.y =
						node.levelNodeTrigger.rotation?.y ?? 0;
					object.quaternion.z =
						node.levelNodeTrigger.rotation?.z ?? 0;
					object.quaternion.w =
						node.levelNodeTrigger.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					object.visible = this.options.triggers;

					level.nodes.shape[
						node.levelNodeTrigger.shape ?? 1000
					]?.push(object);
					level.nodes.levelNodeTrigger.push(object);
					level.complexity += 3;
				} else if (node.levelNodeGASM) {
					const material = objectMaterials[9];

					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					newMaterial.transparent = true;
					newMaterial.uniforms.transparentEnabled.value = 1.0;
					const object = new THREE.Mesh(
						shapes[0],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeGASM>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeGASM.position?.x ?? 0;
					object.position.y = node.levelNodeGASM.position?.y ?? 0;
					object.position.z = node.levelNodeGASM.position?.z ?? 0;

					object.scale.x = node.levelNodeGASM.scale?.x ?? 0;
					object.scale.y = node.levelNodeGASM.scale?.y ?? 0;
					object.scale.z = node.levelNodeGASM.scale?.z ?? 0;

					object.quaternion.x = node.levelNodeGASM.rotation?.x ?? 0;
					object.quaternion.y = node.levelNodeGASM.rotation?.y ?? 0;
					object.quaternion.z = node.levelNodeGASM.rotation?.z ?? 0;
					object.quaternion.w = node.levelNodeGASM.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					object.visible = this.options.GASM;

					level.nodes.levelNodeGASM.push(object);
					level.complexity += 5;
				} else if (node.levelNodeSound) {
					const material = objectMaterials[8];

					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					newMaterial.transparent = true;
					newMaterial.uniforms.transparentEnabled.value = 1.0;
					const object = new THREE.Mesh(
						shapes[1],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeSound>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeSound.position?.x ?? 0;
					object.position.y = node.levelNodeSound.position?.y ?? 0;
					object.position.z = node.levelNodeSound.position?.z ?? 0;

					object.scale.x = 1;
					object.scale.y = 1;
					object.scale.z = 1;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					object.visible = this.options.sound;

					level.nodes.levelNodeSound.push(object);
					level.complexity += 8;
				} else if (node.levelNodeLight) {
					const material = objectMaterials[12];

					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					newMaterial.transparent = true;
					newMaterial.uniforms.transparentEnabled.value = 1.0;
					const object = new THREE.Mesh(
						shapes[1],
						newMaterial,
					) as unknown as LevelNodeObject<LevelNodeLight>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeLight.position?.x ?? 0;
					object.position.y = node.levelNodeLight.position?.y ?? 0;
					object.position.z = node.levelNodeLight.position?.z ?? 0;

					object.scale.x = 1;
					object.scale.y = 1;
					object.scale.z = 1;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const targetVector = new THREE.Vector3();
					const targetQuaternion = new THREE.Quaternion();
					const worldMatrix = new THREE.Matrix4();
					worldMatrix.compose(
						object.getWorldPosition(targetVector),
						object.getWorldQuaternion(targetQuaternion),
						object.getWorldScale(targetVector),
					);

					const normalMatrix = new THREE.Matrix3();
					normalMatrix.getNormalMatrix(worldMatrix);
					newMaterial.uniforms.worldNormalMatrix.value = normalMatrix;
					newMaterial.uniforms.frozenNormalMatrix.value =
						normalMatrix;

					object.visible = this.options.light;

					level.nodes.levelNodeLight.push(object);
					level.complexity += 5;
				} else if (node.levelNodeStart) {
					const isDefaultSpawn =
						((decoded.defaultSpawnPointID ?? 0) == 0 &&
							level.nodes.levelNodeStart.length == 0) ||
						(decoded.defaultSpawnPointID ?? 0) - 1 ==
							level.nodes.all.length;

					let object: LevelNodeObject<LevelNodeStart>;
					if (isDefaultSpawn) {
						object = new THREE.Mesh(
							objects[0],
							objectMaterials[0],
						) as unknown as LevelNodeObject<LevelNodeStart>;
						object.add(
							new THREE.Mesh(objects[2], objectMaterials[10]),
						);
					} else {
						object = new THREE.Mesh(
							objects[0],
							objectMaterials[6],
						) as unknown as LevelNodeObject<LevelNodeStart>;
						object.add(
							new THREE.Mesh(objects[2], objectMaterials[11]),
						);
					}
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeStart.position?.x ?? 0;
					object.position.y = node.levelNodeStart.position?.y ?? 0;
					object.position.z = node.levelNodeStart.position?.z ?? 0;

					object.quaternion.set(
						node.levelNodeStart.rotation?.x ?? 0,
						node.levelNodeStart.rotation?.y ?? 0,
						node.levelNodeStart.rotation?.z ?? 0,
						node.levelNodeStart.rotation?.w ?? 0,
					);
					// only rotate around Y axis ? this looks wrong but sure
					object.quaternion.x = 0;
					object.quaternion.z = 0;

					object.quaternion.normalize();

					object.scale.x = (node.levelNodeStart.radius ?? 0) * 2.0;
					object.scale.z = (node.levelNodeStart.radius ?? 0) * 2.0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const spawnName = node.levelNodeStart.name;
					if (spawnName && spawnName.length > 0) {
						level.nodes.namedSpawns[spawnName] = object;
					}

					if (isDefaultSpawn) {
						level.nodes.defaultSpawn = object;
					}

					level.nodes.levelNodeStart.push(object);
				} else if (node.levelNodeFinish) {
					const object = new THREE.Mesh(
						objects[0],
						objectMaterials[1],
					) as unknown as LevelNodeObject<LevelNodeFinish>;
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeFinish.position?.x ?? 0;
					object.position.y = node.levelNodeFinish.position?.y ?? 0;
					object.position.z = node.levelNodeFinish.position?.z ?? 0;

					object.scale.x = (node.levelNodeFinish.radius ?? 0) * 2.0;
					object.scale.z = (node.levelNodeFinish.radius ?? 0) * 2.0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					level.nodes.levelNodeFinish.push(object);
				} else if (node.levelNodeSign) {
					const material = objectMaterials[2];
					const newMaterial = material.clone();
					newMaterial.uniforms.colorTexture =
						material.uniforms.colorTexture;

					const object = node.levelNodeSign.hideModel
						? (new THREE.Mesh(
								undefined,
								newMaterial,
							) as unknown as LevelNodeObject<LevelNodeSign>)
						: (new THREE.Mesh(
								objects[1],
								newMaterial,
							) as unknown as LevelNodeObject<LevelNodeSign>);
					obj = object;

					parentNode.add(object);
					object.position.x = node.levelNodeSign.position?.x ?? 0;
					object.position.y = node.levelNodeSign.position?.y ?? 0;
					object.position.z = node.levelNodeSign.position?.z ?? 0;

					object.scale.x = node.levelNodeSign.hideModel
						? (node.levelNodeSign.scale ?? 0)
						: 1;
					object.scale.y = node.levelNodeSign.hideModel
						? (node.levelNodeSign.scale ?? 0)
						: 1;
					object.scale.z = node.levelNodeSign.hideModel
						? (node.levelNodeSign.scale ?? 0)
						: 1;

					object.quaternion.x = node.levelNodeSign.rotation?.x ?? 0;
					object.quaternion.y = node.levelNodeSign.rotation?.y ?? 0;
					object.quaternion.z = node.levelNodeSign.rotation?.z ?? 0;
					object.quaternion.w = node.levelNodeSign.rotation?.w ?? 0;

					object.initialPosition = object.position.clone();
					object.initialRotation = object.quaternion.clone();

					const signText = node.levelNodeSign.text;

					if (signText && this.options.text) {
						const letterSize = 0.059; //Size of the text characters
						const processString = (inputStr: string) => {
							const words = inputStr.split(/\s+/);
							let currentLineWidth = 0;
							let finalStr = '';

							words.forEach((word) => {
								const wordLength = word.length + 1;
								const wordWidth = wordLength * letterSize;

								/* 1.2 is a magical number to represent the width of the sign */
								if (currentLineWidth + wordWidth >= 1.2) {
									currentLineWidth = wordWidth;
									finalStr += '\n' + word + ' ';
								} else {
									currentLineWidth += wordWidth;
									finalStr += word + ' ';
								}
							});

							return finalStr.trim();
						};

						const processedText = processString(signText);

						const color = new THREE.Color(1, 1, 1);
						if (node.levelNodeSign.color) {
							color.r = node.levelNodeSign.color.r ?? 0;
							color.g = node.levelNodeSign.color.g ?? 0;
							color.b = node.levelNodeSign.color.b ?? 0;
						}
						const lines = processedText.split('\n');
						for (const [index, line] of lines.entries()) {
							const textGeometry = new TextGeometry(line, {
								font: this.font!,
								size: letterSize,
								height: 0,
								curveSegments: 1,
								bevelEnabled: false,
							});

							const textMaterial = new THREE.MeshBasicMaterial({
								color: color,
							});
							const textMesh = new THREE.Mesh(
								textGeometry,
								textMaterial,
							);

							textGeometry.computeBoundingBox();
							const boundingBox = textGeometry.boundingBox;
							const textWidth =
								(boundingBox?.max.x ?? 0) -
								(boundingBox?.min.x ?? 0);
							const textHeight =
								(boundingBox?.max.y ?? 0) -
								(boundingBox?.min.y ?? 0);

							const verticalSpacing =
								(textHeight + 0.2 * (index + 1)) / 2;
							textMesh.position.add(
								new THREE.Vector3(
									-textWidth / 2,
									-verticalSpacing +
										0.05 * (lines.length + 1),
									node.levelNodeSign.hideModel ? 0 : 0.021,
								),
							);

							object.add(textMesh);
						}
					}

					level.nodes.levelNodeSign.push(object);
					level.complexity += 10;
				}

				if (obj !== undefined) {
					// set obj.userData.is<NodeType>
					const nodeTypeEntry = Object.entries(node).find((entry) =>
						entry[0].startsWith('levelNode'),
					);
					if (nodeTypeEntry) {
						obj.userData[
							nodeTypeEntry[0].replace('levelNode', 'is')
						] = true;
					}

					if (!obj.userData.isGroup) {
						level.nodes.all.push(obj);
						obj.userData.id = level.nodes.all.length;
					}
					obj.userData.node = node;
					if (obj.material?.uniforms)
						obj.material.uniforms.worldMatrix = {
							value: new THREE.Matrix4().copy(obj.matrixWorld),
						};

					const active_animation = node.activeAnimation ?? 0;
					if (
						node.activeAnimation !== -1 &&
						node.animations?.[active_animation]?.frames?.length
					) {
						obj.userData.animation =
							node.animations[active_animation];
						obj.userData.currentFrameIndex = 0;
					}

					if (node.animations?.[0]?.frames?.length) {
						level.nodes.animated.push(obj);
					}
				}
			}
		};

		loadLevelNodes(decoded.levelNodes ?? [], scene);

		return level;
	}
}

function getMaterialForTexture(
	name: string,
	tileFactor: number,
	vertexShader: string,
	fragmentShader: string,
	specularColor: [number, number, number, number] = [0.3, 0.3, 0.3, 16.0],
	neonEnabled = 0.0,
	isLava = 0.0,
	fogEnabled = 1.0,
): LevelNodeShaderMaterial {
	const texture = textureLoader.load(name);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.colorSpace = THREE.SRGBColorSpace;

	const uniforms: LevelNodeUniforms = {
		colorTexture: { value: texture },
		tileFactor: { value: tileFactor },
		diffuseColor: { value: [1.0, 1.0, 1.0] },
		worldNormalMatrix: { value: new THREE.Matrix3() },
		frozenNormalMatrix: { value: new THREE.Matrix3() },
		worldMatrix: { value: new THREE.Matrix4() },
		neonEnabled: { value: neonEnabled },
		transparentEnabled: { value: 0.0 },
		fogEnabled: { value: fogEnabled },
		isSelected: { value: false },
		specularColor: { value: specularColor },
		isLava: { value: isLava },
		isColoredLava: { value: 0.0 },
		isGradient: { value: 0.0 },
		isAdditive: { value: 0.0 },
		diffuseColor2: { value: [1.0, 1.0, 1.0] },
		gradientDirection: { value: [0.0, 1.0, 0.0] },
	};

	return new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		lights: true,
		uniforms: THREE.UniformsUtils.merge([
			THREE.ShaderLib.standard.uniforms,
			uniforms,
		]),
	}) as LevelNodeShaderMaterial;
}

async function getGeometryForModel(
	name: string,
): Promise<THREE.BufferGeometry> {
	const gltf: GLTF = await new Promise((resolve, reject) => {
		gltfLoader.load(name, resolve, undefined, reject);
	});

	const object = gltf.scene.children[0];

	if (!(object instanceof THREE.Mesh)) {
		throw new Error('Models first child is not a Mesh');
	}

	return object.geometry as THREE.BufferGeometry;
}

function updateObjectAnimation(object: LevelNodeObject, time: number) {
	const animation = object.userData.animation;
	if (!animation) return;
	const animationFrames = animation.frames;
	if (!animationFrames) return;
	const relativeTime =
		(time * (animation.speed ?? 0)) %
		(animationFrames[animationFrames.length - 1]!.time ?? 0);

	//Find frames to blend between
	let oldFrame = animationFrames[object.userData.currentFrameIndex ?? 0];
	let newFrameIndex = (object.userData.currentFrameIndex ??= 0) + 1;
	if (newFrameIndex >= animationFrames.length) newFrameIndex = 0;
	let newFrame = animationFrames[newFrameIndex];

	let loopCounter = 0; //Used to prevent endless loop with only one frame or all having the same time
	while (loopCounter <= animationFrames.length) {
		oldFrame = animationFrames[object.userData.currentFrameIndex];
		newFrameIndex = object.userData.currentFrameIndex + 1;
		if (newFrameIndex >= animationFrames.length) newFrameIndex = 0;
		newFrame = animationFrames[newFrameIndex];

		if (
			(oldFrame?.time ?? 0) <= relativeTime &&
			(newFrame?.time ?? 0) > relativeTime
		)
			break;
		object.userData.currentFrameIndex += 1;
		if (object.userData.currentFrameIndex >= animationFrames.length - 1)
			object.userData.currentFrameIndex = 0;

		loopCounter += 1;
	}

	let factor = 0.0;
	const timeDiff = (newFrame?.time ?? 0) - (oldFrame?.time ?? 0);
	if (Math.abs(timeDiff) > 0.00000001) {
		//Prevent dividing by 0 if time of both frames is equal
		factor = (relativeTime - (oldFrame?.time ?? 0)) / timeDiff;
	}

	const oldRotation = new THREE.Quaternion(
		oldFrame?.rotation?.x ?? 0,
		oldFrame?.rotation?.y ?? 0,
		oldFrame?.rotation?.z ?? 0,
		oldFrame?.rotation?.w ?? 0,
	);
	const newRotation = new THREE.Quaternion(
		newFrame?.rotation?.x ?? 0,
		newFrame?.rotation?.y ?? 0,
		newFrame?.rotation?.z ?? 0,
		newFrame?.rotation?.w ?? 0,
	);
	const finalRotation = new THREE.Quaternion();
	finalRotation.slerpQuaternions(oldRotation, newRotation, factor);

	const oldPosition = new THREE.Vector3(
		oldFrame?.position?.x ?? 0,
		oldFrame?.position?.y ?? 0,
		oldFrame?.position?.z ?? 0,
	);
	const newPosition = new THREE.Vector3(
		newFrame?.position?.x ?? 0,
		newFrame?.position?.y ?? 0,
		newFrame?.position?.z ?? 0,
	);
	const finalPosition = new THREE.Vector3();
	finalPosition.lerpVectors(oldPosition, newPosition, factor);

	object.position
		.copy(object.initialPosition)
		.add(finalPosition.applyQuaternion(object.initialRotation));
	object.quaternion.multiplyQuaternions(
		object.initialRotation,
		finalRotation,
	);
}

function updateObjectParticles(object: LevelNodeObject, delta: number) {
	object.userData.update?.(delta); // TODO: actually move the logic here
}

export { LevelLoader };
