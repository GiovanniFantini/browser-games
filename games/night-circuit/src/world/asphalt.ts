import * as THREE from 'three';
import {
  generatedMaterial,
  projectWorldMaterial,
} from '../gen/textures/library';

export function asphaltMaterial() {
  const generated = generatedMaterial('asphalt');
  if (generated) {
    const material = new THREE.MeshPhysicalMaterial({
      map: generated.map,
      normalMap: generated.normalMap,
      roughnessMap: generated.roughnessMap,
      emissiveMap: generated.emissiveMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
      metalness: 0,
      roughness: 1,
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      specularIntensity: 0.15,
      envMapIntensity: 0.25,
    });
    generated.dispose();
    projectWorldMaterial(material, 'asphalt');
    return material;
  }
  const size = 64,
    normal = new Uint8Array(size * size * 4),
    roughness = new Uint8Array(size * size * 4);
  let seed = 3701;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const noise = (seed >>> 0) / 4294967296;
      const i = (y * size + x) * 4;
      normal[i] = 118 + noise * 20;
      normal[i + 1] = 118 + ((seed >>> 8) % 20);
      normal[i + 2] = 255;
      normal[i + 3] = 255;
      const patch = Math.sin((x * Math.PI) / 16) * Math.sin((y * Math.PI) / 32);
      const value = 115 + patch * 70 + noise * 20;
      roughness[i] = roughness[i + 1] = roughness[i + 2] = value;
      roughness[i + 3] = 255;
    }
  const texture = (bytes: Uint8Array) => {
    const map = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.repeat.set(8, 24);
    map.needsUpdate = true;
    return map;
  };
  return new THREE.MeshPhysicalMaterial({
    color: 0x101a26,
    metalness: 0.35,
    roughness: 0.7,
    normalMap: texture(normal),
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughnessMap: texture(roughness),
    clearcoat: 0.9,
    clearcoatRoughness: 0.25,
  });
}
