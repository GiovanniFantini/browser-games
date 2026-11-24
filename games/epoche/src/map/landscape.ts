import type { Graphics } from "pixi.js";
import { arch, segment, shape, stones } from "./linework";

export function drawResources(
  g: Graphics,
  x: number,
  era: number,
  drought: boolean,
  scarce: boolean,
  stocked: boolean,
) {
  if (era === 0) {
    for (let i = 0; i < (scarce ? 6 : stocked ? 16 : 11); i++) {
      const px = x - 108 + 19 * i;
      const py = (i % 4) * 4;
      g.ellipse(px, py - 5, 13, 8).fill(scarce ? "#7e734c" : "#596b42");
      if (!scarce)
        for (let j = 0; j < 3; j++)
          g.circle(px - 6 + j * 6, py - (j % 2) * 3 - 7, 1.8).fill("#b87b58");
    }
    return;
  }
  if (era >= 7) {
    for (let block = 0; block < 3; block++) {
      const px = x - 116 + block * 86;
      if (era === 8) {
        shape(
          g,
          [px, -7, px + 13, -38, px + 71, -38, px + 54, -7],
          "#476b80",
          "#b1afb0",
        );
        for (let j = 1; j < 5; j++)
          segment(g, [px + j * 11, -8, px + j * 11 + 14, -37], "#788e9d", 1);
        segment(g, [px + 7, -22, px + 63, -22], "#788e9d", 1);
      } else {
        arch(g, px, 3, 72, 49, era === 7 ? "#789178" : "#91bdbd", 4);
        g.roundRect(px + 4, -25, 64, 26, 6).fill({
          color: "#859f86",
          alpha: 0.55,
        });
        for (let j = 1; j < 5; j++)
          segment(g, [px + j * 12, 2, px + j * 12, -26], "#b0ac96", 1);
      }
    }
  }
  const burnt = drought || scarce;
  const crop = drought ? "#bf8c47" : scarce ? "#95754c" : "#c1a559";
  for (let i = 0; i < 52; i++) {
    const px = x - 118 + i * 4.6;
    const py = 5 + (i % 4) * 2.7;
    if (scarce && !drought && i % 3 !== 0) continue;
    const height = burnt ? 8 + (i % 7) : (era >= 7 ? 10 : 20) + (i % 8);
    const bend = burnt ? 6 : 2;
    segment(
      g,
      [px, py, px + 1, py - height * 0.65, px + bend, py - height],
      crop,
      1.7,
    );
    if (!scarce) g.ellipse(px + bend, py - height, 1.8, 3.1).fill(crop);
  }
  if (era >= 2 && era <= 5 && !drought)
    segment(g, [x - 131, 19, x + 117, 25, x + 152, 15], "#66817b", 3, 0.75);
  if (stocked && era >= 2) {
    for (let i = 0; i < 5; i++) {
      const left = x + 76 + i * 16;
      const bottom = 25 + (i % 2) * 3;
      g.rect(left, bottom - 13, 14, 13)
        .fill("#b28653")
        .stroke({ color: "#5b4535", width: 1.4 });
      segment(
        g,
        [left + 3, bottom - 10, left + 11, bottom - 2],
        "#755f47",
        1.5,
      );
    }
  }
}

export function cracks(g: Graphics, x: number, width: number, depth: number) {
  for (let i = 0; i < 18; i++) {
    const px = x + (i * width) / 18;
    const y = 7 + ((i * 17) % depth);
    segment(
      g,
      [px - 4, y, px + 4, y + 6, px - 1, y + 12, px + 9, y + 18],
      "#50362b",
      2,
    );
    segment(g, [px + 4, y + 6, px + 15, y + 5], "#50362b", 1.2);
  }
}

export function drawLivestock(g: Graphics, x: number, healthy: boolean) {
  for (let i = 0; i < (healthy ? 3 : 1); i++) {
    const px = x + i * 34;
    const py = -11 - (i % 2) * 3;
    g.ellipse(px, py, 12, 6)
      .fill("#9e866c")
      .stroke({ color: "#433324", width: 1 });
    g.ellipse(px + 12, py - 4, 4.4, 3.4).fill("#b9a883");
    segment(g, [px - 6, py + 3, px - 6, py + 10], "#604a38", 1.6);
    segment(g, [px + 6, py + 3, px + 7, py + 10], "#604a38", 1.6);
  }
  segment(g, [x - 19, -9, x + 97, -7], "#875c3e", 2.8);
  segment(g, [x - 19, -3, x + 97, -2], "#644631", 2.3);
  for (let j = 0; j < 10; j++)
    g.rect(x - 19 + j * 13, -13, 2.2, 15).fill("#755637");
}

export function drawGranarySupplies(
  g: Graphics,
  x: number,
  scarce: boolean,
  stocked: boolean,
) {
  if (scarce) {
    g.rect(x - 24, -63, 38, 33).fill("#3b332a");
    shape(g, [x - 23, -63, x - 34, -53, x - 35, -24, x - 23, -30], "#7d674d");
  } else if (stocked) {
    for (let j = 0; j < 4; j++)
      g.ellipse(x - 15 + j * 10, -39, 4.8, 6.5)
        .fill("#cba069")
        .stroke({ color: "#5e4a35", width: 1 });
    segment(g, [x - 24, -34, x + 21, -34], "#9f7550", 3.5);
  }
}

export function drawRiver(
  g: Graphics,
  x: number,
  era: number,
  drought: boolean,
  depleted: boolean,
) {
  const stream = drought ? 13 : 31;
  shape(
    g,
    [
      x - 236,
      -9,
      x - 168,
      -6,
      x - 105,
      5,
      x - 54,
      11,
      x + 13,
      19,
      x + 138,
      36,
      x + 477,
      28,
      x + 2200,
      32,
      x + 2200,
      54 + stream,
      x + 478,
      56 + stream,
      x + 126,
      57 + stream,
      x - 2,
      34 + stream,
      x - 68,
      19 + stream * 0.5,
      x - 147,
      7,
      x - 201,
      -2,
    ],
    depleted ? "#557370" : "#5f878c",
    "#475b53",
  );
  segment(
    g,
    [x - 155, 3, x - 55, 15, x + 35, 31, x + 123, 38, x + 236, 46, x + 450, 43],
    "#87aba8",
    1.4,
    0.75,
  );
  stones(
    g,
    x - 172,
    drought ? 15 : 26,
    drought ? 23 : 15,
    drought ? "#ac8d6b" : "#8a7862",
  );
  stones(g, x + 15, 66, 19, "#9b8367");
  if (era >= 3 && era <= 5) {
    const deck = x - 18;
    segment(g, [deck - 77, 7, deck + 16, 24], "#77614c", 5);
    for (let j = 0; j < 4; j++)
      segment(
        g,
        [deck - 52 + 14 * j, 11 + 3 * j, deck - 52 + 14 * j, 31 + 3 * j],
        "#594635",
        3,
      );
    shape(g, [x + 30, 39, x + 74, 36, x + 61, 52, x + 40, 51], "#916e4f");
    segment(g, [x + 51, 38, x + 51, 7], "#7c6049", 2);
    shape(g, [x + 51, 7, x + 70, 33, x + 52, 36], "#c8b790");
  }
}
