import * as THREE from 'three';
import { graphicsQuality } from '../core/preferences';

/** One 128 px local probe, updated one face at a time instead of six scene renders per frame. */
export class CarReflections {
  private target?: THREE.WebGLCubeRenderTarget;
  private camera?: THREE.CubeCamera;
  private bound = new WeakSet<THREE.MeshStandardMaterial>();
  private face = 0;
  private next = 0;
  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
  ) {}
  update(car: THREE.Object3D, time: number) {
    if (graphicsQuality() === 'low') {
      if (this.target) {
        const texture = this.target.texture;
        car.traverse((o) => {
          if (o instanceof THREE.Mesh)
            for (const m of Array.isArray(o.material)
              ? o.material
              : [o.material])
              if (
                m instanceof THREE.MeshStandardMaterial &&
                m.envMap === texture
              ) {
                m.envMap = null;
                m.needsUpdate = true;
              }
        });
        this.target.dispose();
        this.target = undefined;
        this.camera = undefined;
        this.bound = new WeakSet();
      }
      this.face = 0;
      this.next = 0;
      return;
    }
    if (time < this.next) return;
    this.next = time + 0.06;
    if (!this.target) {
      this.target = new THREE.WebGLCubeRenderTarget(128, {
        type: THREE.HalfFloatType,
        generateMipmaps: false,
      });
      this.camera = new THREE.CubeCamera(0.25, 95, this.target);
      this.camera.coordinateSystem = this.renderer.coordinateSystem;
      this.camera.updateCoordinateSystem();
      for (const face of this.camera.children) face.layers.enable(3);
    }
    const camera = this.camera!,
      target = this.target,
      renderer = this.renderer;
    if (this.face === 0) {
      camera.position.copy(car.position);
      camera.position.y += 0.65;
    }
    camera.updateMatrixWorld(true);
    const previousTarget = renderer.getRenderTarget(),
      previousFace = renderer.getActiveCubeFace(),
      previousMip = renderer.getActiveMipmapLevel(),
      shadow = renderer.shadowMap.autoUpdate,
      autoClear = renderer.autoClear,
      visible = car.visible;
    car.visible = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.autoClear = true;
    try {
      renderer.setRenderTarget(target, this.face);
      renderer.render(this.scene, camera.children[this.face] as THREE.Camera);
    } finally {
      car.visible = visible;
      renderer.shadowMap.autoUpdate = shadow;
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(previousTarget, previousFace, previousMip);
    }
    this.face = (this.face + 1) % 6;
    if (this.face === 0) {
      target.texture.needsPMREMUpdate = true;
      car.traverse((o) => {
        if (o instanceof THREE.Mesh)
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            if (m instanceof THREE.MeshStandardMaterial && !this.bound.has(m)) {
              m.envMap =
                m.name === 'vehicle-paint'
                  ? this.scene.environment
                  : target.texture;
              m.needsUpdate = true;
              this.bound.add(m);
            }
      });
    }
  }
}
