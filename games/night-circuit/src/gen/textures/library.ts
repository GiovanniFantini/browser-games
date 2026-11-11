import * as THREE from 'three';
import {
  MAPS,
  RECIPES,
  TEXTURE_SIZE,
  TEXTURE_VERSION,
  type MapKind,
  type TextureId,
  type TexturePack,
} from './generator';

export const DEFAULT_SEED = 3701;
const DB_NAME = 'night-circuit:procedural-textures';
const STORE = 'packs';
export interface TextureLibrary {
  packs: TexturePack[];
  hits: number;
  generated: number;
  cache: string;
  milliseconds: number;
}
let active: Map<TextureId, Record<MapKind, ImageBitmap>> | undefined;
function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('Cache occupata da un’altra scheda'));
  });
}
function read(db: IDBDatabase, key: string): Promise<TexturePack | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function write(
  db: IDBDatabase,
  key: string,
  value: TexturePack,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function clearTextureCache() {
  const db = await openCache();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function loadTextureLibrary(
  seed = DEFAULT_SEED,
  size = TEXTURE_SIZE,
): Promise<TextureLibrary> {
  const start = performance.now();
  let db: IDBDatabase | undefined,
    cache = 'IndexedDB attiva';
  try {
    db = await openCache();
  } catch {
    cache = 'Cache non disponibile: generazione in memoria';
  }
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  });
  const packs: TexturePack[] = [];
  let hits = 0,
    generated = 0;
  try {
    for (const [id] of RECIPES) {
      const key = `${TEXTURE_VERSION}:${seed}:${size}:${id}`;
      let pack: TexturePack | undefined;
      if (db)
        try {
          pack = await read(db, key);
        } catch {
          cache = 'Lettura cache fallita: generazione in memoria';
        }
      if (pack && MAPS.every((map) => pack!.maps[map] instanceof Blob)) hits++;
      else {
        pack = await new Promise<TexturePack>((resolve, reject) => {
          worker.onmessage = (event) =>
            event.data.error
              ? reject(new Error(event.data.error))
              : resolve(event.data.pack);
          worker.onerror = (event) => reject(new Error(event.message));
          worker.postMessage({
            id,
            seed:
              seed ^ Math.imul(RECIPES.findIndex(([k]) => k === id) + 1, 7919),
            size,
          });
        });
        generated++;
        if (db)
          try {
            await write(db, key, pack);
          } catch {
            cache = 'Scrittura cache fallita: texture disponibili in memoria';
          }
      }
      packs.push(pack);
    }
  } finally {
    worker.terminate();
    db?.close();
  }
  return {
    packs,
    hits,
    generated,
    cache,
    milliseconds: performance.now() - start,
  };
}
export async function prepareWorldTextures() {
  const library = await loadTextureLibrary();
  const next = new Map<TextureId, Record<MapKind, ImageBitmap>>();
  for (const pack of library.packs) {
    const bitmaps = await Promise.all(
      MAPS.map((map) =>
        createImageBitmap(pack.maps[map], { imageOrientation: 'flipY' }),
      ),
    );
    next.set(
      pack.id,
      Object.fromEntries(MAPS.map((map, i) => [map, bitmaps[i]])) as Record<
        MapKind,
        ImageBitmap
      >,
    );
  }
  if (active)
    for (const maps of active.values())
      for (const bitmap of Object.values(maps)) bitmap.close();
  active = next;
  return library;
}
export function materialFromBitmaps(
  bitmaps: Record<MapKind, ImageBitmap>,
  repeat = 1,
  id?: TextureId,
) {
  const maps = MAPS.map((kind) => {
    const texture = new THREE.Texture(bitmaps[kind]);
    texture.colorSpace =
      kind === 'albedo' || kind === 'emissive'
        ? THREE.SRGBColorSpace
        : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  });
  return new THREE.MeshStandardMaterial({
    map: maps[0],
    roughnessMap: maps[1],
    normalMap: maps[2],
    emissiveMap: maps[3],
    emissive: 0xffffff,
    emissiveIntensity: id?.startsWith('facade') ? 0.45 : 0.8,
    roughness: 1,
    metalness: id === 'corrugated' || id === 'shutter' ? 0.55 : 0,
    normalScale: new THREE.Vector2(0.35, 0.35),
  });
}
export function generatedMaterial(id: TextureId, repeat = 1) {
  const maps = active?.get(id);
  if (!maps) return undefined;
  const material = materialFromBitmaps(maps, repeat, id);
  if (!id.startsWith('sign-') && id !== 'billboard' && id !== 'storefront')
    projectWorldMaterial(material, id);
  return material;
}

/** Texture density follows metres rather than the dimensions of a scaled box. */
export function projectWorldMaterial(
  material: THREE.MeshStandardMaterial,
  id: TextureId,
) {
  const scale = id.startsWith('facade')
    ? [8, 12]
    : id.startsWith('brick')
      ? [1.8, 1.8]
      : id.startsWith('asphalt')
        ? [10, 10]
        : [4, 4];
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      `varying vec2 vMaterialUv;\n${shader.vertexShader}`.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vec4 surfaceWorld = vec4(transformed,1.0);
        vec3 projectionNormal = normal;
        #ifdef USE_INSTANCING
          surfaceWorld = instanceMatrix * surfaceWorld;
          projectionNormal = mat3(instanceMatrix) * projectionNormal;
        #endif
        surfaceWorld = modelMatrix * surfaceWorld;
        vec3 surfaceAxis = abs(normalize(mat3(modelMatrix) * projectionNormal));
        vMaterialUv = surfaceAxis.y > .7 ? surfaceWorld.xz / ${scale[0].toFixed(1)} :
          vec2(surfaceAxis.x > surfaceAxis.z ? surfaceWorld.z : surfaceWorld.x, surfaceWorld.y) / vec2(${scale.map((v) => v.toFixed(1)).join(',')});`,
      );
    shader.fragmentShader = `varying vec2 vMaterialUv;\n${shader.fragmentShader}`;
    for (const [chunk, uv] of [
      ['map_fragment', 'vMapUv'],
      ['roughnessmap_fragment', 'vRoughnessMapUv'],
      ['emissivemap_fragment', 'vEmissiveMapUv'],
      ['normal_fragment_begin', 'vNormalMapUv'],
      ['normal_fragment_maps', 'vNormalMapUv'],
    ] as const)
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <${chunk}>`,
        THREE.ShaderChunk[chunk].replaceAll(uv, 'vMaterialUv'),
      );
  };
  material.customProgramCacheKey = () => `world-material-v3-${id}`;
}

export function generatedEnvironment() {
  const bitmap = active?.get('night-sky')?.albedo;
  if (!bitmap) throw new Error('Cielo procedurale non caricato');
  const texture = new THREE.Texture(bitmap);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
