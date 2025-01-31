<script lang="ts">
export default {
  name: 'SimpleGLServer',
};
</script>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import Stats from 'stats-js';

import { useSyphon } from '@/composables/useSyphon';

import type { WebGLRenderer, PerspectiveCamera, Scene, PointLight } from 'three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'three/addons/helpers/VertexTangentsHelper.js';
import LeePerrySmith from '@/assets/models/LeePerrySmith/LeePerrySmith.glb?url';

const { createServer, publishFrameGL } = useSyphon();

const canvasRef = ref<HTMLCanvasElement | undefined>();
let offscreenCanvas;
let ctx;

let renderer: WebGLRenderer;
let camera: PerspectiveCamera;
let scene: Scene;
let light: PointLight;
let vnh: VertexNormalsHelper;
let vth: VertexTangentsHelper;

const stats = new Stats();
stats.showPanel(0);

onMounted(async () => {
  const canvas: HTMLCanvasElement | undefined = canvasRef.value;

  if (!canvas) {
    throw new Error(`Canvas element may not be mounted yet.`);
  }

  // Create offscreen canvas to get pixel data from.
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

  await createServer('ThreeJS', 'gl');

  renderer = new THREE.WebGLRenderer({ canvas });
  // renderer.setPixelRatio(window.devicePixelRatio); // FIXME: With real ratio (x2) 1600x1200 are falling to 16fps.
  renderer.setAnimationLoop(animate);

  const height = window.innerHeight - 34;
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / height, 1, 1000);
  camera.position.z = 400;

  scene = new THREE.Scene();

  light = new THREE.PointLight();
  light.position.set(200, 100, 150);
  scene.add(light);

  scene.add(new THREE.PointLightHelper(light, 15));

  const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
  gridHelper.position.y = -150;
  gridHelper.position.x = -150;
  scene.add(gridHelper);

  const polarGridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x0000ff, 0x808080);
  polarGridHelper.position.y = -150;
  polarGridHelper.position.x = 200;
  scene.add(polarGridHelper);

  const loader = new GLTFLoader();
  loader.load(LeePerrySmith, function (gltf) {
    const mesh: any = gltf.scene.children[0];

    mesh.geometry.computeTangents(); // generates bad data due to degenerate UVs

    const group = new THREE.Group();
    group.scale.multiplyScalar(50);
    scene.add(group);

    // To make sure that the matrixWorld is up to date for the boxhelpers
    group.updateMatrixWorld(true);

    group.add(mesh);

    vnh = new VertexNormalsHelper(mesh, 5);
    scene.add(vnh);

    vth = new VertexTangentsHelper(mesh, 5);
    scene.add(vth);

    scene.add(new THREE.BoxHelper(mesh));

    const wireframe = new THREE.WireframeGeometry(mesh.geometry);
    let line: any = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.x = 4;
    group.add(line);
    scene.add(new THREE.BoxHelper(line));

    const edges = new THREE.EdgesGeometry(mesh.geometry);
    line = new THREE.LineSegments(edges);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.x = -4;
    group.add(line);
    scene.add(new THREE.BoxHelper(line));

    scene.add(new THREE.BoxHelper(group));
    scene.add(new THREE.BoxHelper(scene));
  });

  window.addEventListener('resize', onWindowResize);

  // First resize.
  nextTick(() => {
    onWindowResize();
    stats.dom.style.top = '40px';
    stats.dom.style.left = '6px';
    document.body.appendChild(stats.dom);
  });
});

const onWindowResize = () => {
  const height = window.innerHeight - 34;
  camera.aspect = window.innerWidth / height;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, height);

  const canvas: HTMLCanvasElement = canvasRef.value!;
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
};

const animate = async () => {
  stats.begin();

  const time = -performance.now() * 0.0003;

  camera.position.x = 400 * Math.cos(time);
  camera.position.z = 400 * Math.sin(time);
  camera.lookAt(scene.position);

  light.position.x = Math.sin(time * 1.7) * 300;
  light.position.y = Math.cos(time * 1.5) * 400;
  light.position.z = Math.cos(time * 1.3) * 300;

  if (vnh) vnh.update();
  if (vth) vth.update();

  renderer.render(scene, camera);

  // 30fps if we don't send the data.
  stats.end();

  const canvas: HTMLCanvasElement = canvasRef.value!;
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  await publishFrameGL({ data: imageData.data, width: canvas.width, height: canvas.height });
};
</script>

<template lang="pug">
.w-full.h-full.flex.flex-col.text-sm
  .bg-background-dark
    .titlebar.w-full.font-semibold Electron Simple Server
  .bg-background.w-full.flex-1.flex.flex-col
    .w-full.flex.flex-1.bg-black.overflow-hidden
      canvas(
        ref="canvasRef"
      ).w-full
</template>

<style scoped>
.titlebar {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
}
</style>
