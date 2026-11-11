import * as THREE from 'three';

/** Shop interiors painted from the same seed dictionary as their signs. */
export function storeMaterial(index: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;
  const warm = index % 3 !== 1;
  const gradient = c.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, warm ? '#5e4731' : '#26424d');
  gradient.addColorStop(0.55, warm ? '#332a24' : '#172b36');
  gradient.addColorStop(1, '#091017');
  c.fillStyle = gradient;
  c.fillRect(0, 0, 512, 256);
  c.fillStyle = warm ? '#92734b' : '#4e7e88';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(512, 0);
  c.lineTo(426, 45);
  c.lineTo(83, 45);
  c.fill();
  c.fillStyle = '#ffd699';
  for (let i = 0; i < 3; i++) c.fillRect(96 + i * 133, 19, 60, 5);
  c.strokeStyle = '#77828655';
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.moveTo(256, 100);
    c.lineTo(i * 110 - 20, 256);
    c.stroke();
    c.beginPath();
    c.moveTo(0, 174 + i * i * 3);
    c.lineTo(512, 174 + i * i * 3);
    c.stroke();
  }
  if (index % 3 === 0) {
    // Cafe: upholstered booths, separate tables, pendant shades.
    for (let i = 0; i < 4; i++) {
      const x = 35 + i * 121;
      c.fillStyle = '#743c2f';
      c.fillRect(x, 140, 90, 58);
      c.fillStyle = '#ab8660';
      c.fillRect(x - 4, 155, 100, 8);
      c.fillStyle = '#171b1c';
      c.fillRect(x + 39, 164, 7, 52);
      c.fillStyle = '#dcb66c';
      c.beginPath();
      c.moveTo(x + 27, 85);
      c.lineTo(x + 60, 85);
      c.lineTo(x + 50, 70);
      c.lineTo(x + 38, 70);
      c.fill();
    }
  } else if (index % 3 === 1) {
    // Audio/arcade shop: freestanding cabinets and bright display screens.
    for (let i = 0; i < 5; i++) {
      const x = 24 + i * 99;
      c.fillStyle = '#0b131a';
      c.fillRect(x, 75, 76, 136);
      c.fillStyle = ['#558b99', '#b85f9d', '#a49757'][i % 3];
      c.fillRect(x + 7, 85, 62, 57);
      c.fillStyle = '#142a35';
      c.fillRect(x + 18, 94, 38, 38);
      c.fillStyle = '#abc9bf';
      c.fillRect(x + 11, 153, 53, 5);
      c.fillStyle = '#31444a';
      c.fillRect(x + 7, 179, 62, 26);
    }
  } else {
    // Records/market: shelves, coloured stock and a recessed counter.
    for (let y = 70; y <= 155; y += 29) {
      for (let x = 20; x < 495; x += 17) {
        c.fillStyle = ['#968b64', '#744d3b', '#587b7d', '#979a83'][(x + y) % 4];
        c.fillRect(x, y, 12, 22 - (x % 7));
      }
      c.fillStyle = '#171b1e';
      c.fillRect(12, y + 23, 488, 5);
    }
    c.fillStyle = '#554435';
    c.fillRect(320, 175, 167, 49);
    c.fillStyle = '#ac9b74';
    c.fillRect(313, 170, 180, 7);
  }
  c.fillStyle = '#111c23';
  c.fillRect(0, 0, 12, 256);
  c.fillRect(500, 0, 12, 256);
  c.fillRect(250, 0, 8, 256);
  c.fillRect(0, 246, 512, 10);
  c.fillStyle = '#bdc8bd66';
  c.fillRect(236, 140, 4, 32);
  c.fillRect(269, 140, 4, 32);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: 0xffffff,
    emissiveIntensity: 1.1,
    roughness: 0.25,
    metalness: 0.12,
  });
}

export function verticalSignMaterial(index: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const c = canvas.getContext('2d')!;
  const word = index % 2 ? 'MOTEL' : 'ARCADE';
  c.fillStyle = '#08131b';
  c.fillRect(0, 0, 256, 512);
  c.strokeStyle = index % 2 ? '#fa5986' : '#54d6df';
  c.lineWidth = 6;
  c.strokeRect(12, 8, 232, 496);
  c.fillStyle = '#ffdec0';
  c.font = '700 63px "Circuit Grid"';
  c.textAlign = 'center';
  for (let i = 0; i < word.length; i++)
    c.fillText(word[i], 128, 73 + i * (409 / word.length));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: 0xffffff,
    emissiveIntensity: 2.3,
  });
}

