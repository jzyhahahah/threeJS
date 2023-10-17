import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

let lightHelper;

function initThree() {
	scene = new THREE.Scene();
	axesHelper = new THREE.AxesHelper(5);
	loader = new GLTFLoader();
	camera = new THREE.PerspectiveCamera(
		45, //视角
		window.innerWidth / window.innerHeight, //长宽比
		0.1, //近截面，距离摄像机多近的物体将不会被渲染
		1000 //远截面，超出这个范围的物体将不会被渲染
	);

	render = new THREE.WebGLRenderer({
		antialias: true,
	});

	scene.add(axesHelper); //添加坐标轴,蓝色代表z轴，红色代表x轴，绿色代表y轴
	scene.background = new THREE.Color(0x000000);

	camera.position.set(10, 10, 10);
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, render.domElement); //添加控制器
	controls.enableDamping = true; //阻尼
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
	light.position.set(0, 8, 8);
	scene.add(light);

	lightHelper = new THREE.PointLightHelper(light, 0xffffff);
	scene.add(lightHelper);
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
	scene.add(ground);
}

const animate = function () {
	controls.update();
	render.render(scene, camera);
	requestAnimationFrame(animate);
};

function modelRotate() {
	requestAnimationFrame(modelRotate);
	// 在每个动画帧中旋转模型
	//model.rotation.x += 0.01;
	model.rotation.y += 0.01;
}

const loadGLTF = function () {
	loader.load("/RobotExpressive.glb", function (gltf) {
		console.log(gltf);
		model = gltf.scene;
		// 返回的场景对象gltf.scene插入到threejs场景中
		model.position.set(0, 0, 0);
		//模型旋转
		scene.add(model);
		modelRotate();
	});
};

window.addEventListener(
	"resize",
	() => {
		camera.aspect = window.innerWidth / window.innerHeight;
		render.setSize(window.innerWidth, window.innerHeight);
		camera.updateProjectionMatrix();
	},
	false
);

const main = () => {
	initThree();
	doRender();
	addLight();
	loadGround();
	loadGLTF();
	animate();
};

main();

/* const geometry = new THREE.BoxGeometry(3, 4, 5);
const material = new THREE.MeshPhongMaterial({
	color: "#CA8",
	specular: "#FFFFFF",
	shininess: 20, //高光部分的亮度，默认30
}); */

/* const cube = new THREE.Mesh(geometry, material);
cube.position.set(10, 0, 0);
scene.add(cube); */
