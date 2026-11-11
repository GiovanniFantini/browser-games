import { installBakedLighting } from '../gen/lighting/lightmaps';
import { installHeightFog } from './height-fog';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { preferences as p, graphicsQuality } from '../core/preferences';
export class Effects {
  private composer?: EffectComposer;
  private sizeKey = '';
  private bloom?: UnrealBloomPass;
  private radial?: ShaderPass;
  private readonly rain: THREE.LineSegments;
  private readonly rainPositions: Float32Array;
  private readonly seeds: Float32Array;
  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
  ) {
    this.rainPositions = new Float32Array(900 * 6);
    this.seeds = new Float32Array(900 * 3);
    let seed = 4187;
    for (let i = 0; i < this.seeds.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      this.seeds[i] = (seed >>> 0) / 4294967296;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.rainPositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    this.rain = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0x98c9e2,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    this.rain.frustumCulled = false;
    scene.add(this.rain);
    this.resize();
    this.refreshMaterials();
  }
  refreshMaterials() {
    installBakedLighting(this.scene);
    installHeightFog(this.scene);
  }
  private setup() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth / 2, innerHeight / 2),
      0.16,
      0.3,
      0.85,
    );
    // Bound only the bloom source, preserving HDR lighting in the base image.
    // Headlight reflections otherwise spread unbounded energy across the car.
    this.bloom.materialHighPassFilter.fragmentShader =
      this.bloom.materialHighPassFilter.fragmentShader.replace(
        'vec4 texel = texture2D( tDiffuse, vUv );',
        'vec4 texel = texture2D( tDiffuse, vUv ); texel.rgb = min(texel.rgb, vec3(1.5));',
      );
    this.composer.addPass(this.bloom);
    this.radial = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, boost: { value: 0 } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'uniform sampler2D tDiffuse;uniform float boost;varying vec2 vUv;void main(){vec2 delta=(vUv-vec2(.5))*boost*.014;vec4 c=texture2D(tDiffuse,vUv)*.4;for(int i=1;i<4;i++){c+=texture2D(tDiffuse,vUv-delta*float(i))*.2;}gl_FragColor=c;}',
    });
    this.composer.addPass(this.radial);
    this.composer.addPass(new OutputPass());
    this.resize(true);
  }
  resize(force = false) {
    const key = `${innerWidth}/${innerHeight}/${devicePixelRatio}/${graphicsQuality()}`;
    if (!force && key === this.sizeKey) return;
    this.sizeKey = key;
    if (graphicsQuality() === 'low' && this.composer) {
      for (const pass of this.composer.passes) pass.dispose();
      this.composer.dispose();
      this.composer = undefined;
      this.bloom = undefined;
      this.radial = undefined;
    }
    if (!this.composer) return;
    this.composer.setPixelRatio(
      graphicsQuality() === 'high' ? Math.min(devicePixelRatio, 1.5) : 1,
    );
    this.composer.setSize(innerWidth, innerHeight);
    const scale = graphicsQuality() === 'high' ? 0.75 : 0.5;
    this.bloom!.setSize(innerWidth * scale, innerHeight * scale);
  }
  render(x: number, y: number, z: number, time: number, boost: boolean) {
    this.rain.visible = p.rain;
    if (p.rain) {
      const count = graphicsQuality() === 'low' ? 300 : 900;
      this.rain.geometry.setDrawRange(0, count * 2);
      for (let i = 0; i < count; i++) {
        const n = i * 6,
          j = i * 3,
          px = x + (this.seeds[j] - 0.5) * 100,
          pz = z + (this.seeds[j + 1] - 0.5) * 100,
          py =
            y + ((((this.seeds[j + 2] * 40 - time * 22) % 40) + 40) % 40) - 4;
        this.rainPositions[n] = px;
        this.rainPositions[n + 1] = py;
        this.rainPositions[n + 2] = pz;
        this.rainPositions[n + 3] = px - 0.2;
        this.rainPositions[n + 4] = py - 1.5;
        this.rainPositions[n + 5] = pz + 0.3;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    if (this.scene.fog instanceof THREE.FogExp2)
      this.scene.fog.density = 0.0022 + (p.rain ? 0.0006 : 0);
    if (graphicsQuality() === 'low')
      this.renderer.render(this.scene, this.camera);
    else {
      if (!this.composer) this.setup();
      this.bloom!.enabled = p.bloom;
      this.radial!.enabled = boost;
      this.radial!.uniforms.boost.value = boost ? 1 : 0;
      this.composer!.render();
    }
  }
}
