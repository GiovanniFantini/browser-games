import * as THREE from 'three';
let texture: THREE.DataTexture | undefined;
/** Small optical star and streak, synthesized without a flare image. */
export function lampStarTexture() {
  if (texture) return texture;
  const data = new Uint8Array(256 * 256 * 4);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const u = (x - 128) / 128,
        v = (y - 128) / 128,
        r = Math.hypot(u, v);
      const core = Math.exp(-r * r * 260) * 0.85;
      const horizontal = Math.exp(-Math.abs(v) * 145 - Math.abs(u) * 6) * 0.56;
      const vertical = Math.exp(-Math.abs(u) * 160 - Math.abs(v) * 7) * 0.32;
      const diagonal =
        (Math.exp(-Math.abs(u - v) * 130) + Math.exp(-Math.abs(u + v) * 130)) *
        Math.exp(-r * 10) *
        0.1;
      const i = (y * 256 + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(
        Math.min(1, core + horizontal + vertical + diagonal) * 255,
      );
    }
  texture = new THREE.DataTexture(data, 256, 256, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
