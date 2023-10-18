import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let scene;
let axesHelper;
let camera;
let loader;
let model;
let render;
let controls;

let ambient;
let light;

let groundGeo;
let groundMaterial;
let ground;

let sphere;
let lightHelper;

let angle = 0.01;
let angularSpeed = 0.005;

const aRadius = 20;
const bRadius = 10;

let texLoader;
let texture;

let gui;
let actions;

let stats, clock, mixer, activeAction, previousAction, face;

const container = document.getElementById("app");
const api = { state: "Walking" };

function initThree() {
	scene = new THREE.Scene();
	axesHelper = new THREE.AxesHelper(10);
	loader = new GLTFLoader();
	texLoader = new THREE.TextureLoader();
	texture = texLoader.load("/planet.png");
	camera = new THREE.PerspectiveCamera(
		45, //视角
		window.innerWidth / window.innerHeight, //长宽比
		0.1, //近截面，距离摄像机多近的物体将不会被渲染
		1000 //远截面，超出这个范围的物体将不会被渲染
	);
	clock = new THREE.Clock();

	render = new THREE.WebGLRenderer({
		antialias: true,
	});
	render.shadowMap.enabled = true; //开启阴影

	scene.add(axesHelper); //添加坐标轴,蓝色代表z轴，红色代表x轴，绿色代表y轴
	scene.background = new THREE.Color(0x000000);

	camera.position.set(10, 10, 10);
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, render.domElement); //添加控制器
	controls.enableDamping = true; //阻尼

	// stats
	stats = new Stats();
	container.appendChild(stats.dom);
}

function doRender() {
	render.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(render.domElement);
}

//添加光源
function addLight() {
	ambient = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambient);

	light = new THREE.PointLight(0xffffff, 100);
	light.position.set(0, 10, 0);
	light.castShadow = true; //开启阴影
	scene.add(light);

	lightHelper = new THREE.PointLightHelper(light, 1, 0xffffff);
	scene.add(lightHelper);
}

function loadSphere() {
	const geometry = new THREE.SphereGeometry(2, 32, 32);
	const material = new THREE.MeshPhongMaterial({
		specular: "#FFFFFF",
		shininess: 20, //高光部分的亮度，默认30
		map: texture,
	});
	sphere = new THREE.Mesh(geometry, material);
	sphere.position.set(10, 2, 0);
	sphere.castShadow = true; //开启阴影
	scene.add(sphere);
}

function loadGround() {
	groundGeo = new THREE.PlaneGeometry(100, 50);
	groundMaterial = new THREE.MeshPhongMaterial({
		color: "#EFEFEF",
		specular: "#FFFFFF",
		shininess: 20, //高光部分的亮度，默认30
		side: THREE.DoubleSide, //两面可见
	});
	ground = new THREE.Mesh(groundGeo, groundMaterial);
	ground.position.set(0, 0, 0);
	ground.rotation.set(Math.PI / 2, 0, 0);
	ground.receiveShadow = true; //开启阴影
	scene.add(ground);
}

function OrbitalRotation() {
	sphere.position.x = Math.cos(angle) * aRadius;
	sphere.position.z = Math.sin(angle) * bRadius;
	sphere.rotation.y = -angle;
	angle += angularSpeed;
}

const animate = function () {
	const dt = clock.getDelta();
	if (mixer) mixer.update(dt);

	OrbitalRotation();
	controls.update();
	render.render(scene, camera);
	requestAnimationFrame(animate);
	stats.update();
};

function modelRotate() {
	requestAnimationFrame(modelRotate);
	// 在每个动画帧中旋转模型
	//model.rotation.x += 0.01;
	model.rotation.y += 0.01;
}

const loadGLTF = function () {
	loader.load("/RobotExpressive.glb", function (gltf) {
		model = gltf.scene;
		model.castShadow = true; //开启阴影
		// 返回的场景对象gltf.scene插入到threejs场景中
		model.position.set(0, 0, 0);
		model.traverse((obj) => {
			if (obj.castShadow !== undefined) {
				// 开启投射影响
				obj.castShadow = true;
				// 开启被投射阴影
				obj.receiveShadow = true;
			}
		});
		scene.add(model);
		//modelRotate();
		createGUI(model, gltf.animations);
	});
};

function createGUI(model, animations) {
	const states = [
		"Idle",
		"Walking",
		"Running",
		"Dance",
		"Death",
		"Sitting",
		"Standing",
	]; //模型状态

	const emotes = ["Jump", "Yes", "No", "Wave", "Punch", "ThumbsUp"]; //表情

	gui = new GUI(); //创建交互UI

	mixer = new THREE.AnimationMixer(model);

	actions = {};

	for (let i = 0; i < animations.length; i++) {
		const clip = animations[i];
		const action = mixer.clipAction(clip);
		actions[clip.name] = action;

		if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
			action.clampWhenFinished = true;
			action.loop = THREE.LoopOnce;
		}
	}

	// states

	const statesFolder = gui.addFolder("States");

	const clipCtrl = statesFolder.add(api, "state").options(states);

	clipCtrl.onChange(function () {
		fadeToAction(api.state, 0.5);
	});

	statesFolder.open();

	// emotes

	const emoteFolder = gui.addFolder("Emotes");

	function createEmoteCallback(name) {
		api[name] = function () {
			fadeToAction(name, 0.2);

			mixer.addEventListener("finished", restoreState);
		};

		emoteFolder.add(api, name);
	}

	function restoreState() {
		mixer.removeEventListener("finished", restoreState);

		fadeToAction(api.state, 0.2);
	}

	for (let i = 0; i < emotes.length; i++) {
		createEmoteCallback(emotes[i]);
	}

	emoteFolder.open();

	// expressions

	face = model.getObjectByName("Head_4");

	const expressions = Object.keys(face.morphTargetDictionary);
	const expressionFolder = gui.addFolder("Expressions");

	for (let i = 0; i < expressions.length; i++) {
		expressionFolder
			.add(face.morphTargetInfluences, i, 0, 1, 0.01)
			.name(expressions[i]);
	}

	activeAction = actions["Walking"];
	activeAction.play();

	expressionFolder.open();
}

function fadeToAction(name, duration) {
	previousAction = activeAction;
	activeAction = actions[name];

	if (previousAction !== activeAction) {
		previousAction.fadeOut(duration);
	}

	activeAction
		.reset()
		.setEffectiveTimeScale(1)
		.setEffectiveWeight(1)
		.fadeIn(duration)
		.play();
}

const main = () => {
	initThree();
	doRender();
	addLight();
	loadSphere();
	loadGLTF();
	loadGround();
	animate();
};

main();

window.addEventListener(
	"resize",
	() => {
		camera.aspect = window.innerWidth / window.innerHeight;
		render.setSize(window.innerWidth, window.innerHeight);
		camera.updateProjectionMatrix();
	},
	false
);

/* const geometry = new THREE.BoxGeometry(3, 4, 5);
const material = new THREE.MeshPhongMaterial({
	color: "#CA8",
	specular: "#FFFFFF",
	shininess: 20, //高光部分的亮度，默认30
}); */

/* const cube = new THREE.Mesh(geometry, material);
cube.position.set(10, 0, 0);
scene.add(cube); */

//https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_morph.html
