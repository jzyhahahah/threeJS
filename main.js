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

let sphere;
let lightHelper;

let angle = 0.01;
let angularSpeed = 0.005;
const aRadius = 20;
const bRadius = 10;
let texLoader;
let texture;

let animationMixer;
let clip;
let animateClipAction;
let animationFrame;
let gltf;

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
  OrbitalRotation();
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
  loader.load("/RobotExpressive.glb", function (_gltf) {
    gltf = _gltf
    model = gltf.scene;
    model.castShadow = true; //开启阴影
    // 返回的场景对象gltf.scene插入到threejs场景中
    model.position.set(0, 0, 0);
    //模型旋转
    scene.add(model);
    console.log(gltf);
    //onStartModelAnimaion(gltf.animations,"Dance")
    modelRotate();
  });
};

function onSetModelAnimaion({
  animations,
  animationName,
  loop,
  timeScale,
  weight,
}) {
  animationMixer = new THREE.AnimationMixer(gltf);
  clip = THREE.AnimationClip.findByName(animations, animationName);
  if (clip) {
    animateClipAction = animationMixer.clipAction(clip);
    //animateClipAction.setEffectiveTimeScale(timeScale);
    //animateClipAction.setEffectiveWeight(weight);
    //animateClipAction.setLoop(this.loopMap[loop]);
    animateClipAction.play();
  }
}

function animationFrameFun() {
  animationFrame = requestAnimationFrame(() => this.animationFrameFun())
  if (animationMixer) {
      animationMixer.update(this.animationColock.getDelta())
  }
}

function onStartModelAnimaion(config) {
  onSetModelAnimaion(config);
  cancelAnimationFrame(this.animationFram);
  animationFrameFun();
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
