import * as THREE from 'three';
let headCluster: THREE.CanvasTexture | undefined;
export function headClusterLens() {
  if (headCluster) return headCluster;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const background = ctx.createLinearGradient(0, 0, 0, 128);
  background.addColorStop(0, '#8ca6b4');
  background.addColorStop(0.45, '#466574');
  background.addColorStop(1, '#192b38');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 128);
  for (const x of [65, 178]) {
    ctx.save();
    ctx.translate(x, 64);
    ctx.scale(0.65, 1);
    const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 49);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.22, '#effcff');
    g.addColorStop(0.42, '#accbd9');
    g.addColorStop(0.56, '#263b4d');
    g.addColorStop(0.77, '#8babbc');
    g.addColorStop(1, '#172c38');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 49, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = '#d3e1e6';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 7, 244, 113);
  ctx.fillStyle = '#d2e6ed';
  ctx.fillRect(11, 106, 231, 3);
  headCluster = new THREE.CanvasTexture(c);
  headCluster.colorSpace = THREE.SRGBColorSpace;
  return headCluster;
}
let tailCluster: THREE.CanvasTexture | undefined;
export function tailClusterLens() {
  if (tailCluster) return tailCluster;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#242424';
  ctx.fillRect(0, 0, 256, 128);
  for (const x of [49, 128, 207]) {
    ctx.fillStyle = '#8f8f8f';
    ctx.fillRect(x - 25, 27, 50, 74);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(x - 22, 39, 44, 50);
    for (let y = 33; y < 99; y += 11) {
      ctx.fillStyle = '#505050';
      ctx.fillRect(x - 25, y, 50, 2);
      ctx.fillStyle = '#bbbbbb';
      ctx.fillRect(x - 23, y + 3, 46, 1);
    }
  }
  for (let y = 5; y < 128; y += 4) {
    ctx.fillStyle = '#00000055';
    ctx.fillRect(0, y, 256, 1);
  }
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 8;
  ctx.strokeRect(3, 3, 250, 122);
  ctx.fillStyle = '#777777';
  ctx.fillRect(25, 15, 204, 2);
  tailCluster = new THREE.CanvasTexture(c);
  tailCluster.colorSpace = THREE.SRGBColorSpace;
  return tailCluster;
}
let grille: THREE.CanvasTexture | undefined;
export function grilleMeshTexture() {
  if (grille) return grille;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#05090c';
  c.fillRect(0, 0, 256, 256);
  c.strokeStyle = '#48555b';
  c.lineWidth = 1.3;
  for (let y = -8; y < 270; y += 12)
    for (let x = -8; x < 270; x += 14) {
      const px = x + (Math.round(y / 12) % 2) * 7;
      c.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const xx = px + Math.cos(a) * 7,
          yy = y + Math.sin(a) * 7;
        if (i === 0) c.moveTo(xx, yy);
        else c.lineTo(xx, yy);
      }
      c.stroke();
    }
  grille = new THREE.CanvasTexture(canvas);
  grille.colorSpace = THREE.SRGBColorSpace;
  return grille;
}
let head: THREE.CanvasTexture | undefined,
  wall: THREE.CanvasTexture | undefined,
  graphic: THREE.CanvasTexture | undefined;
export function projectorLens() {
  if (head) return head;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(0, 0, 256, 256);
  const g = ctx.createRadialGradient(119, 112, 3, 128, 128, 120);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.18, '#effaff');
  g.addColorStop(0.35, '#93a9b7');
  g.addColorStop(0.55, '#243b55');
  g.addColorStop(0.8, '#809cac');
  g.addColorStop(0.93, '#172635');
  g.addColorStop(1, '#090e18');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c3d6e4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.stroke();
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
