import * as THREE from 'three';
import type { Vehicle } from './vehicle';
import { roadHeight } from '../world/atlas';
function smokeTexture() {
  const data = new Uint8Array(256 * 256 * 4),
    field = new Float32Array(32 * 32);
  let seed = 39173;
  for (let i = 0; i < field.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    field[i] = (seed >>> 0) / 4294967296;
  }
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    let fx = x - ix,
      fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const at = (a: number, b: number) =>
      field[((b + 32) % 32) * 32 + ((a + 32) % 32)];
    return (
      (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) +
      (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy
    );
  };
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const u = x / 256,
        v = y / 256,
        n = noise(u * 8, v * 8) * 0.65 + noise(u * 19, v * 19) * 0.35,
        r = Math.hypot((u - 0.5) * 2, (v - 0.5) * 2),
        distorted = r + (noise(u * 4 + 10, v * 4 + 10) - 0.5) * 0.24;
      const alpha =
          Math.exp(-r * r * 2.8) *
          Math.max(0, Math.min(1, (1 - distorted) * 5)) *
          Math.max(0, (n - 0.2) * 1.5),
        i = (y * 256 + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(alpha * 255);
    }
  const map = new THREE.DataTexture(data, 256, 256, THREE.RGBAFormat);
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}
/** Reusable soft puffs follow actual rear contacts, wheel slip and ambient light. */
export class TireSmoke {
  private readonly count = 384;
  private readonly life = new Float32Array(this.count);
  private readonly positions = new Float32Array(this.count * 3);
  private readonly motion = new Float32Array(this.count * 3);
  private readonly alpha = new Float32Array(this.count);
  private readonly size = new Float32Array(this.count);
  private readonly ground = new Float32Array(this.count);
  private readonly geometry = new THREE.BufferGeometry();
  private readonly point = new THREE.Vector3();
  private readonly material: THREE.ShaderMaterial;
  private cursor = 0;
  private emission = 0;
  private random = 8173;
  constructor(
    scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
  ) {
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute(
      'opacity',
      new THREE.BufferAttribute(this.alpha, 1),
    );
    this.geometry.setAttribute(
      'diameter',
      new THREE.BufferAttribute(this.size, 1),
    );
    this.geometry.setAttribute(
      'ground',
      new THREE.BufferAttribute(this.ground, 1),
    );
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        resolution: { value: 600 },
        puff: { value: smokeTexture() },
        tailTint: { value: new THREE.Color(0xec2540) },
      },
      vertexShader: `attribute float opacity;attribute float diameter;attribute float ground;
    varying float fade;varying float seed;varying float aboveRoad;varying float span;
    uniform float resolution;void main(){fade=opacity;seed=position.x+position.z;aboveRoad=position.y-ground;span=diameter;
    vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(diameter*resolution/max(1.,-p.z),1.,resolution*.32);}`,
      fragmentShader: `uniform sampler2D puff;uniform vec3 tailTint;varying float fade;varying float seed;varying float aboveRoad;varying float span;
    void main(){float a=seed*1.13;vec2 uv=mat2(cos(a),-sin(a),sin(a),cos(a))*(gl_PointCoord-.5)+.5;
    float density=texture2D(puff,uv).a*fade;
    float floorFade=smoothstep(-.06,.26,aboveRoad+(.5-gl_PointCoord.y)*span);
    vec3 color=mix(vec3(.19,.21,.26),vec3(.32,.35,.42),1.-gl_PointCoord.y);
    color+=tailTint*.35*exp(-span*.6);
    gl_FragColor=vec4(color,density*floorFade);}`,
    });
    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    points.name = 'wheel-slip-smoke';
    scene.add(points);
  }
  private rand() {
    this.random = (Math.imul(this.random, 1664525) + 1013904223) | 0;
    return (this.random >>> 0) / 4294967296;
  }
  update(car: Vehicle, dt: number, handbrake: boolean) {
    this.material.uniforms.resolution.value = this.renderer.domElement.height;
    const slip = Math.abs(car.slip),
      speed = Math.hypot(car.speed, car.slip),
      emitting = car.grounded >= 2 && speed > 3 && (slip > 1.8 || handbrake);
    this.material.uniforms.tailTint.value.copy(car.model.tailMaterial.color);
    const velocity = car.body.linvel();
    this.emission += emitting ? dt * (60 + Math.min(50, slip * 5)) : 0;
    while (this.emission >= 1) {
      this.emission--;
      const i = this.cursor++ % this.count,
        k = i * 3;
      const contact = car.controller.wheelContactPoint(2 + (i % 2), this.point);
      if (!contact)
        this.point
          .set(
            (i % 2 ? 1 : -1) * car.model.spec.track * 0.5,
            -0.45,
            -car.model.spec.wheelbase * 0.5,
          )
          .applyQuaternion(car.rotation)
          .add(car.position);
      const floor = roadHeight(this.point.x, this.point.z);
      this.ground[i] = floor;
      this.positions[k] = this.point.x + (this.rand() - 0.5) * 0.3;
      this.positions[k + 1] = Math.max(this.point.y, floor + 0.18);
      this.positions[k + 2] = this.point.z + (this.rand() - 0.5) * 0.3;
      this.motion[k] = velocity.x * 0.55 + (this.rand() - 0.5) * 1.3;
      this.motion[k + 1] = 1.1 + this.rand() * 0.45;
      this.motion[k + 2] = velocity.z * 0.55 + (this.rand() - 0.5) * 1.3;
      this.life[i] = 2.4;
      this.size[i] = 0.4;
      this.alpha[i] = 0;
    }
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const k = i * 3;
      for (let a = 0; a < 3; a++)
        this.positions[k + a] += this.motion[k + a] * dt;
      const age = 2.4 - this.life[i];
      this.size[i] = 0.7 + age * 1.8;
      this.alpha[i] =
        Math.min(1, age * 20) * Math.max(0, this.life[i] / 2.4) * 0.3;
    }
    for (const key of ['position', 'opacity', 'diameter', 'ground'])
      this.geometry.attributes[key].needsUpdate = true;
  }
}
