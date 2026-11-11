import * as THREE from 'three';
let head: THREE.CanvasTexture | undefined,
  wall: THREE.CanvasTexture | undefined,
  graphic: THREE.CanvasTexture | undefined;
export function projectorLens() {
  if (head) return head;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#090e18';
  ctx.fillRect(0, 0, 256, 128);
  for (const x of [72, 185]) {
    const g = ctx.createRadialGradient(x, 61, 4, x, 61, 50);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, '#d8efff');
    g.addColorStop(0.36, '#354f74');
    g.addColorStop(0.66, '#bfd9e8');
    g.addColorStop(0.8, '#182330');
    g.addColorStop(1, '#070b11');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, 64, 52, 51, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e3efff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, 64, 39, 39, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#d18d35';
  ctx.fillRect(240, 30, 10, 65);
  head = new THREE.CanvasTexture(c);
  head.colorSpace = THREE.SRGBColorSpace;
  return head;
}
export function tyreLettering() {
  if (wall) return wall;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = '#242b32';
  ctx.lineWidth = 27;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#4a4d50';
  ctx.lineWidth = 1;
  for (const r of [102, 122]) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = '700 11px "Circuit Grid"';
  ctx.fillStyle = '#8f9397';
  const text = 'TORQEN V7  /  225 40 R18';
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(-1.1 + i * 0.098);
    ctx.fillText(text[i], -3, -107);
    ctx.restore();
  }
  wall = new THREE.CanvasTexture(c);
  wall.colorSpace = THREE.SRGBColorSpace;
  return wall;
}
export function factoryGraphic() {
  if (graphic) return graphic;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const polygon = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  polygon(
    [
      [15, 205],
      [270, 118],
      [235, 144],
      [480, 69],
      [365, 135],
      [505, 115],
      [320, 181],
      [346, 157],
      [65, 226],
    ],
    '#84cec8',
  );
  polygon(
    [
      [32, 224],
      [251, 161],
      [219, 188],
      [427, 120],
      [330, 178],
      [103, 240],
    ],
    '#d6e8e1',
  );
  polygon(
    [
      [170, 169],
      [304, 119],
      [272, 152],
      [451, 96],
      [367, 141],
      [224, 184],
    ],
    '#183d52',
  );
  graphic = new THREE.CanvasTexture(c);
  graphic.colorSpace = THREE.SRGBColorSpace;
  return graphic;
}
