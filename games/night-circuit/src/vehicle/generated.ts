import * as THREE from 'three';
import { projectorLens, tyreLettering, factoryGraphic } from './details';
import { roadHeight } from '../world/atlas';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { batchBodywork } from './bodywork';
import data from '../data/career.json';
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
          .loadAsync(`${import.meta.env.BASE_URL}models/${id}.glb`)
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
    emissiveIntensity: 0.035,
    metalness: finish.metalness,
    roughness: Math.max(0.19, finish.roughness),
    clearcoat: finish.clearcoat * 0.95,
    clearcoatRoughness: 0.12,
    specularIntensity: 0.7,
    envMapIntensity: 2.4,
  });
  ownedMaterial.add(paint);
  paint.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      `#include <lights_fragment_end>
      reflectedLight.directSpecular*=.08;
      #ifdef USE_CLEARCOAT
      clearcoatSpecularDirect*=.04;
      #endif`,
    );
    if (finish.clearcoat > 0)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `#ifdef USE_ENVMAP
        float coatFresnel=pow(1.-saturate(dot(geometryNormal,geometryViewDir)),2.);
        vec3 reflectedCity=getIBLRadiance(geometryViewDir,geometryNormal,.10);
        vec3 worldCoatNormal=transformDirectionByInverseViewMatrix(geometryNormal,viewMatrix);
        vec3 reflectionTint=mix(vec3(1.),diffuseColor.rgb*2.,(1.-abs(worldCoatNormal.y))*.9);
        outgoingLight=mix(outgoingLight,reflectedCity*.55*reflectionTint,.20+coatFresnel*.25);
        #endif
        #include <opaque_fragment>`,
      );
  };
  paint.customProgramCacheKey = () => 'car-coat-3';
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
    roughness: 0.23,
    metalness: 0.1,
    clearcoat: 1,
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
    color: 0x556169,
    metalness: 0.55,
    roughness: 0.6,
    envMapIntensity: 0.5,
  });
  ownedMaterial.add(exhaustMaterial);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x64718f).multiplyScalar(1 - a.tint * 0.55),
    metalness: 0.65,
    roughness: 0.08,
    clearcoat: 1,
    transparent: true,
    opacity: 0.73 + a.tint * 0.23,
    envMapIntensity: 2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  glassMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#ifdef USE_ENVMAP
      vec3 reflectedSky=getIBLRadiance(geometryViewDir,geometryNormal,.06);
      outgoingLight=mix(outgoingLight,reflectedSky*.55,.6);
      #endif
      #include <opaque_fragment>`,
    );
  };
  glassMaterial.customProgramCacheKey = () => 'reflective-glazing-1';
  ownedMaterial.add(glassMaterial);
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
    if (
      role.startsWith('fanale') ||
      role.startsWith('faro') ||
      role === 'targa'
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
    else if (role.startsWith('cristallo')) o.material = glassMaterial;
    else if (role.startsWith('fanale')) o.material = rearLensMaterial;
    else if (role.startsWith('faro')) o.material = headMaterial;
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
  const seamMaterial = new THREE.LineBasicMaterial({
    color: 0x0a1220,
    transparent: true,
    opacity: 0.78,
  });
  ownedMaterial.add(seamMaterial);
  root.traverse((o) => {
    if (
      !(o instanceof THREE.Mesh) ||
      ![
        'cofano',
        'porta_sx',
        'porta_dx',
        'portellone',
        'cristallo_ant',
        'cristallo_post',
        'cristallo_sx',
        'cristallo_dx',
      ].includes(o.name)
    )
      return;
    const edges = new THREE.EdgesGeometry(o.geometry, 179);
    ownedGeometry.add(edges);
    const lines = new THREE.LineSegments(edges, seamMaterial);
    lines.name = 'panel-shutline';
    o.add(lines);
  });
  // Distinct named geometry is retained for every tuning attachment.
  const byName = (name: string) => root.getObjectByName(name);
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
      part.scale.multiplyScalar(0.8 + a.parts.exhaust * 0.1);
    }
  }
  const spoiler = byName('spoiler');
  for (const name of [
    'serie_spoiler',
    'serie_supporto_-1',
    'serie_supporto_1',
  ]) {
    const part = byName(name);
    if (part) part.visible = a.parts.spoiler === 0;
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
    diffuser.position.y = -0.42;
    diffuser.position.z = -spec.length * 0.515;
  }
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
    const reflectionMaterial = new THREE.MeshBasicMaterial({
      map: softGlow(),
      color: a.tailColor,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    ownedMaterial.add(reflectionMaterial);
    const reflected = addPart(
      new THREE.PlaneGeometry(0.7, 2.7),
      reflectionMaterial,
      new THREE.Vector3(side * spec.width * 0.3, -0.7, -spec.length * 0.68),
    );
    reflected.rotation.x = -Math.PI / 2;
    rearReflections.push(reflected);
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
    if (part) part.visible = a.parts.exhaust > 0;
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
      new THREE.BoxGeometry(0.07, 0.17, 0.08),
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
  flame.position.set(-spec.width * 0.33, -0.46, -spec.length * 0.6);
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
      const m = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        side: THREE.DoubleSide,
      });
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
