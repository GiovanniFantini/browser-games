import * as THREE from 'three';
let wear: THREE.CanvasTexture | undefined;
/** Worn paint lies beneath the wet-road reflection, rather than on raised slabs. */
export function roadPaintMaterial(color: number) {
  if (!wear) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d')!;
    let seed = 88271;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };
    c.fillStyle = '#b6b6b6';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5500; i++) {
      const x = random() * 256,
        y = random() * 256,
        v = Math.floor(140 + random() * 62);
      c.fillStyle = `rgb(${v} ${v} ${v})`;
      c.fillRect(x, y, 1 + random() * 2, 1);
      if (i % 7 === 0) c.clearRect(x, y, 1 + random() * 4, 1 + random() * 2);
    }
    for (let i = 0; i < 70; i++) {
      const x = random() * 256,
        y = random() * 256;
      c.clearRect(x, y, 1 + random() * 3, 4 + random() * 14);
    }
    wear = new THREE.CanvasTexture(canvas);
    wear.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshPhysicalMaterial({
    color,
    map: wear,
    alphaTest: 0.4,
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
    specularIntensity: 0.15,
    envMapIntensity: 0.25,
  });
}
