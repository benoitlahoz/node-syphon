import Stats from 'stats-js';
import { nextTick } from 'vue';
import type { WebGLRenderer, PerspectiveCamera, Scene, PointLight } from 'three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'three/addons/helpers/VertexTangentsHelper.js';
import LeePerrySmith from '@/assets/models/LeePerrySmith/LeePerrySmith.glb?url';

// https://threejs.org/examples/#webgl_helpers
export class ThreeExampleHelpersOffscreen {
  private stats = new Stats();

  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private light: PointLight;
  private vnh: VertexNormalsHelper | undefined;
  private vth: VertexTangentsHelper | undefined;

  private _onresize = () => {};

  constructor(
    public readonly canvas: HTMLCanvasElement,
    private top = '6px',
    private retina = false,
  ) {
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.renderer = new THREE.WebGLRenderer({ canvas });
    if (this.retina) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    const height = window.innerHeight;
    this.renderer.setSize(window.innerWidth, height);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / height, 1, 1000);
    this.camera.position.z = 400;

    this.scene = new THREE.Scene();

    this.light = new THREE.PointLight();
    this.light.position.set(200, 100, 150);
    this.scene.add(this.light);

    this.scene.add(new THREE.PointLightHelper(this.light, 15));

    const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
    gridHelper.position.y = -150;
    gridHelper.position.x = -150;
    this.scene.add(gridHelper);

    const polarGridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x0000ff, 0x808080);
    polarGridHelper.position.y = -150;
    polarGridHelper.position.x = 200;
    this.scene.add(polarGridHelper);

    const loader = new GLTFLoader();
    const self = this;
    loader.load(LeePerrySmith, function (gltf) {
      const mesh: any = gltf.scene.children[0];

      mesh.geometry.computeTangents(); // generates bad data due to degenerate UVs

      const group = new THREE.Group();
      group.scale.multiplyScalar(50);
      self.scene.add(group);

      // To make sure that the matrixWorld is up to date for the boxhelpers
      group.updateMatrixWorld(true);

      group.add(mesh);

      self.vnh = new VertexNormalsHelper(mesh, 5);
      self.scene.add(self.vnh);

      self.vth = new VertexTangentsHelper(mesh, 5);
      self.scene.add(self.vth);

      self.scene.add(new THREE.BoxHelper(mesh));

      const wireframe = new THREE.WireframeGeometry(mesh.geometry);
      let line: any = new THREE.LineSegments(wireframe);
      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = 4;
      group.add(line);
      self.scene.add(new THREE.BoxHelper(line));

      const edges = new THREE.EdgesGeometry(mesh.geometry);
      line = new THREE.LineSegments(edges);
      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = -4;
      group.add(line);
      self.scene.add(new THREE.BoxHelper(line));

      self.scene.add(new THREE.BoxHelper(group));
      self.scene.add(new THREE.BoxHelper(self.scene));
    });

    this.renderer.setAnimationLoop(this.animate.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));

    nextTick(() => {
      this.onWindowResize();
    });
  }

  public dispose(): void {
    this.stats.dom.remove();
    this.stats = null;

    this.vnh?.dispose();
    this.vth?.dispose();
    this.light.dispose();
    this.renderer.dispose();

    // TODO: Do we have to remove event listeners and animation loop?
  }

  public set onresize(fn: () => void) {
    this._onresize = fn.bind(this);
  }

  private async animate() {
    this.stats.begin();

    const time = -performance.now() * 0.0003;

    this.camera.position.x = 400 * Math.cos(time);
    this.camera.position.z = 400 * Math.sin(time);
    this.camera.lookAt(this.scene.position);

    this.light.position.x = Math.sin(time * 1.7) * 300;
    this.light.position.y = Math.cos(time * 1.5) * 400;
    this.light.position.z = Math.cos(time * 1.3) * 300;

    if (this.vnh) this.vnh.update();
    if (this.vth) this.vth.update();

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  private onWindowResize() {
    const height = window.innerHeight;
    this.camera.aspect = window.innerWidth / height;
    this.camera.updateProjectionMatrix();
    this.renderer.domElement.width = window.innerWidth;
    this.renderer.domElement.height = height;
    this.renderer.setSize(window.innerWidth, height);

    this.stats.dom.style.top = this.top;
    this.stats.dom.style.left = '6px';

    this._onresize();
  }
}
