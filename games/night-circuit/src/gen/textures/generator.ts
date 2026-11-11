import { drawLettering } from './lettering';

export const MAPS = ['albedo', 'roughness', 'normal', 'emissive'] as const;
export type MapKind = (typeof MAPS)[number];
export const RECIPES = [
  ['asphalt', 'Asfalto bagnato'],
  ['asphalt-marked', 'Segnaletica usurata'],
  ['sidewalk', 'Marciapiede'],
  ['brick-russet', 'Mattoni ossido'],
  ['brick-sand', 'Mattoni sabbia'],
  ['brick-dark', 'Mattoni scuri'],
  ['concrete', 'Cemento macchiato'],
  ['corrugated', 'Lamiera ondulata'],
  ['glass', 'Vetro'],
  ['facade-amber', 'Facciata ambra'],
  ['facade-rose', 'Facciata rosata'],
  ['shutter', 'Saracinesca'],
  ['sign-cyan', 'Insegna azzurra'],
  ['sign-pink', 'Insegna rosa'],
  ['billboard', 'Cartellone astratto'],
  ['night-sky', 'Cielo e riflessi notturni'],
  ['storefront', 'Vetrina illuminata'],
] as const;
export type TextureId = (typeof RECIPES)[number][0];
export const TEXTURE_VERSION = 8;
export const TEXTURE_SIZE = 512;
export interface TexturePack {
  id: TextureId;
  seed: number;
  size: number;
  label: string;
  maps: Record<MapKind, Blob>;
}
export function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
type Context = OffscreenCanvasRenderingContext2D;
const clamp = (v: number) => Math.max(0, Math.min(255, v));
const smooth = (a: number, b: number, v: number) => {
  const f = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return f * f * (3 - 2 * f);
};
function hash(x: number, y: number, seed: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number, cells: number, seed: number) {
  const u = x * cells,
    v = y * cells,
    ix = Math.floor(u),
    iy = Math.floor(v);
  const fx = smooth(0, 1, u - ix),
    fy = smooth(0, 1, v - iy);
  const at = (a: number, b: number) =>
    hash(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, seed);
  return (
    (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) +
    (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy
  );
}

export async function generateTexture(
  id: TextureId,
  seed: number,
  size = TEXTURE_SIZE,
): Promise<TexturePack> {
  if (![256, 512].includes(size))
    throw new Error('Texture size must be 256 or 512');
  const rng = randomSource(seed);
  const make = () =>
    new OffscreenCanvas(size, size).getContext('2d', {
      willReadFrequently: true,
    })!;
  const a = make(),
    h = make(),
    r = make(),
    e = make();
  e.fillStyle = '#000';
  e.fillRect(0, 0, size, size);
  const road = id.startsWith('asphalt'),
    brick = id.startsWith('brick'),
    facade = id.startsWith('facade');
  const metal = id === 'corrugated' || id === 'shutter';
  const palette =
    id === 'brick-russet'
      ? [119, 72, 52]
      : id === 'brick-sand'
        ? [148, 130, 98]
        : id === 'brick-dark'
          ? [70, 73, 70]
          : road
            ? [49, 53, 54]
            : facade
              ? id === 'facade-rose'
                ? [105, 90, 78]
                : [124, 117, 99]
              : id === 'glass'
                ? [24, 40, 46]
                : metal
                  ? [95, 104, 100]
                  : [122, 120, 108];
  const ai = a.createImageData(size, size),
    hi = h.createImageData(size, size),
    ri = r.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size,
        px = u * 512,
        py = v * 512,
        i = (y * size + x) * 4;
      const fine = noise(u, v, 64, seed + 11),
        medium = noise(u, v, 16, seed + 23),
        broad = noise(u, v, 4, seed + 97),
        grain = rng() - 0.5;
      let shade = 0.78 + medium * 0.2 + grain * 0.18,
        height = 128 + grain * 5,
        rough = 196 + fine * 32;
      let color = palette;
      if (road) {
        const wet = smooth(
          0.35,
          0.78,
          noise(u, v, 8, seed + 17) * 0.83 + medium * 0.17,
        );
        const grit = grain > 0.38 ? (grain - 0.38) * 70 : grain * 17;
        shade = 0.85 + medium * 0.12 + grain * 0.22;
        color = palette.map((c) => (c + grit) * (1 - wet * 0.06));
        rough = 118 + fine * 25 - wet * 43;
        height = 128 + (grain * 8 + (fine - 0.5) * 5) * (1 - wet * 0.93);
      } else if (brick || id === 'sidewalk') {
        const bh = brick ? 32 : 128,
          bw = brick ? 64 : 128,
          row = Math.floor(py / bh),
          offset = row % 2 ? bw / 2 : 0;
        const bx = Math.floor((px + offset) / bw),
          localX = (px + offset) % bw,
          localY = py % bh;
        const edge = Math.min(localX, bw - localX, localY, bh - localY);
        const bed = smooth(1.1, 3.7, edge),
          variation = hash(bx, row, seed);
        const chipped = smooth(0.81, 0.97, fine) * smooth(9, 1, edge);
        color = palette.map(
          (c, k) =>
            (c * (0.78 + variation * 0.34) + grain * 22 + (fine - 0.5) * 18) *
              (1 - chipped * 0.2) *
              bed +
            [93, 90, 77][k] * (1 - bed),
        );
        height = 116 + bed * (13 + grain * 7 + (fine - 0.5) * 8) - chipped * 7;
        shade = 0.89 + medium * 0.15;
        rough = 204 + fine * 32;
        if (id === 'sidewalk') shade *= 0.9 + Math.min(1, edge / 12) * 0.1;
      } else if (metal) {
        const wave = Math.cos(((id === 'shutter' ? py : px) * Math.PI) / 8);
        const rust =
          smooth(0.55, 0.85, medium * 0.6 + fine * 0.4) * (0.3 + broad * 0.7);
        color = palette.map(
          (c, k) => c * (1 - rust * 0.6) + [93, 41, 15][k] * rust,
        );
        shade = 0.78 + wave * 0.06 + grain * 0.1;
        height = 128 + wave * 13 + grain * 3;
        rough = 118 + fine * 38 + rust * 88;
      } else if (id === 'glass') {
        const streak = noise(u * 4, v * 0.04, 16, seed + 34);
        const reflection = Math.pow(
          Math.max(0, Math.cos((u + v * 0.22) * Math.PI * 4)),
          24,
        );
        shade = 0.75 + streak * 0.18 + reflection * 0.45;
        rough = 42 + fine * 13;
        height = 128;
      } else if (facade || id === 'concrete') {
        const drip = noise(u, v * 0.08, 32, seed + 41);
        shade = 0.7 + medium * 0.19 + broad * 0.15 + grain * 0.12 - drip * 0.08;
        height = 128 + grain * 5 + (fine - 0.5) * 6;
        if (id === 'concrete') {
          shade =
            0.95 + (fine - 0.5) * 0.065 + (grain - 0.5) * 0.06 - drip * 0.025;
          height = 128 + (grain - 0.5) * 3 + (fine - 0.5) * 2;
          rough = 208 + fine * 22;
        }
      }
      if (id === 'night-sky') {
        const horizon = Math.exp(-Math.pow((v - 0.48) * 8, 2));
        const cloud = smooth(
          0.25,
          0.8,
          broad * 0.45 + medium * 0.4 + fine * 0.15,
        );
        color =
          v < 0.54
            ? [27 + horizon * 53, 25 + horizon * 22, 47 + horizon * 34]
            : [14, 20, 31];
        shade = v < 0.54 ? 0.65 + cloud * 0.6 : 0.8 + medium * 0.15;
        rough = 255;
        height = 128;
      }
      for (let k = 0; k < 3; k++) {
        ai.data[i + k] = clamp(color[k] * shade);
        hi.data[i + k] = clamp(height);
        ri.data[i + k] = clamp(rough);
      }
      ai.data[i + 3] = hi.data[i + 3] = ri.data[i + 3] = 255;
    }
  a.putImageData(ai, 0, 0);
  h.putImageData(hi, 0, 0);
  r.putImageData(ri, 0, 0);
  for (const c of [a, h, r, e]) c.scale(size / 512, size / 512);
  const rect = (
    x: number,
    y: number,
    w: number,
    ht: number,
    color: string,
    height = 128,
    rough = 210,
  ) => {
    a.fillStyle = color;
    a.fillRect(x, y, w, ht);
    h.fillStyle = `rgb(${height} ${height} ${height})`;
    h.fillRect(x, y, w, ht);
    r.fillStyle = `rgb(${rough} ${rough} ${rough})`;
    r.fillRect(x, y, w, ht);
  };
  const line = (
    ctx: Context,
    points: number[][],
    color: string,
    width: number,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  if (road) {
    // Shallow tar repairs keep aggregate visible, rather than solid rectangles.
    for (let j = 0; j < 2; j++) {
      const x = 30 + rng() * 330,
        y = 30 + rng() * 330,
        w = 30 + rng() * 95,
        ht = 25 + rng() * 70;
      a.fillStyle = '#101717';
      a.globalAlpha = 0.28;
      a.beginPath();
      a.moveTo(x, y + 3);
      a.lineTo(x + w - 6, y);
      a.lineTo(x + w, y + ht - 4);
      a.lineTo(x + 5, y + ht);
      a.closePath();
      a.fill();
      a.globalAlpha = 1;
      line(
        a,
        [
          [x, y + 3],
          [x + w - 6, y],
          [x + w, y + ht - 4],
          [x + 5, y + ht],
          [x, y + 3],
        ],
        '#232a2bbb',
        1.3,
      );
    }
    for (let k = 0; k < 16; k++) {
      a.strokeStyle = `rgba(12,17,17,${0.01 + rng() * 0.025})`;
      a.lineWidth = 1 + rng() * 9;
      a.beginPath();
      a.moveTo(170 + rng() * 130, -5);
      a.lineTo(170 + rng() * 130, 520);
      a.stroke();
    }
  }
  if (road || brick || id === 'concrete' || id === 'sidewalk')
    for (let j = 0; j < (road ? 3 : 2); j++) {
      let x = rng() * 512,
        y = rng() * 512;
      const pts = [[x, y]];
      for (let k = 0; k < 14; k++) {
        x += rng() * 16 - 7;
        y += rng() * 14;
        pts.push([x, y]);
      }
      for (const dx of [-512, 0, 512])
        for (const dy of [-512, 0, 512]) {
          const path = pts.map(([px, py]) => [px + dx, py + dy]);
          line(a, path, road ? '#30343935' : '#31352d70', 0.5);
          line(h, path, road ? '#7c7c7c' : '#767676', 0.6);
          line(r, path, '#c5c5c5', 1);
        }
    }
  if (id === 'asphalt-marked') {
    for (const y of [36, 292]) {
      a.fillStyle = '#d5c998';
      a.globalAlpha = 0.86;
      a.fillRect(246, y, 17, 175);
      a.globalAlpha = 1;
      r.fillStyle = '#b5b5b5';
      r.fillRect(246, y, 17, 175);
      for (let j = 0; j < 420; j++) {
        const x = 246 + rng() * 17,
          py = y + rng() * 175;
        a.fillStyle = `rgba(34,40,39,${0.1 + rng() * 0.65})`;
        a.fillRect(x, py, 0.5 + rng() * 2, 0.5 + rng() * 4);
      }
    }
  }
  if (metal) {
    // Local rust blooms, screw heads and rain streaks follow the fabricated surface.
    for (let j = 0; j < 70; j++) {
      const x = rng() * 512,
        y = rng() * 512;
      line(
        a,
        [
          [x, y],
          [x + rng() * 3, y + 15 + rng() * 45],
        ],
        '#4b332222',
        0.4 + rng() * 1.3,
      );
    }
    for (const x of [12, 252, 492])
      for (const y of [16, 256, 496]) {
        rect(x - 2, y - 2, 4, 4, '#4b4e48', 132, 145);
        line(
          a,
          [
            [x - 1, y],
            [x + 1, y],
          ],
          '#c1c3ad',
          0.6,
        );
      }
  }
  if (id === 'concrete') {
    for (const p of [0, 256]) {
      rect(p, 0, 2, 512, '#444b4b', 124, 225);
      rect(p + 2, 0, 1, 512, '#8d9189', 131, 210);
      rect(0, p, 512, 2, '#444b4b', 124, 225);
      rect(0, p + 2, 512, 1, '#8d9189', 131, 210);
      for (const x of [p + 12, p + 244])
        for (const y of [12, 244, 268, 500]) {
          a.fillStyle = '#42494a';
          a.beginPath();
          a.arc(x, y, 2, 0, Math.PI * 2);
          a.fill();
          a.fillStyle = '#333d3b20';
          a.fillRect(x - 1, y + 3, 2, 14 + rng() * 30);
        }
    }
  }
  if (facade) {
    for (let row = 0; row < 4; row++) {
      const y = row * 128;
      rect(0, y + 119, 512, 3, '#4d4c43', 126);
      rect(0, y + 122, 512, 3, '#8e8877', 135);
      for (let col = 0; col < 4; col++) {
        const x = col * 128 + 26,
          wy = y + 24,
          lit = rng() > 0.64;
        const w = 72,
          ht = 78;
        rect(x - 7, wy - 6, w + 14, ht + 13, '#625f53', 126);
        rect(x - 3, wy - 2, w + 6, ht + 6, '#292f2b', 120);
        rect(x, wy, w, ht, '#18272d', 125, 52);
        const room = a.createLinearGradient(x, wy, x, wy + ht);
        room.addColorStop(0, lit ? '#a78b61' : '#142128');
        room.addColorStop(0.45, lit ? '#a39270' : '#1b2c32');
        room.addColorStop(1, lit ? '#665b45' : '#26383d');
        a.fillStyle = room;
        a.fillRect(x, wy, w, ht);
        if (lit) {
          const warm = ['#a88856', '#af9b72', '#947d56', '#c1a16a'][
            Math.floor(rng() * 4)
          ];
          e.fillStyle = warm;
          e.fillRect(x, wy, w, ht);
          for (const ctx of [a, e]) {
            ctx.fillStyle = ctx === a ? '#504b3e' : '#413c2f';
            ctx.beginPath();
            ctx.moveTo(x, wy + ht);
            ctx.lineTo(x + 15, wy + ht - 18);
            ctx.lineTo(x + 56, wy + ht - 18);
            ctx.lineTo(x + w, wy + ht);
            ctx.fill();
            ctx.fillRect(x + 15, wy + 18, 2, ht - 36);
          }
          const curtain = 7 + rng() * 15;
          for (const ctx of [a, e]) {
            ctx.fillStyle = ctx === a ? '#827660' : '#75684d';
            ctx.fillRect(x, wy, curtain, ht);
            ctx.fillRect(x + w - curtain, wy, curtain, ht);
            for (let xx = 1; xx < curtain; xx += 3) {
              ctx.fillStyle = '#433d333c';
              ctx.fillRect(x + xx, wy, 1, ht);
              ctx.fillRect(x + w - curtain + xx, wy, 1, ht);
            }
          }
          if (rng() > 0.89)
            for (const ctx of [a, e]) {
              ctx.fillStyle = '#272b27';
              ctx.beginPath();
              ctx.ellipse(x + 43, wy + 62, 6, 12, 0.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(x + 42, wy + 46, 3.5, 0, Math.PI * 2);
              ctx.fill();
            }
        }
        // Thin glazing mullions, recess shading and a worn projecting sill.
        for (const xx of [x + 23, x + 47]) {
          rect(xx, wy, 1.7, ht, '#454b43', 132, 125);
          e.fillStyle = '#000';
          e.fillRect(xx, wy, 1.7, ht);
        }
        rect(x, wy + 49, w, 2, '#474b41', 131, 125);
        e.fillStyle = '#000';
        e.fillRect(x, wy + 49, w, 2);
        rect(x - 6, wy + ht + 3, w + 12, 4, '#94907b', 138);
        rect(x - 6, wy + ht + 7, w + 12, 2, '#383d35', 124);
        a.fillStyle = '#171e1c44';
        a.fillRect(x - 4, wy - 2, w + 8, 4);
        a.fillRect(x - 3, wy, 3, ht);
        for (let j = 0; j < 8; j++) {
          a.fillStyle = '#bac0ab0d';
          a.fillRect(x + rng() * w, wy, 0.5, ht);
        }
        // Narrow runoff stains below each opening stay in the diffuse material.
        for (let j = 0; j < 6; j++) {
          a.fillStyle = '#27352a18';
          a.fillRect(
            x - 4 + rng() * (w + 8),
            wy + ht + 9,
            1 + rng() * 3,
            8 + rng() * 13,
          );
        }
      }
    }
  }
  let label: string = RECIPES.find(([key]) => key === id)![1];
  if (id.startsWith('sign') || id === 'billboard') {
    rect(0, 0, 512, 512, '#242e30', 128, 185);
    const cyan = id !== 'sign-pink',
      accent = cyan ? '#5bcdc2' : '#d65f91';
    const word =
      ['VEL', 'ORY', 'NUV', 'ZEL', 'IVA', 'QUO'][Math.floor(rng() * 6)] +
      ['ORA', 'UNO', 'EXA', 'IRI', 'AVA', 'ETO'][Math.floor(rng() * 6)];
    label = word + ' / ' + label;
    if (id === 'billboard') {
      rect(10, 10, 492, 492, '#d1c4a2', 130, 180);
      for (const ctx of [a, e]) {
        for (let j = 0; j < 9; j++) {
          ctx.strokeStyle = j % 2 ? '#ba6445' : '#39726e';
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.moveTo(-30, 320 + j * 24);
          ctx.bezierCurveTo(
            160,
            100 + j * 19,
            240,
            520 - j * 13,
            550,
            160 + j * 18,
          );
          ctx.stroke();
        }
        ctx.strokeStyle = ctx === a ? '#263b3d' : '#252d2a';
        drawLettering(ctx, 'AFTER HOURS', 35, 102, 2.9, 1.8);
        drawLettering(ctx, 'PORT RIDERS', 35, 144, 1.6, 1.1);
      }
      e.globalCompositeOperation = 'source-in';
      e.fillStyle = '#181a13';
      e.fillRect(0, 0, 512, 512);
      e.globalCompositeOperation = 'source-over';
    } else {
      rect(17, 145, 478, 202, '#111e20', 126, 95);
      rect(23, 151, 466, 190, '#283432', 129, 95);
      for (const ctx of [a, e]) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(30, 157, 452, 178);
        ctx.strokeStyle = ctx === a ? '#d6d9bc' : '#9dbd96';
        drawLettering(ctx, word, 47, 253, 4.6, 1.35);
        ctx.strokeStyle = accent;
        drawLettering(ctx, 'NIGHT SERVICE', 132, 306, 1.55, 0.95);
      }
    }
    for (let j = 0; j < 500; j++) {
      a.fillStyle = '#0b17151a';
      a.fillRect(rng() * 512, rng() * 512, 1 + rng() * 5, 0.4 + rng() * 2);
    }
  }
  if (id === 'storefront') {
    rect(0, 0, 512, 512, '#172c2e', 128, 70);
    const gradient = a.createLinearGradient(0, 40, 0, 512);
    gradient.addColorStop(0, '#9c9978');
    gradient.addColorStop(0.35, '#7c816d');
    gradient.addColorStop(1, '#2f4946');
    a.fillStyle = gradient;
    a.fillRect(8, 8, 496, 496);
    e.fillStyle = '#655f3f';
    e.fillRect(8, 8, 496, 496);
    for (const ctx of [a, e]) {
      ctx.fillStyle = ctx === a ? '#293c34' : '#242f23';
      ctx.beginPath();
      ctx.moveTo(0, 512);
      ctx.lineTo(100, 305);
      ctx.lineTo(412, 305);
      ctx.lineTo(512, 512);
      ctx.fill();
      ctx.fillStyle = ctx === a ? '#4c5c4c' : '#394632';
      ctx.fillRect(38, 70, 436, 242);
      ctx.fillStyle = '#d5bf80';
      ctx.fillRect(56, 57, 400, 8);
      for (let j = 0; j < 6; j++) {
        ctx.fillStyle = j % 2 ? '#a7a07a' : '#736e4d';
        ctx.fillRect(60 + j * 65, 112, 53, 146);
        ctx.fillStyle = '#34443a';
        ctx.fillRect(66 + j * 65, 125, 41, 65);
        ctx.fillRect(66 + j * 65, 202, 41, 8);
      }
      ctx.fillStyle = '#82704a';
      ctx.fillRect(57, 300, 398, 24);
      ctx.fillStyle = '#433f29';
      ctx.fillRect(57, 324, 398, 60);
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = j % 2 ? '#a67f52' : '#6e8b75';
        ctx.fillRect(82 + j * 73, 263, 38, 34);
      }
      ctx.strokeStyle = ctx === a ? '#e6d899' : '#a39259';
      drawLettering(ctx, 'LATE SERVICE', 125, 105, 1.6, 1.1);
      ctx.fillStyle = '#343f34';
      for (const x of [110, 370]) {
        ctx.fillRect(x, 370, 12, 87);
        ctx.fillRect(x - 22, 359, 56, 16);
      }
    }
    for (const x of [8, 251, 500]) {
      rect(x, 0, 5, 512, '#1e302c', 132, 110);
      e.fillStyle = '#000';
      e.fillRect(x, 0, 5, 512);
    }
    for (const y of [28, 476]) {
      rect(0, y, 512, 5, '#31423b', 132, 110);
      e.fillStyle = '#000';
      e.fillRect(0, y, 512, 5);
    }
    a.fillStyle = '#a5bfb518';
    a.beginPath();
    a.moveTo(20, 0);
    a.lineTo(120, 0);
    a.lineTo(390, 512);
    a.lineTo(310, 512);
    a.fill();
  }
  if (id === 'night-sky') {
    // A painted reflection environment, not a captured room or imported panorama.
    for (let i = 0; i < 90; i++) {
      const x = i * 6 - 3,
        w = 4 + rng() * 6,
        ht = 3 + rng() * 21,
        y = 264 - ht;
      a.fillStyle = rng() > 0.5 ? '#111e20' : '#152225';
      a.fillRect(x, y, w, ht + 17);
      for (let py = y + 3; py < 266; py += 4)
        for (let px = x + 1; px < x + w - 1; px += 2.5)
          if (rng() > 0.65) {
            a.fillStyle = ['#ae9566', '#689891', '#ba7854'][
              Math.floor(rng() * 3)
            ];
            a.fillRect(px, py, 0.8, 1);
          }
    }
    e.drawImage(a.canvas, 0, 0, size, size, 0, 0, 512, 512);
  }
  for (const ctx of [a, h, r, e]) ctx.resetTransform();
  const height = h.getImageData(0, 0, size, size).data,
    n = make(),
    ni = n.createImageData(size, size);
  const at = (x: number, y: number) =>
    height[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * 0.95,
        dy = (at(x, y + 1) - at(x, y - 1)) * 0.95,
        inv = 1 / Math.hypot(dx, dy, 1),
        i = (y * size + x) * 4;
      ni.data[i] = (dx * inv * 0.5 + 0.5) * 255;
      ni.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      ni.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      ni.data[i + 3] = 255;
    }
  n.putImageData(ni, 0, 0);
  const blobs = await Promise.all(
    [a, r, n, e].map((ctx) => ctx.canvas.convertToBlob({ type: 'image/png' })),
  );
  return {
    id,
    seed,
    size,
    label,
    maps: Object.fromEntries(MAPS.map((key, i) => [key, blobs[i]])) as Record<
      MapKind,
      Blob
    >,
  };
}