/** Original room and shop-sign paintings. Every pixel and label is authored here. */
export function roomMaterial(variant: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  const lit = variant > 0;
  const palette = [
    '#15232c',
    '#b68c55',
    '#b6aa8c',
    '#9e6546',
    '#65919b',
    '#a19571',
    '#7d929e',
  ];
  const tint = palette[variant % palette.length];
  c.fillStyle = '#080e15';
  c.fillRect(0, 0, 256, 256);
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, lit ? tint : '#18252e');
  g.addColorStop(0.7, lit ? '#514e43' : '#0c1722');
  g.addColorStop(1, '#10191e');
  c.fillStyle = g;
  c.fillRect(12, 8, 232, 240);
  c.fillStyle = lit ? '#b7a27c' : '#26333c';
  c.beginPath();
  c.moveTo(12, 8);
  c.lineTo(244, 8);
  c.lineTo(194, 48);
  c.lineTo(53, 48);
  c.closePath();
  c.fill();
  c.fillStyle = '#080f19';
  c.fillRect(48, 58, 9, 124);
  c.fillRect(193, 58, 7, 124);
  c.fillStyle = lit ? '#746b57' : '#14222c';
  c.fillRect(54, 58, 140, 115);
  c.fillStyle = '#252e2b';
  c.fillRect(75, 155, 110, 48);
  c.fillRect(66, 167, 16, 44);
  c.fillRect(178, 167, 15, 44);
  if (lit) {
    c.fillStyle = '#ffe2a0';
    c.fillRect(90, 25, 75, 7);
    c.fillStyle = '#d8c7a0';
    c.fillRect(173, 82, 13, 35);
  }
  const left = variant % 3 === 0 ? 62 : variant % 3 === 1 ? 25 : 10,
    right = variant % 2 ? 15 : 42;
  for (const [x, w] of [
    [12, left],
    [244 - right, right],
  ]) {
    c.fillStyle = lit ? '#726954' : '#15232b';
    c.fillRect(x, 8, w, 232);
    for (let i = 0; i < w; i += 7) {
      c.fillStyle = lit ? '#34382f55' : '#050d1480';
      c.fillRect(x + i, 8, 3, 232);
    }
  }
  c.fillStyle = '#34413e';
  c.fillRect(123, 8, 5, 238);
  c.fillRect(12, 148, 232, 4);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap: lit ? map : null,
    emissive: lit ? 0xffffff : 0,
    emissiveIntensity: lit ? 1.65 : 0,
    roughness: 0.5,
    metalness: 0.08,
  });
}

export function shopSignMaterial(index: number) {
  const names = [
    'TORQEN MOTOR',
    'RAVEL DINER',
    'KOVA AUDIO',
    'MIRA MOTEL',
    'VELORA ARCADE',
    'NORI MARKET',
    'LUMEN LAUNDRY',
    'ORBIT COFFEE',
    'KINTRA PARTS',
    'SOLVA CINEMA',
    'NEXA RECORDS',
    'ASTER HOTEL',
  ];
  const colors = [
    '#ef6a39',
    '#4ac5d3',
    '#bda860',
    '#b0558f',
    '#99be9e',
    '#c88943',
  ];
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;
  const color = colors[index % colors.length];
  c.fillStyle = '#121a20';
  c.fillRect(0, 0, 512, 256);
  c.fillStyle = color;
  c.fillRect(5, 71, 502, 6);
  c.fillRect(5, 181, 502, 4);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.strokeRect(5, 72, 502, 111);
  c.fillStyle = '#071015';
  c.fillRect(12, 80, 488, 94);
  c.font = '700 46px "Circuit Grid"';
  c.textAlign = 'center';
  c.fillStyle = '#fff1d1';
  c.fillText(names[index % names.length], 256, 145, 463);
  c.fillStyle = color;
  c.fillRect(20, 96, 8, 50);
  c.fillRect(484, 96, 8, 50);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: 0xffffff,
    emissiveIntensity: 2.2,
    roughness: 0.45,
  });
}
