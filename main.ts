import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min";
import Stats from "three/examples/jsm/libs/stats.module";
import {
	AnimationAction,
	AnimationClip,
	AnimationMixer,
	AxesHelper,
	Clock,
	Group,
	Mesh,
	Object3D,
	PerspectiveCamera,
	Scene,
	Texture,
	TextureLoader,
	WebGLRenderer,
} from "three";

let scene: Scene; //场景
let axesHelper: AxesHelper; //辅助坐标轴
let camera: PerspectiveCamera; //相机
let loader: GLTFLoader; //模型加载器

let render: WebGLRenderer; // 渲染器
let controls: OrbitControls; //控制器

let ambient; // 环境光
let light; //光源
let ground: Mesh; //地面Mesh

let xydBox; //box Mesh
let lightHelper; //辅助光源

let angle = 0.01;
let angularSpeed = 0.005;

const aRadius = 20;
const bRadius = 10;

let texLoader: TextureLoader; //纹理加载器
let earthTexture: Texture; //地球纹理
let xydTexture: Texture; //xyd纹理
let moonTexture: Texture; //月球纹理

let gui: GUI; //交互UI
let actions: any;
let stats: Stats,
	clock: Clock,
	mixer: AnimationMixer,
	activeAction: AnimationAction,
	previousAction,
	face: Object3D<THREE.Object3DEventMap> | undefined;

let earthMoonGroup: Group; //地月组
let moonSphere : Mesh; //moon Mesh
let earthSphere : Mesh; //earth Mesh

const api: any = { state: "Walking" };

