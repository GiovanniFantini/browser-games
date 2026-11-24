import type { Graphics } from "pixi.js";
import { shape, segment, arch, stones } from "./linework";

const materials = [
  "#846542",
  "#ae845b",
  "#a57558",
  "#b29a7c",
  "#8d806a",
  "#a78b73",
  "#a9816b",
  "#80929e",
  "#6b8a94",
  "#8ca0a4",
];

export function building(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  era: number,
  variant: number,
  warm: string,
  dark: boolean,
) {
  const roof = warm;
  const stone = dark ? "#5f5147" : materials[era]!;
  const ink = "#332a24";
  const doorway = dark ? "#241f20" : "#432f24";
  if (era === 0) {
    shape(
      g,
      [x, y, x + width * 0.48, y - width * 0.83, x + width, y],
      "#72583d",
    );
    shape(
      g,
      [
        x + width * 0.43,
        y,
        x + width * 0.47,
        y - width * 0.32,
        x + width * 0.65,
        y,
      ],
      doorway,
    );
    g.moveTo(x + width * 0.48, y - width * 0.83)
      .lineTo(x + width * 0.51, y - width)
      .stroke({ color: "#816b49", width: 2 });
    return;
  }
  const high =
    width *
    (era >= 6
      ? 0.74 + (era - 6) * 0.24 + (variant % 3) * 0.22
      : era >= 4
        ? 0.76
        : 0.63);
  const walls = [x, y, x, y - high, x + width, y - high, x + width, y];
  if (era >= 9 && variant % 2 === 0) {
    g.ellipse(x + width / 2, y - high * 0.47, width * 0.52, high * 0.59)
      .fill("#59748a")
      .stroke({ color: "#a0a7ad", width: 1.4 });
    g.moveTo(x + width * 0.14, y - high * 0.45)
      .lineTo(x + width * 0.84, y - high * 0.45)
      .stroke({ color: "#b2c0a9", width: 1.6 });
    g.rect(x + width * 0.35, y - high * 0.29, width * 0.3, high * 0.29).fill(
      doorway,
    );
    return;
  }
  shape(g, walls, stone, ink);
  for (let detail = 0; detail < 9; detail++) {
    const left = x + 4 + ((detail * 17 + variant * 7) % (width - 12));
    const bottom = y - 6 - ((detail * 13 + variant * 11) % (high - 12));
    segment(
      g,
      [left, bottom, left + 4 + (detail % 3), bottom + (detail % 2)],
      ink,
      0.8,
      0.24,
    );
  }
  if (era <= 1 || era === 4 || era === 5) {
    shape(
      g,
      [
        x - 6,
        y - high + 3,
        x + width * 0.52,
        y - high - width * 0.42,
        x + width + 6,
        y - high + 3,
      ],
      era === 1 ? "#a77946" : "#6c4c3c",
      ink,
    );
    for (let s = 1; s < 8; s++) {
      const left = x + width * (0.06 + s / 9);
      g.moveTo(left, y - high + 1)
        .lineTo(
          x + width * 0.52 + (left - x - width * 0.52) * 0.48,
          y - high - width * 0.21,
        )
        .stroke({ color: roof, width: 1, alpha: 0.35 });
    }
  } else if (era === 3) {
    shape(
      g,
      [
        x - 6,
        y - high,
        x + width / 2,
        y - high - width * 0.33,
        x + width + 6,
        y - high,
      ],
      "#a68d71",
      ink,
    );
    for (let s = 1; s <= 4; s++)
      g.rect(x + (width * s) / 5, y - high + 4, 3, high - 4).fill("#c0aa92");
  } else {
    g.rect(x - 2, y - high - 5, width + 4, 6)
      .fill(roof)
      .stroke({ color: ink, width: 1 });
  }
  if (era === 6 || (era === 7 && variant % 2 === 0)) {
    g.rect(x + width - 12, y - high - width * 0.54, 8, width * 0.56)
      .fill("#765649")
      .stroke({ color: ink, width: 1 });
    g.circle(x + width - 8, y - high - width * 0.67, 7).fill({
      color: "#625c59",
      alpha: 0.54,
    });
    g.circle(x + width - 2, y - high - width * 0.83, 10).fill({
      color: "#756b61",
      alpha: 0.38,
    });
  }
  g.rect(
    x + width * 0.43,
    y - Math.min(24, high * 0.52),
    Math.max(8, width * 0.17),
    Math.min(24, high * 0.52),
  ).fill(doorway);
  const rows = era >= 7 ? 4 : era >= 4 ? 2 : 1;
  for (let row = 0; row < rows; row++)
    for (const part of [0.18, 0.68]) {
      g.rect(
        x + width * part,
        y - high * (0.8 - row * 0.17),
        era >= 7 ? 8 : 5,
        5,
      ).fill(dark ? "#464039" : "#e6bb76");
    }
}

