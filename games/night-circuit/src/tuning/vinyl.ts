import * as THREE from 'three';
import { visualCatalog, type VinylLayer, type VinylSide } from './appearance';

export function visibleLayers(layers: readonly VinylLayer[], side: VinylSide) {
  return layers.filter(
    (l) =>
      l.side === side ||
      (l.mirror &&
        ((l.side === 'left' && side === 'right') ||
          (l.side === 'right' && side === 'left'))),
  );
}
export function layerTransform(
  l: VinylLayer,
  side: VinylSide,
  width = 512,
  height = 256,
) {
  const mirrored = l.side !== side;
  return {
    x: (mirrored ? 1 - l.x : l.x) * width,
    y: l.y * height,
    angle: ((l.rotation * Math.PI) / 180) * (mirrored ? -1 : 1),
    sx: ((l.scaleX * width) / 100) * (mirrored ? -1 : 1),
    sy: (l.scaleY * height) / 100,
  };
}
export function vinylTexture(
  layers: readonly VinylLayer[],
  side: VinylSide,
): THREE.CanvasTexture | null {
  const visible = visibleLayers(layers, side);
  if (!visible.length || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  for (const l of visible) {
    const shape = visualCatalog.shapes.find((s) => s.id === l.shape)!,
      t = layerTransform(l, side);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.scale(t.sx, t.sy);
    ctx.translate(-50, -50);
    ctx.globalAlpha = l.opacity;
    ctx.fillStyle = l.color;
    ctx.fill(new Path2D(shape.path), 'rule' in shape ? 'evenodd' : 'nonzero');
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