function initThree() {
	scene = new THREE.Scene();
	axesHelper = new THREE.AxesHelper(10);
	loader = new GLTFLoader();
	texLoader = new THREE.TextureLoader();
	earthTexture = texLoader.load("/planet.png");
	xydTexture = texLoader.load("/xyd_logo_vertical.png");
	moonTexture = texLoader.load("/moon.png");
	camera = new THREE.PerspectiveCamera(
		45, //视角
		window.innerWidth / window.innerHeight, //长宽比
		0.1, //近截面，距离摄像机多近的物体将不会被渲染
		1000 //远截面，超出这个范围的物体将不会被渲染
	);
	clock = new THREE.Clock();

	render = new THREE.WebGLRenderer({
		antialias: true, //抗锯齿
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
	document.body.appendChild(stats.dom);
}

function renderCanvas() {
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
	light.shadow.mapSize.width = 2048; //阴影贴图的宽度和高度,提高分辨率
	light.shadow.mapSize.height = 2048;
	scene.add(light);

	lightHelper = new THREE.PointLightHelper(light, 1, 0xf28d00);
	scene.add(lightHelper);
}

function loadSphere() {
	earthMoonGroup = new THREE.Group();
	earthMoonGroup.name = "earthMoon";
	earthMoonGroup.position.set(0, 10, 8);

	const geometry = new THREE.SphereGeometry(2, 32, 32);
	const material = new THREE.MeshPhongMaterial({
		specular: "#FFFFFF",
		shininess: 20, //高光部分的亮度，默认30
		map: earthTexture,
	});
	earthSphere = new THREE.Mesh(geometry, material);
	earthMoonGroup.add(earthSphere);
	earthSphere.name = "earth";
	earthSphere.position.set(0, 0, 0);
	earthSphere.castShadow = true; //开启阴影
	earthSphere.receiveShadow = true;

	const moonGeometry = new THREE.SphereGeometry(0.5, 32, 32);
	const moonMaterial = new THREE.MeshPhongMaterial({
		specular: "#FFFFFF",
		shininess: 20, //高光部分的亮度，默认30
		map: moonTexture,
	});
	moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
	earthMoonGroup.add(moonSphere);
	moonSphere.name = "moon";
	moonSphere.position.set(0, 0, 6);
	moonSphere.castShadow = true; //开启阴影
	moonSphere.receiveShadow = true;

	const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
	const boxMaterial = new THREE.MeshPhysicalMaterial({
		map: xydTexture,
		//specular: "#FFFFFF",
		//shininess: 30, //高光部分的亮度，默认30
		clearcoat: 2.0,
	});
	xydBox = new THREE.Mesh(boxGeometry, boxMaterial);
	xydBox.position.set(0, 2, 9);
	xydBox.castShadow = true;
	xydBox.receiveShadow = true;
	scene.add(xydBox);
	scene.add(earthMoonGroup);
}

function loadGround() {
	const groundGeo = new THREE.PlaneGeometry(100, 50);
	const groundMaterial = new THREE.MeshPhongMaterial({
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
	earthMoonGroup.position.x = Math.cos(angle) * aRadius;
	earthMoonGroup.position.z = Math.sin(angle) * bRadius;
	earthMoonGroup.rotation.y = 1.2 * angle;
	//earthSphere.rotation.y = -angle;
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

const loadGLTF = function () {
	loader.load("/RobotExpressive.glb", function (gltf: GLTF) {
		const model: Group = gltf.scene;
		model.castShadow = true; //开启阴影
		// 返回的场景对象gltf.scene插入到threejs场景中
		model.position.set(4, 0, 0);
		model.traverse((obj) => {
			if (obj.castShadow !== undefined) {
				// 开启投射影响
				obj.castShadow = true;
				// 开启被投射阴影
				obj.receiveShadow = true;
			}
		});
		scene.add(model);
		console.log(gltf);
		//modelRotate();
		createGUI(model, gltf.animations);
	});
};

function createGUI(model: Group, animations: AnimationClip[]) {
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

	actions = {} as AnimationAction; //创建了一个空对象`actions`，它将用于存储每个动画剪辑对应的`AnimationAction`对象。
	/*
	 *使用`for`循环遍历`animations`数组，为每个动画剪辑创建一个`AnimationAction`对象，
	 *并将其存储在`actions`对象中。如果动画剪辑是表情或者在`states`数组中的状态之一，设置
	 *其`clampWhenFinished`属性为`true`，并将循环模式设置为`THREE.LoopOnce`，表示播放一次后停止。
	 */
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
	/**
	 * 创建了一个名为`States`的文件夹，用于控制模型的不同状态。在文件夹中创建了一个下拉菜单，
	 * 选项为`states`数组中的每个状态，并通过`onChange`事件回调函数来监听选项的变化。当状态
	 * 改变时，调用`fadeToAction`函数来切换动画。
	 */
	const statesFolder = gui.addFolder("States");
	const clipCtrl = statesFolder.add(api, "state").options(states);
	clipCtrl.onChange(function () {
		fadeToAction(api.state, 0.5);
	});
	statesFolder.open();

	// emotes
	/**
	 * 创建了一个名为`Emotes`的文件夹，用于控制模型。通过循环创建了多个回调函数，
	 * 用于处理每个表情的控制。在回调函数中调用`fadeToAction`函数来切换到对应的表情动
	 * 画，并在动画播放完成后恢复到之前的状态。
	 */
	const emoteFolder = gui.addFolder("Emotes");
	function createEmoteCallback(name: any) {
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
	/**
	 *  创建了一个名为`Expressions`的文件夹，用于控制模型的面部表情。
	 * 通过遍历模型的`morphTargetDictionary`属性中的键（表情名称），
	 * 创建了滑块控件，用于控制每个表情的权重。
	 */

	face = model.getObjectByName("Head_4");
	// @ts-ignore
	const expressions = Object.keys(face.morphTargetDictionary);
	const expressionFolder = gui.addFolder("Expressions");
	for (let i = 0; i < expressions.length; i++) {
		expressionFolder
			// @ts-ignore
			.add(face.morphTargetInfluences, i, 0, 1, 0.01)
			.name(expressions[i]);
	}
	activeAction = actions["Walking"];
	activeAction.play();
	expressionFolder.open();
}

/**
 * 最后，定义了`fadeToAction`函数，用于实现动画过渡效果。
 * 函数接受两个参数：`name`表示要过渡到的动画名称，`duration`表示过渡的持续时间。
 * 在函数内部，先保存当前活动动画为`previousAction`，然后将活动动画设置为指定的动画，
 * 进行过渡效果的处理（淡出、重置、设置时间和权重、淡入、播放
 */

function fadeToAction(name: string, duration: number) {
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
	renderCanvas();
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