export function landmark(
  g: Graphics,
  era: number,
  x: number,
  y: number,
  warm: string,
) {
  const shade = "#312e29";
  switch (era) {
    case 0: // Windbreak at the gathering ground.
      for (let i = 0; i < 5; i++) {
        const post = x - 34 + 14 * i;
        segment(g, [post, y, post + 7, y - 25], "#745b41", 3);
      }
      g.ellipse(x, y - 23, 34, 6).fill("#8c7551");
      break;
    case 1: // Raised granary with clear space underneath.
      for (const post of [-26, 24])
        segment(g, [x + post, y, x + post, y - 60], "#62432c", 6);
      g.rect(x - 30, y - 65, 60, 35)
        .fill("#987151")
        .stroke({ color: shade, width: 2 });
      for (let i = 0; i < 5; i++)
        segment(
          g,
          [x - 29, y - 34 - 6 * i, x + 29, y - 34 - 6 * i],
          "#624a34",
          1.4,
        );
      shape(g, [x - 36, y - 63, x - 2, y - 83, x + 34, y - 65], warm);
      segment(
        g,
        [x + 33, y, x + 12, y - 30, x + 15, y, x - 5, y - 30],
        "#794e33",
        2,
      );
      break;
    case 2: // Furnace and copper workings.
      shape(
        g,
        [
          x - 50,
          y,
          x - 38,
          y - 48,
          x - 18,
          y - 71,
          x + 13,
          y - 71,
          x + 33,
          y - 49,
          x + 45,
          y,
        ],
        "#8e5741",
      );
      g.rect(x - 24, y - 76, 43, 9).fill("#ad7754");
      g.roundRect(x - 21, y - 26, 40, 26, 10).fill(shade);
      g.ellipse(x - 1, y - 7, 16, 6).fill("#ee914c");
      for (let i = 0; i < 5; i++)
        g.rect(x + 47 + (i % 3) * 8, y - 7 - Math.floor(i / 3) * 6, 8, 5).fill(
          "#be7a59",
        );
      break;
    case 3: // An aqueduct serving the stone forum.
      for (let i = 0; i < 4; i++) {
        const pier = x - 112 + i * 51;
        g.rect(pier, y - 77, 10, 77).fill("#bea585");
        arch(g, pier + 5, y - 45, 50, 32, "#bea585", 9);
      }
      g.rect(x - 116, y - 86, 217, 15)
        .fill("#9e896f")
        .stroke({ color: shade, width: 1 });
      break;
    case 4: // Battlements around a stone keep.
      for (const [left, width, height] of [
        [-60, 31, 80],
        [-33, 75, 117],
        [28, 31, 87],
      ] as const) {
        g.rect(x + left, y - height, width, height)
          .fill("#837b69")
          .stroke({ color: shade, width: 2 });
        for (let merlon = 0; merlon < width - 5; merlon += 13)
          g.rect(x + left + merlon, y - height - 6, 8, 7).fill("#9f967e");
        g.rect(x + left + width * 0.5, y - height + 19, 5, 16).fill(shade);
      }
      g.roundRect(x - 10, y - 35, 22, 35, 6).fill(shade);
      break;
    case 5: // Observatory with dome and exposed instrument.
      g.rect(x - 41, y - 62, 82, 62)
        .fill("#a38b72")
        .stroke({ color: shade, width: 2 });
      arch(g, x - 42, y - 64, 84, 46, "#6d8b80", 33);
      g.rect(x - 47, y - 66, 94, 9).fill("#c4a477");
      segment(g, [x - 10, y - 92, x + 30, y - 119], "#d5b17a", 8);
      g.rect(x - 9, y - 35, 18, 35).fill(shade);
      break;
    case 6: // Brick works by the railway.
      g.rect(x - 76, y - 47, 149, 47)
        .fill("#914f3c")
        .stroke({ color: shade, width: 2 });
      for (let i = 0; i < 3; i++) {
        const part = x - 76 + 49 * i;
        shape(
          g,
          [part, y - 46, part + 28, y - 68, part + 49, y - 46],
          "#5b524a",
        );
        g.rect(part + 11, y - 35, 29, 13).fill("#e2a978");
        segment(g, [part + 25, y - 35, part + 25, y - 22], shade, 2);
      }
      for (const b of [-49, 37])
        g.rect(
          x + b,
          y - 147 + (b > 0 ? 24 : 0),
          12,
          113 - (b > 0 ? 24 : 0),
        ).fill("#694136");
      break;
    case 7: // High-rise with pedestrian bridge.
      for (const [left, width, height] of [
        [-67, 51, 126],
        [23, 50, 162],
      ] as const) {
        g.rect(x + left, y - height, width, height)
          .fill("#718394")
          .stroke({ color: shade, width: 2 });
        for (let floor = 14; floor < height - 8; floor += 13)
          g.rect(x + left + 5, y - floor, width - 10, 4).fill(
            floor % 3 ? "#b9bdad" : "#546c7b",
          );
      }
      segment(g, [x - 31, y - 45, x + 42, y - 45], "#69727c", 12);
      segment(g, [x - 31, y - 47, x + 42, y - 47], "#b7bfba", 4);
      break;
    case 8: // Communications hub.
      g.rect(x - 55, y - 85, 110, 85)
        .fill("#66838e")
        .stroke({ color: shade, width: 2 });
      for (let row = 1; row < 6; row++)
        g.rect(x - 50, y - row * 13, 100, 5).fill("#a8c7c4");
      segment(g, [x - 17, y - 87, x, y - 162, x + 17, y - 87], "#93a5a5", 3);
      segment(g, [x, y - 121, x + 27, y - 140], "#a8b5ba", 3);
      shape(
        g,
        [
          x + 13,
          y - 161,
          x + 20,
          y - 145,
          x + 34,
          y - 135,
          x + 48,
          y - 134,
          x + 41,
          y - 145,
        ],
        "#a8c7c4",
      );
      g.circle(x, y - 162, 4).fill("#dd885c");
      break;
    case 9: // Elevated habitat and pressurized greenhouse.
      segment(g, [x - 45, y, x - 12, y - 136, x + 38, y], "#889ba9", 8);
      g.ellipse(x, y - 128, 72, 21)
        .fill("#a5bcc2")
        .stroke({ color: shade, width: 2 });
      g.ellipse(x, y - 141, 60, 16).fill("#657da1");
      segment(g, [x - 46, y - 139, x + 46, y - 139], "#d1e4cc", 3);
      g.ellipse(x + 86, y - 13, 33, 27)
        .fill("#587973")
        .stroke({ color: "#a6b9a0", width: 2 });
      g.ellipse(x + 86, y - 13, 16, 27).stroke({
        color: "#a6b9a0",
        width: 1.5,
      });
      stones(g, x + 52, y + 9, 6, "#817b70");
      break;
  }
}
