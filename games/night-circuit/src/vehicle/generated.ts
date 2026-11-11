import * as THREE from 'three';
import {
  projectorLens,
  tyreLettering,
  factoryGraphic,
  grilleMeshTexture,
  tailClusterLens,
  headClusterLens,
} from './details';
import { roadHeight } from '../world/atlas';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { batchBodywork, panelSeamGeometry } from './bodywork';
import data from '../data/career.json';
import modelVersions from '../data/model-versions.json';
import {
  defaultAppearance,
  visualCatalog,
  type Appearance,
} from '../tuning/appearance';
import { vinylTexture } from '../tuning/vinyl';
import { installBakedLighting } from '../gen/lighting/lightmaps';
import { installHeightFog } from '../world/height-fog';
import type { StudioPose } from './model';
const templates = new Map<string, THREE.Group>();
const requests = new Map<string, Promise<void>>();
export function prepareDetailedCarModels(ids: readonly string[]) {
  return Promise.all(
    ids.map((id) => {
      if (templates.has(id)) return Promise.resolve();
      let pending = requests.get(id);
      if (!pending) {
        pending = new GLTFLoader()
          .loadAsync(
            `${import.meta.env.BASE_URL}models/${id}.glb?v=${modelVersions[id as keyof typeof modelVersions] ?? 'original'}`,
          )
          .then((gltf) => {
            gltf.scene.traverse((object) => {
              if (!(object instanceof THREE.Mesh)) return;
              const geometry: THREE.BufferGeometry = object.geometry.clone();
              const scale = object.scale.clone();
              for (const [name, attribute] of Object.entries(
                geometry.attributes,
              )) {
                const values = new Float32Array(
                  attribute.count * attribute.itemSize,
                );
                for (let i = 0; i < attribute.count; i++)
                  for (let k = 0; k < attribute.itemSize; k++) {
                    const getters = [
                      attribute.getX,
                      attribute.getY,
                      attribute.getZ,
                      attribute.getW,
                    ];
                    values[i * attribute.itemSize + k] =
                      getters[k].call(attribute, i) *
                      (name === 'position'
                        ? [scale.x, scale.y, scale.z][k]
                        : 1);
                  }
                geometry.setAttribute(
                  name,
                  new THREE.BufferAttribute(values, attribute.itemSize),
                );
              }
              if (object.name === 'scocca') {
                const spec = data.models.find((model) => model.id === id)!;
                const p = geometry.attributes.position,
                  n = geometry.attributes.normal;
                for (let i = 0; i < p.count; i++) {
                  const x = p.getX(i),
                    z = p.getZ(i),
                    nz = n.getZ(i);
                  const rear =
                    -spec.length / 2 +
                    0.22 * Math.pow(Math.abs(x) / (spec.width * 0.49), 4);
                  const front =
                    spec.length / 2 -
                    0.26 * Math.pow(x / (spec.width * 0.5), 2);
                  let slope: number | undefined;
                  let direction = 1;
                  if (Math.abs(z - rear) < 0.035 && nz < -0.65) {
                    slope =
                      (0.88 * Math.pow(x, 3)) / Math.pow(spec.width * 0.49, 4);
                    direction = -1;
                  } else if (Math.abs(z - front) < 0.035 && nz > 0.65)
                    slope = (0.52 * x) / Math.pow(spec.width * 0.5, 2);
                  if (slope !== undefined) {
                    const weight = THREE.MathUtils.smoothstep(
                      Math.abs(nz),
                      0.65,
                      0.96,
                    );
                    const target = new THREE.Vector3(
                      slope,
                      0,
                      direction,
                    ).normalize();
                    target
                      .lerp(
                        new THREE.Vector3(n.getX(i), n.getY(i), nz),
                        1 - weight,
                      )
                      .normalize();
                    n.setXYZ(i, target.x, target.y, target.z);
                  }
                }
              }
              geometry.computeBoundingBox();
              geometry.computeBoundingSphere();
              object.geometry = geometry;
              object.scale.set(1, 1, 1);
            });
            templates.set(id, gltf.scene);
          })
          .catch((error) => {
            requests.delete(id);
            throw error;
          });
        requests.set(id, pending);
      }
      return pending;
    }),
  );
}
let shadowTexture: THREE.CanvasTexture | undefined;
let glowTexture: THREE.CanvasTexture | undefined;
function contactShadow() {
  if (!shadowTexture) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 16, 64, 64, 64);
    gradient.addColorStop(0, '#000f');
    gradient.addColorStop(0.72, '#000c');
    gradient.addColorStop(1, '#0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    shadowTexture = new THREE.CanvasTexture(c);
  }
  return shadowTexture;
}
let lensTexture: THREE.CanvasTexture | undefined;
function rearLens() {
  if (!lensTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#4c4c4c');
    gradient.addColorStop(0.35, '#b0b0b0');
    gradient.addColorStop(0.65, '#7d7d7d');
    gradient.addColorStop(1, '#343434');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(8, 47, 240, 13);
    for (let x = 3; x < 256; x += 6) {
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(x, 5, 1, 118);
    }
    lensTexture = new THREE.CanvasTexture(canvas);
    lensTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return lensTexture;
}
function softGlow() {
  if (!glowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!,
      gradient = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    gradient.addColorStop(0, '#ffffffb0');
    gradient.addColorStop(0.65, '#ffffff55');
    gradient.addColorStop(1, '#ffffff00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(canvas);
  }
  return glowTexture;
}
export function createDetailedCar(
  options: {
    color?: string;
    simple?: boolean;
    appearance?: Appearance;
    model?: string;
  } = {},
) {
  const spec =
      data.models.find((m) => m.id === options.model) ?? data.models[0],
    template = templates.get(spec.id);
  if (!template) return undefined;
  const a = options.appearance ?? defaultAppearance(),
    simple = !!options.simple;
  const root = template.clone(true);
  root.name = 'vehicle-' + spec.id;
  root.userData.dynamicVehicle = true;
  root.userData.assetSource = `${import.meta.env.BASE_URL}models/${spec.id}.glb`;
  const ownedGeometry = new Set<THREE.BufferGeometry>(),
    ownedMaterial = new Set<THREE.Material>(),
    textures: THREE.Texture[] = [];
  const finish = visualCatalog.slots.finish.options[a.parts.finish];
  const paint = new THREE.MeshPhysicalMaterial({
    color: options.color ?? a.paint,
    // A restrained console-style fill keeps the body readable between street lamps.
    emissive: options.color ?? a.paint,
    emissiveIntensity: 0.012,
    metalness: finish.metalness,
    roughness:
      finish.roughness > 0.5
        ? finish.roughness
        : Math.max(0.12, finish.roughness * 0.65),
    clearcoat: finish.clearcoat * 0.95,
    clearcoatRoughness: 0.025,
    specularIntensity: 0.7,
    envMapIntensity: 0.65,
  });
  paint.name = 'vehicle-paint';
  ownedMaterial.add(paint);
  paint.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
      #ifdef USE_FOG
      reflectedLight.indirectDiffuse *= 0.3;
      vec3 paintTint = normalize(diffuseColor.rgb + vec3(.005));
      reflectedLight.indirectSpecular *= mix(vec3(1.0), paintTint, .35);
      vec3 worldNormal = inverseTransformDirection(geometryNormal, viewMatrix);
      float bodyFill = .2 + .8 * pow(max(dot(worldNormal, normalize(vec3(-.4,.5,-.5))), 0.0), 2.0);
      reflectedLight.indirectDiffuse += diffuseColor.rgb * .15 * bodyFill;
      #ifdef USE_CLEARCOAT
      clearcoatSpecularIndirect *= mix(vec3(1.0), paintTint, .25) * .7;
      #endif
      // Authored horizon banks retain directional gloss between street lights.
      vec3 cityRay = inverseTransformDirection(reflect(-geometryViewDir, geometryNormal), viewMatrix);
      float horizonBank = exp(-pow((cityRay.y - .16) / .045, 2.0));
      float bankAngle = atan(cityRay.x, cityRay.z);
      horizonBank *= .22 + .78 * pow(abs(cos(bankAngle * 2.0 + .8)), 12.0);
      float grazingCoat = pow(1.0 - max(dot(geometryNormal, geometryViewDir), 0.0), 2.0);
      reflectedLight.indirectSpecular += vec3(.28,.40,.48) * horizonBank * grazingCoat * (1.0 - smoothstep(.3,.75,roughnessFactor));
      reflectedLight.indirectSpecular = min(reflectedLight.indirectSpecular, vec3(.8));
      #ifdef USE_CLEARCOAT
      clearcoatSpecularIndirect = min(clearcoatSpecularIndirect, vec3(.8));
      #endif
      #endif`,
      )
      .replace(
        '#include <opaque_fragment>',
        `
      #ifdef USE_FOG
      outgoingLight *= min(1.0, 1.0 / max(.001, max(outgoingLight.r, max(outgoingLight.g, outgoingLight.b))));
      #endif
      #include <opaque_fragment>`,
      );
  };
  paint.customProgramCacheKey = () => 'car-coat-physical-10';
  if ('shift' in finish) {
    const priorPaint = paint.onBeforeCompile;
    paint.onBeforeCompile = (shader, renderer) => {
      priorPaint(shader, renderer);
      shader.uniforms.shiftColor = { value: new THREE.Color(a.secondary) };
      shader.fragmentShader =
        'uniform vec3 shiftColor;\n' +
        shader.fragmentShader.replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\ndiffuseColor.rgb=mix(diffuseColor.rgb,shiftColor,pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.0)*${(finish.shift ?? 0).toFixed(2)});`,
        );
    };
    paint.customProgramCacheKey = () =>
      `generated-angle-paint-coat-3-${a.parts.finish}`;
  }
  const tailMaterial = new THREE.MeshBasicMaterial({ color: a.tailColor });
  ownedMaterial.add(tailMaterial);
  const rearLensMaterial = new THREE.MeshPhysicalMaterial({
    color: a.tailColor,
    emissive: a.tailColor,
    emissiveIntensity: 3.5,
    map: rearLens(),
    emissiveMap: rearLens(),
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.15,
  });
  ownedMaterial.add(rearLensMaterial);
  const headMaterial = new THREE.MeshPhysicalMaterial({
    color: a.headColor,
    emissive: a.headColor,
    emissiveIntensity: 3.2,
    map: projectorLens(),
    emissiveMap: projectorLens(),
    roughness: 0.24,
    clearcoat: 1,
  });
  ownedMaterial.add(headMaterial);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: a.rims,
    metalness: 0.85,
    roughness: 0.22,
  });
  ownedMaterial.add(rimMaterial);
  const exhaustMaterial = new THREE.MeshStandardMaterial({
    color: 0x88929a,
    metalness: 0.65,
    roughness: 0.4,
    envMapIntensity: 0.45,
    emissive: 0x6a7b88,
    emissiveIntensity: 0.02,
  });
  ownedMaterial.add(exhaustMaterial);
  const exhaustInnerMaterial = new THREE.MeshStandardMaterial({
    color: 0x020304,
    roughness: 1,
  });
  ownedMaterial.add(exhaustInnerMaterial);
  const grilleMaterial = new THREE.MeshStandardMaterial({
    map: grilleMeshTexture(),
    roughness: 0.5,
    metalness: 0.55,
  });
  ownedMaterial.add(grilleMaterial);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x090f16).multiplyScalar(1 - a.tint * 0.55),
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 0.25,
    transparent: true,
    opacity: 0.95 + a.tint * 0.05,
    envMapIntensity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ownedMaterial.add(glassMaterial);
  glassMaterial.name = 'vehicle-glass';
  const otherMaterials = new Map<THREE.Material, THREE.Material>();
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 256;
  plateCanvas.height = 128;
  const plateContext = plateCanvas.getContext('2d')!;
  plateContext.fillStyle = '#d6d7c8';
  plateContext.fillRect(0, 0, 256, 128);
  plateContext.strokeStyle = '#63716c';
  plateContext.lineWidth = 5;
  plateContext.strokeRect(4, 4, 248, 120);
  plateContext.textAlign = 'center';
  plateContext.fillStyle = '#263b3c';
  plateContext.font = '600 17px "Circuit Grid"';
  plateContext.fillText('PORT RIDERS', 128, 27);
  const plateId =
    ([...spec.id].reduce((value, char) => value + char.charCodeAt(0) * 17, 0) %
      900) +
    100;
  plateContext.font = '700 50px "Circuit Grid"';
  plateContext.fillText(`${spec.badge} ${plateId}`, 128, 91);
  const plateMap = new THREE.CanvasTexture(plateCanvas);
  plateMap.colorSpace = THREE.SRGBColorSpace;
  textures.push(plateMap);
  const plateMaterial = new THREE.MeshStandardMaterial({
    map: plateMap,
    roughness: 0.65,
  });
  ownedMaterial.add(plateMaterial);
  let triangles = 0;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry = o.geometry.clone();
    ownedGeometry.add(o.geometry);
    triangles +=
      (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    const source: THREE.Material = Array.isArray(o.material)
      ? o.material[0]
      : o.material;
    const role = String(o.userData.role ?? o.name);
    if (role.startsWith('faro') || role.startsWith('cornice_faro')) {
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        p.setY(
          i,
          -0.11 +
            (p.getY(i) + 0.11) * (role.startsWith('cornice') ? 0.7 : 0.8) +
            0.07,
        );
      o.geometry.computeVertexNormals();
      o.geometry.computeBoundingBox();
      o.geometry.computeBoundingSphere();
    }
    if (role.startsWith('fanale')) {
      o.geometry.computeBoundingBox();
      const center = o.geometry.boundingBox!.getCenter(new THREE.Vector3());
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        p.setXYZ(
          i,
          center.x + (p.getX(i) - center.x) * 0.9,
          center.y + (p.getY(i) - center.y) * 0.9,
          center.z + (p.getZ(i) - center.z) * 0.2 + 0.012,
        );
      o.geometry.computeVertexNormals();
      o.geometry.computeBoundingBox();
      o.geometry.computeBoundingSphere();
    }
    if (role === 'tail_core') o.position.z += 0.035;
    if (
      role.startsWith('fanale') ||
      role.startsWith('faro') ||
      role === 'targa' ||
      role === 'griglia'
    ) {
      o.geometry.computeBoundingBox();
      const bounds = o.geometry.boundingBox!;
      const positions = o.geometry.attributes.position,
        uv = new Float32Array(positions.count * 2);
      for (let i = 0; i < positions.count; i++) {
        const u =
          (positions.getX(i) - bounds.min.x) /
          Math.max(0.001, bounds.max.x - bounds.min.x);
        uv[i * 2] = role.startsWith('faro') ? u : 1 - u;
        uv[i * 2 + 1] =
          (positions.getY(i) - bounds.min.y) /
          Math.max(0.001, bounds.max.y - bounds.min.y);
      }
      o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    const ao =
      source instanceof THREE.MeshStandardMaterial ? source.aoMap : null;
    if (role === 'targa') o.material = plateMaterial;
    else if (role === 'griglia') o.material = grilleMaterial;
    else if (role.startsWith('cristallo')) o.material = glassMaterial;
    else if (role.startsWith('fanale')) o.material = rearLensMaterial;
    else if (role.startsWith('faro')) o.material = headMaterial;
    else if (role.startsWith('scarico_interno'))
      o.material = exhaustInnerMaterial;
    else if (role.startsWith('scarico')) o.material = exhaustMaterial;
    else if (role === 'cerchio' || role === 'spoke' || role === 'hub')
      o.material = rimMaterial;
    else if (
      source.name.startsWith('paint') ||
      (source.name.startsWith('part_') && !source.name.includes('cristallo'))
    ) {
      o.material = paint;
      if (ao && !paint.aoMap) {
        paint.aoMap = ao;
        paint.aoMapIntensity = 0.35;
      }
    } else {
      let copy = otherMaterials.get(source);
      if (!copy) {
        copy = source.clone();
        otherMaterials.set(source, copy);
        ownedMaterial.add(copy);
      }
      o.material = copy;
    }
    o.castShadow = o.receiveShadow = true;
  });
  root.userData.triangles = triangles;
  const lampWellMaterial = new THREE.MeshStandardMaterial({
    color: 0x070c10,
    roughness: 0.65,
    metalness: 0.05,
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  });
  ownedMaterial.add(lampWellMaterial);
  const lampCoverMaterial = new THREE.MeshPhysicalMaterial({
    color: a.tailColor,
    map: tailClusterLens(),
    emissive: a.tailColor,
    emissiveMap: tailClusterLens(),
    emissiveIntensity: 1.8,
    roughness: 0.22,
    clearcoat: 0.3,
    depthWrite: true,
    envMapIntensity: 0.2,
  });
  ownedMaterial.add(lampCoverMaterial);
  lampCoverMaterial.name = 'rear-lens-cover';
  const rearWidth = spec.width * spec.design.rearTaper * 0.98;
  for (const side of [-1, 1]) {
    const cx = side * rearWidth * 0.32,
      half = rearWidth * 0.095 + 0.088;
    const vertices: number[] = [],
      indices: number[] = [];
    const point = (x: number, y: number) =>
      vertices.push(
        x,
        y,
        -spec.length * 0.5 +
          0.22 * Math.pow(Math.abs(x) / (spec.width * 0.49), 4) -
          0.007,
      );
    point(cx, 0.025);
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      point(cx + Math.cos(a) * half, 0.025 + Math.sin(a) * 0.076);
      if (i > 0) indices.push(0, i + 1, i);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const well = new THREE.Mesh(geometry, lampWellMaterial);
    well.name = 'tail-recess-' + side;
    root.add(well);
    ownedGeometry.add(geometry);
    const coverGeometry = geometry.clone();
    coverGeometry.translate(0, 0, -0.013);
    const coverPosition = coverGeometry.attributes.position,
      coverUv = new Float32Array(coverPosition.count * 2);
    for (let i = 0; i < coverPosition.count; i++) {
      coverUv[i * 2] = (coverPosition.getX(i) - cx) / (half * 2) + 0.5;
      coverUv[i * 2 + 1] = (coverPosition.getY(i) - 0.025) / 0.152 + 0.5;
    }
    coverGeometry.setAttribute('uv', new THREE.BufferAttribute(coverUv, 2));
    const cover = new THREE.Mesh(coverGeometry, lampCoverMaterial);
    cover.name = 'tail-cover-' + side;
    root.add(cover);
    ownedGeometry.add(coverGeometry);
  }
  // Distinct named geometry is retained for every tuning attachment.
  const byName = (name: string) => root.getObjectByName(name);
  const frontLensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd1e0e8,
    map: headClusterLens(),
    emissive: a.headColor,
    emissiveMap: headClusterLens(),
    emissiveIntensity: 0.85,
    metalness: 0.18,
    roughness: 0.19,
    clearcoat: 0.6,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
  });
  ownedMaterial.add(frontLensMaterial);
  const frontOutline = [
    [0, 0.05],
    [0.65, 0.08],
    [1, 0.045],
    [0.94, -0.045],
    [0.28, -0.065],
    [0, -0.045],
  ];
  for (const side of [-1, 1]) {
    const vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (const [t, dy] of [[0.5, 0], ...frontOutline]) {
      const x = side * spec.width * (0.16 + t * 0.27),
        y = -0.04 + dy * 0.7;
      vertices.push(
        x,
        y,
        spec.length * 0.5 -
          0.26 * Math.pow(Math.abs(x) / (spec.width * 0.5), 2) +
          0.045,
      );
      uv.push(t, (dy + 0.065) / 0.145);
    }
    for (let i = 0; i < frontOutline.length; i++)
      indices.push(0, i + 1, ((i + 1) % frontOutline.length) + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const lens = new THREE.Mesh(geometry, frontLensMaterial);
    lens.name = 'front-lens-' + side;
    lens.visible = a.parts.lights < 2;
    root.add(lens);
    ownedGeometry.add(geometry);
  }
  const splitter = byName('splitter_ant');
  if (splitter instanceof THREE.Mesh) {
    splitter.material = lampWellMaterial;
    splitter.position.y -= 0.018;
  }
  const slatVertices: number[] = [],
    slatIndices: number[] = [];
  for (let row = 0; row < 3; row++)
    for (let j = 0; j <= 12; j++) {
      for (const edge of [-1, 1]) {
        const y = -0.278 - row * 0.056 + edge * 0.006,
          v = (y + 0.34) / 0.18;
        const x = ((j / 12) * 2 - 1) * spec.width * 0.274,
          t = x / (spec.width * 0.48 * (1 - 0.06 * v * v));
        slatVertices.push(
          x,
          y,
          spec.length * 0.475 + 0.14 - 0.24 * t * t - 0.06 * v * v,
        );
      }
      if (j < 12) {
        const a = row * 26 + j * 2;
        slatIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
  const slatGeometry = new THREE.BufferGeometry();
  slatGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(slatVertices, 3),
  );
  slatGeometry.setIndex(slatIndices);
  slatGeometry.computeVertexNormals();
  const slatMaterial = new THREE.MeshStandardMaterial({
    color: 0x52616b,
    metalness: 0.4,
    roughness: 0.5,
  });
  const slats = new THREE.Mesh(slatGeometry, slatMaterial);
  root.add(slats);
  ownedGeometry.add(slatGeometry);
  ownedMaterial.add(slatMaterial);
  if (!simple) {
    const seamMaterial = new THREE.LineBasicMaterial({
      color: 0x061019,
      transparent: true,
      opacity: 0.65,
    });
    ownedMaterial.add(seamMaterial);
    for (const name of ['cofano', 'porta_sx', 'porta_dx', 'portellone']) {
      const base = byName(name);
      if (!(base instanceof THREE.Mesh)) continue;
      const geometry = panelSeamGeometry(base);
      const seam = new THREE.LineSegments(geometry, seamMaterial);
      seam.name = 'panel-gap';
      base.add(seam);
      ownedGeometry.add(geometry);
    }
  }
  const pivot = (name: string, pos: THREE.Vector3) => {
    const object = byName(name),
      group = new THREE.Group();
    group.name = name + '-pivot';
    group.position.copy(pos);
    root.add(group);
    if (object) {
      object.position.sub(pos);
      group.add(object);
    }
    return group;
  };
  const hood = pivot('cofano', new THREE.Vector3(0, 0.2, spec.length * 0.16));
  const hatch = pivot(
    'portellone',
    new THREE.Vector3(0, 0.5, -spec.length * 0.33),
  );
  const doors = [
    pivot(
      'porta_sx',
      new THREE.Vector3(-spec.width * 0.45, 0.04, spec.length * 0.13),
    ),
    pivot(
      'porta_dx',
      new THREE.Vector3(spec.width * 0.45, 0.04, spec.length * 0.13),
    ),
  ];
  const roof = byName('tetto');
  if (roof) roof.name = 'roof-surface';
  const windshield = byName('cristallo_ant');
  if (windshield) windshield.name = 'front-glazing';
  const rearGlass = byName('cristallo_post');
  if (rearGlass) rearGlass.name = 'rear-glazing';
  const attach = (object: THREE.Object3D | undefined, group: THREE.Group) => {
    if (object) {
      object.position.sub(group.position);
      group.add(object);
    }
  };
  attach(rearGlass, hatch);
  attach(byName('guarnizione_cristallo_post'), hatch);
  if (rearGlass instanceof THREE.Mesh && !simple) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#09152299';
    ctx.fillRect(0, 0, 512, 64);
    ctx.font = '700 39px "Circuit Grid"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d9e2e6';
    ctx.fillText(
      (
        data.makers.find((m) => m.id === spec.maker)?.name ?? spec.badge
      ).toUpperCase(),
      256,
      45,
      475,
    );
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    const m = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
    });
    ownedMaterial.add(m);
    const box = new THREE.Box3().setFromBufferAttribute(
      rearGlass.geometry.attributes.position as THREE.BufferAttribute,
    );
    const geo = new THREE.PlaneGeometry((box.max.x - box.min.x) * 0.8, 0.09);
    ownedGeometry.add(geo);
    const banner = new THREE.Mesh(geo, m);
    banner.position.set(0, box.max.y - 0.05, box.max.z - 0.08);
    banner.lookAt(
      banner.position
        .clone()
        .add(
          new THREE.Vector3(0, box.max.z - box.min.z, -(box.max.y - box.min.y)),
        ),
    );
    rearGlass.add(banner);
  }
  for (let i = 0; i < 2; i++) {
    const side = i ? 'dx' : 'sx';
    attach(byName('cristallo_' + side), doors[i]);
    attach(byName('guarnizione_cristallo_' + side), doors[i]);
    attach(byName('specchietto_' + side), doors[i]);
    attach(byName('specchio_' + side), doors[i]);
    attach(byName('maniglia_' + side), doors[i]);
  }
  if (roof instanceof THREE.Mesh && a.parts.roof === 1)
    roof.material = glassMaterial;
  const engineParts: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name === 'motore' || o.name.startsWith('collettore_'))
      engineParts.push(o);
  });
  const engineRoot = new THREE.Group();
  engineRoot.name = 'engine-pivot';
  root.add(engineRoot);
  engineParts.forEach((object) => engineRoot.add(object));
  engineRoot.visible = false;
  const audio = byName('audio_bagagliaio');
  if (audio) audio.visible = a.parts.audio > 0;
  const kit = visualCatalog.slots.kit.options[a.parts.kit];
  for (const name of [
    'paraurti_ant',
    'paraurti_post',
    'minigonna_sx',
    'minigonna_dx',
  ]) {
    const part = byName(name);
    if (!part) continue;
    const slot =
      name === 'paraurti_ant'
        ? 'front'
        : name === 'paraurti_post'
          ? 'rear'
          : 'skirts';
    part.scale.x *= kit.width;
    part.scale.y *= 1 + a.parts[slot] * 0.13;
    part.scale.z *= 1 + a.parts[slot] * 0.08;
    if (a.parts.kit) part.position.y -= 0.025 * a.parts.kit;
    if (part instanceof THREE.Mesh && (a.parts[slot] > 0 || a.parts.kit > 0)) {
      const position = part.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const nx = position.getX(i) / (spec.width / 2),
          low = position.getY(i) < 0 ? 1 : 0;
        position.setY(
          i,
          position.getY(i) -
            low * 0.035 * (a.parts[slot] + a.parts.kit * 0.3) * (1 - nx * nx),
        );
        position.setZ(
          i,
          position.getZ(i) +
            Math.abs(nx) *
              0.025 *
              a.parts[slot] *
              (name === 'paraurti_post' ? -1 : 1),
        );
      }
      position.needsUpdate = true;
      part.geometry.computeVertexNormals();
      part.geometry.computeBoundingBox();
      part.geometry.computeBoundingSphere();
    }
  }
  for (const name of [
    'scarico_sx',
    'scarico_dx',
    'scarico_interno_sx',
    'scarico_interno_dx',
  ]) {
    const part = byName(name);
    if (part) {
      if (part instanceof THREE.Mesh) {
        const side = name.endsWith('sx') ? -1 : 1;
        const inner = name.startsWith('scarico_interno');
        const geometry = inner
          ? new THREE.CircleGeometry(0.05, 16).rotateY(Math.PI)
          : new THREE.LatheGeometry(
              [
                new THREE.Vector2(0.067, 0.06),
                new THREE.Vector2(0.067, -0.065),
                new THREE.Vector2(0.049, -0.065),
                new THREE.Vector2(0.049, 0.06),
                new THREE.Vector2(0.067, 0.06),
              ],
              16,
            ).rotateX(Math.PI / 2);
        part.geometry = geometry;
        ownedGeometry.add(geometry);
        part.quaternion.identity();
        part.position.set(
          side * spec.width * 0.27,
          -0.45,
          -spec.length * 0.5 + (inner ? -0.034 : 0.005),
        );
        part.scale.setScalar(1);
      }
      part.scale.multiplyScalar(1 + a.parts.exhaust * 0.1);
    }
  }
  const spoiler = byName('spoiler');
  for (const name of [
    'serie_spoiler',
    'serie_supporto_-1',
    'serie_supporto_1',
  ]) {
    const part = byName(name);
    if (part) {
      part.visible = a.parts.spoiler === 0;
      if (name.startsWith('serie_supporto')) part.scale.x *= 1.6;
    }
  }
  if (spoiler) {
    spoiler.visible = a.parts.spoiler > 0;
    for (const name of ['spoiler_mount_sx', 'spoiler_mount_dx']) {
      const mount = byName(name);
      if (mount) mount.visible = spoiler.visible;
    }
    spoiler.position.y += a.parts.spoiler * 0.055;
    spoiler.scale.x = 1 + a.parts.spoiler * 0.07;
  }
  if (a.parts.hood === 2 || a.parts.roof === 2) {
    const carbon = paint.clone();
    carbon.color.set(0x27312f);
    carbon.emissive.set(0x1d2725);
    carbon.metalness = 0.25;
    carbon.roughness = 0.45;
    ownedMaterial.add(carbon);
    if (a.parts.hood === 2)
      hood.traverse((o) => {
        if (o instanceof THREE.Mesh) o.material = carbon;
      });
    if (a.parts.roof === 2 && roof instanceof THREE.Mesh)
      roof.material = carbon;
  }
  for (const side of [-1, 1]) {
    const part = byName('specchietto_' + (side < 0 ? 'sx' : 'dx'));
    if (part) part.scale.setScalar(1 + a.parts.mirrors * 0.1);
  }
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x172329,
    roughness: 0.7,
  });
  ownedMaterial.add(trimMaterial);
  const addPart = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    parent: THREE.Object3D = root,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    ownedGeometry.add(geometry);
    return mesh;
  };
  const lightHalos: THREE.Sprite[] = [];
  const diffuser = byName('diffusore');
  if (diffuser) {
    diffuser.position.y = -0.45;
    diffuser.position.z = -spec.length * 0.502;
    diffuser.scale.y *= 1.65;
    diffuser.scale.z *= 0.7;
  }
  root.traverse((o) => {
    if (o.name.startsWith('aletta_diffusore')) {
      o.scale.z *= 0.45;
      o.position.z = -spec.length * 0.5 - 0.01;
    }
  });
  const rearReflections: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    for (const rear of [true, false]) {
      const haloMaterial = new THREE.SpriteMaterial({
        map: softGlow(),
        color: rear ? a.tailColor : a.headColor,
        transparent: true,
        opacity: rear ? 0.25 : 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      ownedMaterial.add(haloMaterial);
      const halo = new THREE.Sprite(haloMaterial);
      halo.position.set(
        side * spec.width * 0.3,
        rear ? 0.02 : -0.115,
        (rear ? -1 : 1) * spec.length * 0.53,
      );
      halo.scale.set(rear ? 0.55 : 0.3, rear ? 0.27 : 0.22, 1);
      const haloPosition = new THREE.Vector3(),
        view = new THREE.Vector3(),
        direction = new THREE.Vector3(),
        orientation = new THREE.Quaternion();
      halo.userData.strength = rear ? 0.25 : 0.18;
      halo.onBeforeRender = (_r, _s, camera) => {
        root.getWorldQuaternion(orientation);
        halo.getWorldPosition(haloPosition);
        camera.getWorldPosition(view);
        direction.set(0, 0, rear ? -1 : 1).applyQuaternion(orientation);
        haloMaterial.opacity =
          halo.userData.strength *
          Math.max(0, view.sub(haloPosition).normalize().dot(direction));
      };
      root.add(halo);
      if (rear) lightHalos.push(halo);
    }
  }
  if (a.parts.hood === 1)
    for (const side of [-1, 1])
      for (let n = 0; n < 3; n++)
        addPart(
          new THREE.BoxGeometry(0.035, 0.025, 0.35),
          trimMaterial,
          new THREE.Vector3(
            side * (0.28 + n * 0.07),
            -0.045,
            spec.length * 0.16,
          ),
          hood,
        );
  if (a.parts.fuel > 0) {
    const cap = addPart(
      new THREE.CylinderGeometry(0.075, 0.075, 0.018, 12),
      a.parts.fuel === 2 ? paint : rimMaterial,
      new THREE.Vector3(-spec.width * 0.51, 0.06, -spec.length * 0.25),
    );
    cap.rotation.z = Math.PI / 2;
  }
  if (a.parts.lights > 0)
    for (const side of [-1, 1]) {
      if (a.parts.lights === 1)
        for (let n = 0; n < 3; n++)
          addPart(
            new THREE.BoxGeometry(0.025, 0.105, 0.025),
            trimMaterial,
            new THREE.Vector3(
              side * spec.width * 0.3 + (n - 1) * 0.11,
              -0.115,
              spec.length * 0.502,
            ),
          );
      else {
        const original = byName('faro_' + (side < 0 ? 'sx' : 'dx'));
        if (original) original.visible = false;
        for (let n = 0; n < 2; n++) {
          const lens = addPart(
            new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12),
            headMaterial,
            new THREE.Vector3(
              side * spec.width * 0.3 + (n - 0.5) * 0.18,
              -0.115,
              spec.length * 0.501,
            ),
          );
          lens.rotation.x = Math.PI / 2;
        }
      }
    }
  for (const name of ['scarico_dx', 'scarico_interno_dx']) {
    const part = byName(name);
    if (part)
      part.visible =
        a.parts.exhaust > 0 ||
        ['compact', 'coupe', 'super'].includes(spec.family);
  }
  if (a.parts.exhaust === 2)
    for (const side of [-1, 1]) {
      const pipe = addPart(
        new THREE.CylinderGeometry(0.055, 0.055, 0.2, 12),
        rimMaterial,
        new THREE.Vector3(side * spec.width * 0.23, -0.46, -spec.length * 0.52),
      );
      pipe.rotation.x = Math.PI / 2;
    }
  if (a.parts.audio > 0)
    for (let n = 0; n < (a.parts.audio === 2 ? 4 : 2); n++) {
      addPart(
        new THREE.CylinderGeometry(0.12, 0.12, 0.045, 16),
        trimMaterial,
        new THREE.Vector3(
          (n - (a.parts.audio === 2 ? 1.5 : 0.5)) * 0.3,
          0.065,
          -spec.length * 0.35,
        ),
      );
    }
  const wheels: THREE.Group[] = [];
  const spinners: THREE.Group[] = [],
    calipers: THREE.Group[] = [];
  for (const name of [
    'ruota_ant_sx',
    'ruota_ant_dx',
    'ruota_post_sx',
    'ruota_post_dx',
  ]) {
    const wheel = byName(name) as THREE.Group;
    wheels.push(wheel);
    const i = wheels.length - 1,
      side = i % 2 ? 1 : -1;
    const tyreMat = new THREE.MeshBasicMaterial({
      map: tyreLettering(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    ownedMaterial.add(tyreMat);
    const sidewall = addPart(
      new THREE.PlaneGeometry(0.69, 0.69),
      tyreMat,
      new THREE.Vector3(side * 0.127, 0, 0),
      wheel,
    );
    sidewall.rotation.y = (side * Math.PI) / 2;
    wheel.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.role === 'cerchio')
        o.scale.set(1, a.diameter / 17, a.diameter / 17);
    });
    if (a.wheel !== 0) {
      for (const child of [...wheel.children])
        if (
          child instanceof THREE.Mesh &&
          ['cerchio', 'spoke', 'hub'].includes(String(child.userData.role))
        )
          wheel.remove(child);
      const definition = visualCatalog.wheels[a.wheel],
        radius = 0.205 + (a.diameter - 17) * 0.011;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.019, 4, 20),
        rimMaterial,
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.x = side * 0.135;
      wheel.add(ring);
      ownedGeometry.add(ring.geometry);
      const count = definition.spokes * (definition.double ? 2 : 1),
        geometry = new THREE.BoxGeometry(0.21, 0.026, radius * 0.84);
      const spokes = new THREE.InstancedMesh(geometry, rimMaterial, count),
        dummy = new THREE.Object3D();
      for (let n = 0; n < count; n++) {
        const angle =
          ((definition.double ? Math.floor(n / 2) : n) / definition.spokes) *
            Math.PI *
            2 +
          (definition.double && n % 2 ? 0.1 : 0);
        dummy.position.set(
          0,
          Math.sin(angle) * radius * 0.5,
          Math.cos(angle) * radius * 0.5,
        );
        dummy.rotation.x = -angle + definition.twist;
        dummy.updateMatrix();
        spokes.setMatrixAt(n, dummy.matrix);
      }
      wheel.add(spokes);
      ownedGeometry.add(geometry);
    }
    const brake = new THREE.Group();
    brake.name = 'brake-carrier';
    wheel.add(brake);
    calipers.push(brake);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: a.calipers,
      roughness: 0.4,
      metalness: 0.5,
    });
    ownedMaterial.add(caliperMat);
    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.11, 0.07),
      caliperMat,
    );
    caliper.position.set(side * 0.09, 0.12, 0);
    brake.add(caliper);
    ownedGeometry.add(caliper.geometry);
    const spinner = new THREE.Group();
    wheel.add(spinner);
    spinners.push(spinner);
    spinner.visible = a.spinner;
    for (let j = 0; j < 3; j++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.035, 0.34),
        rimMaterial,
      );
      blade.position.x = side * 0.155;
      blade.rotation.x = (j * Math.PI) / 3;
      spinner.add(blade);
      ownedGeometry.add(blade.geometry);
    }
    wheel.traverse((o) => {
      if (o instanceof THREE.Mesh && o.parent === wheel) o.name = '';
    });
    batchBodywork(wheel);
  }
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.7, 8),
    new THREE.MeshBasicMaterial({ color: 0x86dbea }),
  );
  flame.name = 'nitro-flame';
  flame.rotation.x = -Math.PI / 2;
  flame.position.set(-spec.width * 0.27, -0.45, -spec.length * 0.6);
  flame.visible = false;
  root.add(flame);
  ownedGeometry.add(flame.geometry);
  ownedMaterial.add(flame.material);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.2, spec.length * 1.06),
    new THREE.MeshBasicMaterial({
      map: contactShadow(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.7;
  root.add(shadow);
  ownedGeometry.add(shadow.geometry);
  ownedMaterial.add(shadow.material);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: a.neonColor,
    map: softGlow(),
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ownedMaterial.add(glowMaterial);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.7, spec.length * 1.15),
    glowMaterial,
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.67;
  glow.visible = a.parts.neon > 0;
  root.add(glow);
  ownedGeometry.add(glow.geometry);
  for (const side of ['left', 'right', 'hood', 'roof'] as const) {
    const factory =
      !simple &&
      spec.id === 'silex-c1' &&
      !a.vinyls.length &&
      (side === 'left' || side === 'right');
    const texture = factory ? factoryGraphic() : vinylTexture(a.vinyls, side);
    if (!texture) continue;
    if (!factory) textures.push(texture);
    const names =
      side === 'left'
        ? ['porta_sx']
        : side === 'right'
          ? ['porta_dx']
          : side === 'hood'
            ? ['cofano']
            : ['roof-surface'];
    for (const name of names) {
      const base = byName(name);
      if (!(base instanceof THREE.Mesh)) continue;
      const geometry = base.geometry.clone(),
        position = geometry.attributes.position,
        uv = new Float32Array(position.count * 2);
      for (let i = 0; i < position.count; i++) {
        uv[i * 2] =
          side === 'left' || side === 'right'
            ? position.getZ(i) / spec.length + 0.5
            : position.getX(i) / spec.width + 0.5;
        uv[i * 2 + 1] =
          side === 'left' || side === 'right'
            ? (position.getY(i) + 0.53) / 0.8
            : position.getZ(i) / spec.length + 0.5;
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const m = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: paint.roughness,
        metalness: paint.metalness,
        clearcoat: paint.clearcoat,
        clearcoatRoughness: paint.clearcoatRoughness,
        envMapIntensity: paint.envMapIntensity,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        side: THREE.DoubleSide,
      });
      m.name = 'vehicle-paint';
      if (factory) {
        m.onBeforeCompile = paint.onBeforeCompile;
        m.customProgramCacheKey = paint.customProgramCacheKey;
      }
      const decal = new THREE.Mesh(geometry, m);
      decal.position.copy(base.position);
      decal.quaternion.copy(base.quaternion);
      decal.scale.copy(base.scale);
      base.parent!.add(decal);
      ownedGeometry.add(geometry);
      ownedMaterial.add(m);
    }
  }
  if (!simple)
    for (const x of [-0.57, 0.57]) {
      const light = new THREE.SpotLight(a.headColor, 50, 55, 0.44, 0.75, 1.5);
      light.position.set(x, -0.02, spec.length * 0.47);
      light.target.position.set(x * 1.5, -0.9, 20);
      root.add(light, light.target);
    }
  const attachments = new Set([
    'scocca',
    'paraurti_ant',
    'paraurti_post',
    'minigonna_sx',
    'minigonna_dx',
    'roof-surface',
    'front-glazing',
    'rear-glazing',
    'scarico_sx',
    'scarico_dx',
  ]);
  root.traverse((o) => {
    if (
      o instanceof THREE.Mesh &&
      !wheels.some((w) => o.parent === w) &&
      (simple || !attachments.has(o.name))
    )
      o.name = '';
  });
  batchBodywork(root);
  installBakedLighting(root);
  installHeightFog(root);
  // Capture the resource sets before a root is adopted by an asynchronously loaded vehicle.
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      ownedGeometry.add(o.geometry);
      for (const mat of Array.isArray(o.material) ? o.material : [o.material])
        ownedMaterial.add(mat);
    }
  });
  let disposed = false;
  function animate(
    time: number,
    _speed: number,
    braking = false,
    pose: StudioPose = { doors: false, hood: false, hatch: false },
  ) {
    const liveRoot = shadow.parent;
    if (liveRoot) {
      shadow.position.y =
        roadHeight(liveRoot.position.x, liveRoot.position.z) +
        0.025 -
        liveRoot.position.y;
      glow.position.y = shadow.position.y + 0.015;
    }
    engineRoot.visible = pose.hood;
    tailMaterial.color.set(a.tailColor).multiplyScalar(braking ? 1.7 : 1);
    rearLensMaterial.emissive.copy(tailMaterial.color);
    rearLensMaterial.emissiveIntensity = braking ? 6 : 3.5;
    lampCoverMaterial.emissive.copy(tailMaterial.color);
    lampCoverMaterial.emissiveIntensity = braking ? 3 : 1.8;
    lightHalos.forEach((halo) => {
      halo.userData.strength = braking ? 0.5 : 0.25;
    });
    rearReflections.forEach((reflection) => {
      reflection.position.y = shadow.position.y + 0.008;
    });
    hood.rotation.x = pose.hood ? -1.05 : 0;
    hatch.rotation.x = pose.hatch ? 1.05 : 0;
    doors.forEach((door, i) => {
      door.rotation.x = pose.doors ? 1.05 : 0;
      door.rotation.z = pose.doors ? (i ? -0.1 : 0.1) : 0;
    });
    for (let i = 0; i < 4; i++) {
      const spin = wheels[i].userData.spin ?? wheels[i].rotation.x;
      calipers[i].rotation.x = -spin;
      spinners[i].rotation.x = time * 2 - spin;
    }
    glowMaterial.opacity =
      a.parts.neon === 2
        ? 0.16 + 0.1 * Math.sin(time * 4)
        : a.parts.neon === 3
          ? 0.12 + 0.15 * Math.max(0, Math.sin(time * 4))
          : 0.2;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    ownedGeometry.forEach((g) => g.dispose());
    ownedMaterial.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }
  return { root, wheels, flame, tailMaterial, animate, dispose, spec };
}
