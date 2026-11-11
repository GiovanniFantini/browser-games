import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { graphicsQuality } from '../core/preferences';
import { districtIndex, roadHeight } from './atlas';

function puddleMask() {
  let seed = 59371;
  const field = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    field[i] = (seed >>> 0) / 4294967296;
  }
  const bytes = new Uint8Array(256 * 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const ix = x >> 4,
        iy = y >> 4;
      let u = (x % 16) / 16,
        v = (y % 16) / 16;
      u = u * u * (3 - 2 * u);
      v = v * v * (3 - 2 * v);
      const at = (a: number, b: number) => field[(b % 16) * 16 + (a % 16)];
      bytes[y * 256 + x] = Math.round(
        ((at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) +
          (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v) *
          255,
      );
    }
  const map = new THREE.DataTexture(bytes, 256, 256, THREE.RedFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

/** Scene reflections are masked by generated puddles, keeping the diffuse asphalt visible. */
export class WetRoad {
  private mirror?: Reflector;
  private readonly noise = puddleMask();
  private readonly anchor = new THREE.Vector3();
  constructor(
    private readonly scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
    camera.layers.enable(1);
    camera.layers.enable(2);
  }
  update(position: THREE.Vector3) {
    const low =
      graphicsQuality() === 'low' ||
      districtIndex(position.x, position.z) === 2;
    if (low) {
      if (this.mirror) {
        this.scene.remove(this.mirror);
        this.mirror.geometry.dispose();
        this.mirror.dispose();
        this.mirror = undefined;
      }
      return;
    }
    if (!this.mirror) {
      const mirror = new Reflector(new THREE.PlaneGeometry(180, 180), {
        textureWidth: 384,
        textureHeight: 256,
        clipBias: 0.002,
        multisample: 0,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.layers.set(2);
      mirror.renderOrder = -1;
      const material = mirror.material as THREE.ShaderMaterial;
      material.transparent = true;
      material.depthWrite = false;
      material.uniforms.wetMask = { value: this.noise };
      material.uniforms.anchor = { value: this.anchor };
      material.vertexShader =
        'varying vec3 vWetWorld;\n' +
        material.vertexShader.replace(
          'vUv = textureMatrix * vec4( position, 1.0 );',
          'vUv = textureMatrix * vec4( position, 1.0 );vWetWorld=(modelMatrix*vec4(position,1.)).xyz;',
        );
      material.fragmentShader =
        'varying vec3 vWetWorld;uniform sampler2D wetMask;uniform vec3 anchor;\n' +
        material.fragmentShader
          .replace(
            'vec4 base = texture2DProj( tDiffuse, vUv );',
            `vec2 uv=vUv.xy/vUv.w;
      vec4 base=texture2D(tDiffuse,uv)*.4;
      base+=texture2D(tDiffuse,uv+vec2(.0015,.006))*.15;
      base+=texture2D(tDiffuse,uv-vec2(.0015,.006))*.15;
      base+=texture2D(tDiffuse,uv+vec2(.003,.012))*.15;
      base+=texture2D(tDiffuse,uv-vec2(.003,.012))*.15;`,
          )
          .replace(
            'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
            `vec2 grid=abs(mod(vWetWorld.xz+60.,120.)-60.);
      float road=1.-smoothstep(10.8,11.8,min(grid.x,grid.y));
      float puddle=smoothstep(.34,.70,texture2D(wetMask,vWetWorld.xz*.03).r);
      float fade=1.-smoothstep(55.,85.,distance(vWetWorld.xz,anchor.xz));
      gl_FragColor=vec4(base.rgb*.8,road*fade*(.10+.42*puddle));`,
          );
      material.needsUpdate = true;
      const renderReflection = mirror.onBeforeRender.bind(mirror);
      mirror.onBeforeRender = (
        renderer,
        scene,
        camera,
        geometry,
        mat,
        group,
      ) => {
        mirror.getReflectionCamera(camera).layers.set(0);
        renderReflection(renderer, scene, camera, geometry, mat, group);
      };
      this.scene.add(mirror);
      this.mirror = mirror;
    }
    this.anchor.copy(position);
    this.mirror.position.set(
      position.x,
      roadHeight(position.x, position.z) +
        (districtIndex(position.x, position.z) === 0 ? 0.01 : 0.03),
      position.z,
    );
  }
}
