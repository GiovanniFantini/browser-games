import * as THREE from 'three';

/** A local HDR city panorama: violet sky, elongated light strips and window banks. */
export function reflectionEnvironment() {
  const width = 512,
    height = 256,
    pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / width,
        v = y / height,
        horizon = Math.exp(-Math.pow((v - 0.49) * 9, 2));
      const sky = v < 0.52;
      const band = Math.exp(
        -Math.pow((v - 0.45 - 0.025 * Math.sin(u * Math.PI * 6)) / 0.035, 2),
      );
      const n = (Math.sin(u * 41 + v * 27) + Math.sin(u * 19 - v * 31)) * 0.5;
      const cloud = Math.max(0, n * 0.5 + 0.25);
      const color = sky
        ? [
            0.16 + horizon * 0.14 + cloud * 0.25,
            0.055 + horizon * 0.045 + cloud * 0.03,
            0.2 + horizon * 0.1 + cloud * 0.3,
          ]
        : [0.013, 0.02, 0.032];
      color[0] += band * 0.9;
      color[1] += band * 0.3;
      color[2] += band * 0.8;
      for (let a = 0; a < 4; a++) {
        const centre = 0.08 + a * 0.25;
        if (Math.abs(u - centre) < 0.025 && v > 0.36 && v < 0.64) {
          const stripe = Math.abs(Math.sin(y * 0.85)) > 0.4 ? 1 : 0.1;
          const c = a % 2 ? [0.4, 1.8, 2.4] : [2.5, 1.1, 0.45];
          for (let k = 0; k < 3; k++) color[k] += c[k] * stripe;
        }
      }
      const i = ((height - 1 - y) * width + x) * 4;
      for (let k = 0; k < 3; k++)
        pixels[i + k] = Math.max(0, color[k] + (sky ? n * 0.008 : 0));
      pixels[i + 3] = 1;
    }
  const texture = new THREE.DataTexture(
    pixels,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
