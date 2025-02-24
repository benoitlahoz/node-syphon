import Stats from 'stats-js';
import { nextTick } from 'vue';
import type {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  AmbientLight,
  Mesh,
  Raycaster,
  Line,
} from 'three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import LeePerrySmith from '@/assets/models/LeePerrySmith/LeePerrySmith.glb?url';
import MapCol from '@/assets/models/LeePerrySmith/Map-COL.jpg?url';
import MapSpec from '@/assets/models/LeePerrySmith/Map-SPEC.jpg?url';
import SmoothUv from '@/assets/models/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg?url';
import DecalNormal from '@/assets/textures/decal-normal.jpg?url';
import DecalDiffuse from '@/assets/textures/decal-diffuse.png?url';

// https://threejs.org/examples/#webgl_decals
export class ThreeExampleWebGLDecalsOffscreen {
  private stats = new Stats();

  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private mesh!: Mesh;
  private raycaster: Raycaster;
  private line: Line;
  private light: AmbientLight;

  private _onresize = () => {};

  constructor(
    public readonly canvas: HTMLCanvasElement,
    private top = '6px',
    private retina = false,
  ) {
    const self = this;

    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    const intersection = {
      intersects: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    };
    const mouse = new THREE.Vector2();
    const intersects: any = [];

    const textureLoader = new THREE.TextureLoader();
    const decalDiffuse = textureLoader.load(DecalDiffuse);
    decalDiffuse.colorSpace = THREE.SRGBColorSpace;
    const decalNormal = textureLoader.load(DecalNormal);

    const decalMaterial = new THREE.MeshPhongMaterial({
      specular: 0x444444,
      map: decalDiffuse,
      normalMap: decalNormal,
      normalScale: new THREE.Vector2(1, 1),
      shininess: 30,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      wireframe: false,
    });

    const decals: any = [];
    let mouseHelper;
    const position = new THREE.Vector3();
    const orientation = new THREE.Euler();
    const size = new THREE.Vector3(10, 10, 10);

    const params = {
      minScale: 10,
      maxScale: 20,
      rotate: true,
      clear: function () {
        removeDecals();
      },
    };

    function onPointerMove(event) {
      if (event.isPrimary) {
        checkIntersection(event.clientX, event.clientY);
      }
    }

    function checkIntersection(x, y) {
      if (self.mesh === undefined) return;

      mouse.x = (x / window.innerWidth) * 2 - 1;
      mouse.y = -(y / window.innerHeight) * 2 + 1;

      self.raycaster.setFromCamera(mouse, self.camera);
      self.raycaster.intersectObject(self.mesh, false, intersects);

      if (intersects.length > 0) {
        const p = intersects[0].point;
        mouseHelper.position.copy(p);
        intersection.point.copy(p);

        const normalMatrix = new THREE.Matrix3().getNormalMatrix(self.mesh.matrixWorld);

        const n = intersects[0].face.normal.clone();
        n.applyNormalMatrix(normalMatrix);
        n.multiplyScalar(10);
        n.add(intersects[0].point);

        intersection.normal.copy(intersects[0].face.normal);
        mouseHelper.lookAt(n);

        const positions = self.line.geometry.attributes.position;
        positions.setXYZ(0, p.x, p.y, p.z);
        positions.setXYZ(1, n.x, n.y, n.z);
        positions.needsUpdate = true;

        intersection.intersects = true;

        intersects.length = 0;
      } else {
        intersection.intersects = false;
      }
    }

    function shoot() {
      position.copy(intersection.point);
      orientation.copy(mouseHelper.rotation);

      if (params.rotate) orientation.z = Math.random() * 2 * Math.PI;

      const scale = params.minScale + Math.random() * (params.maxScale - params.minScale);
      size.set(scale, scale, scale);

      const material = decalMaterial.clone();
      material.color.setHex(Math.random() * 0xffffff);

      const m = new THREE.Mesh(new DecalGeometry(self.mesh, position, orientation, size), material);
      m.renderOrder = decals.length; // give decals a fixed render order

      decals.push(m);

      self.mesh.attach(m);
    }

    function removeDecals() {
      decals.forEach(function (d) {
        self.mesh.remove(d);
      });

      decals.length = 0;
    }

    this.renderer = new THREE.WebGLRenderer({ canvas });
    if (this.retina) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    const height = window.innerHeight;
    this.renderer.setSize(window.innerWidth, height);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / height, 1, 1000);
    this.camera.position.z = 120;

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 200;

    this.light = new THREE.AmbientLight(0x666666);
    const dirLight1 = new THREE.DirectionalLight(0xffddcc, 3);
    dirLight1.position.set(1, 0.75, 0.5);

    this.scene = new THREE.Scene();

    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xccccff, 3);
    dirLight2.position.set(-1, 0.75, -0.5);
    this.scene.add(dirLight2);

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
    this.scene.add(this.line);

    const map = textureLoader.load(MapCol);
    map.colorSpace = THREE.SRGBColorSpace;
    const specularMap = textureLoader.load(MapSpec);
    const normalMap = textureLoader.load(SmoothUv);

    const loader = new GLTFLoader();
    loader.load(LeePerrySmith, function (gltf) {
      self.mesh = gltf.scene.children[0] as any;
      self.mesh.material = new THREE.MeshPhongMaterial({
        specular: 0x111111,
        map: map,
        specularMap: specularMap,
        normalMap: normalMap,
        shininess: 25,
      });

      self.scene.add(self.mesh);
      self.mesh.scale.multiplyScalar(10);
    });

    this.raycaster = new THREE.Raycaster();

    mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
    mouseHelper.visible = false;
    this.scene.add(mouseHelper);

    let moved = false;

    controls.addEventListener('change', function () {
      moved = true;
    });

    window.addEventListener('pointerdown', function () {
      moved = false;
    });

    window.addEventListener('pointerup', function (event) {
      if (moved === false) {
        checkIntersection(event.clientX, event.clientY);

        if (intersection.intersects) shoot();
      }
    });

    window.addEventListener('pointermove', onPointerMove);

    this.renderer.setAnimationLoop(this.animate.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));

    nextTick(() => {
      this.onWindowResize();
    });
  }

  public dispose(): void {
    this.stats.dom.remove();
    this.stats = null;

    this.light.dispose();
    this.renderer.dispose();

    // TODO: Do we have to remove event listeners and animation loop?
  }

  public set onresize(fn: () => void) {
    this._onresize = fn.bind(this);
  }

  private async animate() {
    this.stats.begin();
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
