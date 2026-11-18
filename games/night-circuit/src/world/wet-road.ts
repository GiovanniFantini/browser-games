import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { graphicsQuality } from '../core/preferences';
import { atlasGraph, districtIndex, roadHeight } from './atlas';

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

function streetMask() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!,
    scale = 1024 / 3200;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = '#fff';
  ctx.lineCap = ctx.lineJoin = 'round';
  const graph = atlasGraph();
  for (const edge of graph.edges) {
    ctx.lineWidth = ((edge.width ?? 24) - 1) * scale;
    ctx.beginPath();
    const path = edge.path ?? [graph.nodes[edge.a], graph.nodes[edge.b]];
    path.forEach((p, i) => {
      if (i) ctx.lineTo((p.x + 600) * scale, (p.z + 600) * scale);
      else ctx.moveTo((p.x + 600) * scale, (p.z + 600) * scale);
    });
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.flipY = false;
  map.generateMipmaps = false;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  return map;
}

/** Scene reflections are masked by generated puddles, keeping the diffuse asphalt visible. */
export class WetRoad {
  private mirror?: Reflector;
  private readonly noise = puddleMask();
  private readonly roads = streetMask();
  private readonly surfaceAnchor = new THREE.Vector3(
    Infinity,
    Infinity,
    Infinity,
  );
  private readonly surfacePoint = new THREE.Vector3();
  private readonly surfaceInverse = new THREE.Quaternion();
  private readonly anchor = new THREE.Vector3();
  private readonly frustum = new THREE.Frustum();
  private readonly projection = new THREE.Matrix4();
  private refreshCamera = false;
  private renderMirror?: (
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
  ) => void;
  constructor(
    private readonly scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
    camera.layers.enable(1);
    camera.layers.enable(2);
  }
  update(position: THREE.Vector3) {
    if (graphicsQuality() === 'low') {
      if (this.mirror) {
        this.scene.remove(this.mirror);
        this.mirror.geometry.dispose();
        this.mirror.dispose();
        this.mirror = undefined;
        this.renderMirror = undefined;
      }
      return;
    }
    // Retain the same probe when crossing the hilly district. Low quality still
    // releases its render target, as it does for the other postprocessing effects.
    if (districtIndex(position.x, position.z) === 2) {
      if (this.mirror) {
        this.mirror.visible = false;
        this.refreshCamera = true;
      }
      return;
    }
    if (!this.mirror) {
      const mirror = new Reflector(new THREE.PlaneGeometry(180, 180, 16, 16), {
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
      material.uniforms.streetMask = { value: this.roads };
      material.uniforms.anchor = { value: this.anchor };
      material.vertexShader =
        'varying vec3 vWetWorld;\n' +
        material.vertexShader.replace(
          'vUv = textureMatrix * vec4( position, 1.0 );',
          'vUv = textureMatrix * vec4( position, 1.0 );vWetWorld=(modelMatrix*vec4(position,1.)).xyz;',
        );
      material.fragmentShader =
        'varying vec3 vWetWorld;uniform sampler2D wetMask;uniform sampler2D streetMask;uniform vec3 anchor;\n' +
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
            `float road=texture2D(streetMask,(vWetWorld.xz+600.)/3200.).r;
      float puddle=smoothstep(.34,.70,texture2D(wetMask,vWetWorld.xz*.03).r);
      float fade=1.-smoothstep(55.,85.,distance(vWetWorld.xz,anchor.xz));
      gl_FragColor=vec4(base.rgb*.8,road*fade*(.10+.42*puddle));`,
          );
      material.needsUpdate = true;
      // The pinned Reflector implementation consumes only these three arguments.
      const renderReflection = mirror.onBeforeRender.bind(mirror) as (
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
      ) => void;
      this.renderMirror = (renderer, camera) => {
        const reflection = mirror.getReflectionCamera(camera);
        if (this.refreshCamera) {
          // Recreating Reflector used to capture the current FOV/aspect here.
          // Retain that view state while reusing its geometry and render target.
          reflection.projectionMatrixInverse.copy(
            camera.projectionMatrixInverse,
          );
          this.refreshCamera = false;
        }
        reflection.layers.set(0);
        renderReflection(renderer, this.scene, camera);
      };
      // The reflection is rendered explicitly before the main scene, keeping
      // Three.js at the same render-state depth for both passes.
      mirror.onBeforeRender = () => {};
      this.scene.add(mirror);
      this.mirror = mirror;
      this.surfaceAnchor.set(Infinity, Infinity, Infinity);
    }
    this.mirror.visible = true;
    this.anchor.copy(position);
    if (this.surfaceAnchor.distanceToSquared(position) > 4) {
      this.surfaceAnchor.copy(position);
      const height = roadHeight(position.x, position.z) + 0.022;
      const gx =
        (roadHeight(position.x + 1, position.z) -
          roadHeight(position.x - 1, position.z)) /
        2;
      const gz =
        (roadHeight(position.x, position.z + 1) -
          roadHeight(position.x, position.z - 1)) /
        2;
      this.mirror.position.set(position.x, height, position.z);
      this.mirror.quaternion.setFromUnitVectors(
        this.surfacePoint.set(0, 0, 1),
        new THREE.Vector3(-gx, 1, -gz).normalize(),
      );
      this.surfaceInverse.copy(this.mirror.quaternion).invert();
      const vertices = this.mirror.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute;
      for (let row = 0; row <= 16; row++)
        for (let col = 0; col <= 16; col++) {
          const x = position.x + (col / 16 - 0.5) * 180,
            z = position.z + (row / 16 - 0.5) * 180;
          this.surfacePoint
            .set(
              x - position.x,
              roadHeight(x, z) + 0.022 - height,
              z - position.z,
            )
            .applyQuaternion(this.surfaceInverse);
          vertices.setXYZ(
            row * 17 + col,
            this.surfacePoint.x,
            this.surfacePoint.y,
            this.surfacePoint.z,
          );
        }
      vertices.needsUpdate = true;
      this.mirror.geometry.computeVertexNormals();
      this.mirror.geometry.computeBoundingSphere();
    }
  }

  renderReflection(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    const mirror = this.mirror;
    if (!mirror?.visible || !this.renderMirror) return;
    camera.updateMatrixWorld();
    this.projection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(this.projection);
    if (
      !camera.layers.test(mirror.layers) ||
      !this.frustum.intersectsObject(mirror)
    )
      return;

    const shadows = renderer.shadowMap;
    const renderShadows = shadows.render;
    // Reflector normally runs after the main camera's shadow pass. Preserve
    // that exact shadow coverage and freshness when moving it before the scene.
    if (shadows.autoUpdate) shadows.needsUpdate = true;
    shadows.render = (lights, scene) => {
      renderShadows.call(shadows, lights, scene, camera);
    };
    try {
      this.renderMirror(renderer, camera);
      // Effects restores autoUpdate after the main render. Avoid drawing the
      // same shadows twice; a skipped reflection leaves needsUpdate for it.
      shadows.autoUpdate = false;
    } finally {
      shadows.render = renderShadows;
    }
  }
}
