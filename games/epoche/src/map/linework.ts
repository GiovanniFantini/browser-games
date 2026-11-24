import type { Graphics } from "pixi.js";

export function shape(
  g: Graphics,
  points: number[],
  color: string,
  outline = "#221b17",
  alpha = 1,
) {
  g.poly(points)
    .fill({ color, alpha })
    .stroke({ color: outline, width: 1.4, alpha });
}

export function segment(
  g: Graphics,
  points: number[],
  color: string,
  width: number,
  alpha = 1,
) {
  g.moveTo(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2)
    g.lineTo(points[i]!, points[i + 1]!);
  g.stroke({ color, width, alpha });
}

export function arch(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  width: number,
) {
  g.moveTo(x, y)
    .bezierCurveTo(x, y - h, x + w, y - h, x + w, y)
    .stroke({ color, width });
}

export function stones(
  g: Graphics,
  x: number,
  y: number,
  count: number,
  stone: string,
) {
  for (let i = 0; i < count; i++)
    g.ellipse(x + 14 * i, y + (i % 5) * 5, 4 + (i % 7), 2 + (i % 3))
      .fill(stone)
      .stroke({ color: "#594a39", width: 0.8 });
}

export function tree(
  g: Graphics,
  x: number,
  y: number,
  size: number,
  foliage: string,
) {
  const spread = size * 0.34;
  segment(
    g,
    [x - 3, y, x, y - size * 0.74, x + spread * 0.5, y - size * 0.88],
    "#43362c",
    size * 0.063,
  );
  segment(
    g,
    [x - 0.3, y - size * 0.39, x - spread * 0.43, y - size * 0.61],
    "#43362c",
    size * 0.043,
  );
  const canopyY = y - size * 0.68;
  for (let clump = 0; clump < 4; clump++) {
    const cx = x + (clump - 1.5) * spread * 0.42;
    const cy = canopyY - ((clump * 7) % 4) * size * 0.056;
    const edge = Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const rim = 0.8 + ((i * 5 + clump * 3) % 7) * 0.049;
      return [
        cx + Math.cos(angle) * spread * 0.6 * rim,
        cy + Math.sin(angle) * size * 0.22 * rim,
      ];
    }).flat();
    shape(g, edge, clump % 2 ? foliage : "#2b463a", "#24392f");
  }
  for (let i = 0; i < 15; i++) {
    const px = x + (((i * 17) % 29) - 14) * size * 0.022;
    const py = canopyY - size * ((i * 13) % 24) * 0.011;
    segment(
      g,
      [px - 2, py + 1, px, py - 1, px + 3, py + 1],
      "#acb696",
      0.9,
      0.31,
    );
  }
}
