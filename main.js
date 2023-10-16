import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper); //添加坐标轴,蓝色代表z轴，红色代表x轴，绿色代表y轴
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(
  45, //视角
  window.innerWidth / window.innerHeight, //长宽比
  0.1, //近截面，距离摄像机多近的物体将不会被渲染
  1000 //远截面，超出这个范围的物体将不会被渲染
);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

//添加控制器

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//添加光源
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 50, 50);
scene.add(light);

const loader = new GLTFLoader();
/* 
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube); */

loader.load("/RobotExpressive.glb", function (gltf) {
  console.log("控制台查看加载gltf文件返回的对象结构", gltf);
  console.log("gltf对象场景属性", gltf.scene);
  // 返回的场景对象gltf.scene插入到threejs场景中
  gltf.scene.position.set(0, -3, 0);
  //模型旋转
  gltf.scene.rotation.y = Math.PI / 4;
  scene.add(gltf.scene);
});




camera.position.z = 10;
//camera.position.y = 50;

const controls = new OrbitControls(camera, renderer.domElement);
//阻尼
controls.enableDamping = true;

const animate = function () {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
}

