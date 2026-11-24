import type { Graphics } from "pixi.js";
import type { Family } from "@content/campaign/definitions";
import { arch, segment, shape, stones, tree } from "./linework";

export type AttributeSignal = {
  id: string;
  direction: "below" | "above";
};

export function crowd(
  g: Graphics,
  x: number,
  y: number,
  count: number,
  color = "#ded0a5",
) {
  for (let i = 0; i < count; i++) {
    const px = x + (i % 6) * 10 + (i < 6 ? 0 : 5);
    const py = y - (i < 6 ? 0 : 10);
    g.circle(px, py - 12, 2.9).fill(color);
    shape(
      g,
      [px - 2, py - 8, px + 2, py - 8, px + 4, py, px - 4, py],
      color,
      "#312b25",
    );
  }
}

function banner(
  g: Graphics,
  x: number,
  y: number,
  color: string,
  torn = false,
) {
  segment(g, [x, y, x, y - 44], "#b59970", 2.5);
  shape(
    g,
    [
      x,
      y - 43,
      x + 22,
      y - 40,
      x + (torn ? 14 : 22),
      y - 34,
      x + 24,
      y - 27,
      x,
      y - 26,
    ],
    color,
  );
}

function barrier(g: Graphics, x: number, y: number, width: number) {
  segment(g, [x, y - 6, x + width, y - 11], "#a9764e", 5);
  segment(g, [x, y - 13, x + width, y - 17], "#875e44", 4);
  for (let j = 0; j <= width; j += 13)
    segment(g, [x + j, y, x + j + 1, y - 22], "#604b39", 4);
}

export function drawCrises(
  g: Graphics,
  centre: number,
  crises: readonly Family[],
  ill: boolean,
  war: boolean,
) {
  if (ill) {
    for (const x of [centre - 112, centre + 87]) {
      segment(g, [x, -4, x, -61, x + 53, -57, x + 53, -4], "#d4bc95", 2.8);
      shape(
        g,
        [x + 5, -60, x + 24, -58, x + 21, -23, x + 13, -31, x + 8, -26],
        "#222827",
        "#666957",
      );
      shape(
        g,
        [x + 32, -58, x + 47, -57, x + 46, -23, x + 39, -28, x + 37, -22],
        "#222827",
        "#666957",
      );
    }
    segment(g, [centre - 26, -8, centre + 30, -5], "#d3be9f", 2.4);
    g.ellipse(centre + 3, -10, 22, 5)
      .fill("#a89b7a")
      .stroke({ color: "#49493d", width: 1 });
  }
  if (crises.includes("clans")) {
    for (let i = 0; i < 4; i++)
      g.ellipse(
        centre - 20 + i * 18,
        -58 - i * 12,
        15 + i * 3,
        11 + i * 2,
      ).fill({ color: "#343038", alpha: 0.67 });
    crowd(g, centre - 47, 5, 12, "#d0a27e");
    shape(g, [centre + 9, 1, centre + 20, -24, centre + 28, 1], "#f4884c");
    banner(g, centre + 36, 3, "#a34d45", true);
  }
  if (crises.includes("state")) {
    barrier(g, centre - 73, 10, 143);
    banner(g, centre - 70, 5, "#676056", true);
    shape(
      g,
      [centre + 31, 3, centre + 46, -4, centre + 56, 5, centre + 43, 10],
      "#988b72",
    );
    shape(
      g,
      [centre + 62, 8, centre + 80, -8, centre + 88, 2, centre + 85, 10],
      "#6b5a49",
    );
  }
  if (crises.includes("food")) {
    g.roundRect(centre - 150, -12, 48, 12, 5)
      .fill("#5b493e")
      .stroke({ color: "#d6ae76", width: 1.5 });
    for (let i = 0; i < 3; i++)
      arch(g, centre - 145 + i * 14, -12, 12, 4, "#d6ae76", 1.8);
  }
  if (war) {
    const left = centre + 123;
    barrier(g, left, 5, 120);
    for (let i = 0; i < 4; i++) {
      const x = left + 20 + i * 29;
      segment(g, [x, 6, x, -30, x + 3, -35], "#cbad89", 2);
      g.ellipse(x + 5, -9, 4, 7).fill("#9b5944");
    }
    banner(g, left + 57, 0, "#a24139");
  }
}

export function drawAttributes(
  g: Graphics,
  centre: number,
  signals: readonly AttributeSignal[],
) {
  for (const { id, direction } of signals) {
    const high = direction === "above";
    switch (id) {
      // Sustenance, environment and low health change the fields, banks and animals themselves.
      case "health":
        if (high) {
          crowd(g, centre - 106, 11, 4);
          for (let i = 0; i < 5; i++)
            g.circle(centre - 103 + i * 9, 14, 2).fill("#e1c088");
        }
        break;
      case "prosperity": {
        const x = centre - 180;
        const count = high ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const left = x + i * 34;
          segment(
            g,
            [left, 7, left, -32, left + 30, -32, left + 30, 7],
            "#9c7350",
            2,
          );
          shape(
            g,
            [left - 5, -25, left + 2, -38, left + 28, -38, left + 35, -25],
            high ? "#aa7552" : "#463b33",
          );
          if (high) stones(g, left + 3, -6, 2, "#d5a168");
        }
        break;
      }
      case "infrastructure":
        segment(
          g,
          high
            ? [centre - 109, 30, centre + 128, 30]
            : [
                centre - 109,
                30,
                centre - 44,
                30,
                centre - 28,
                40,
                centre + 12,
                27,
                centre + 93,
                35,
              ],
          "#967c63",
          5,
        );
        stones(g, centre - 104, 29, high ? 16 : 5, "#b39472");
        break;
      case "cohesion":
        crowd(g, centre - 86, 14, high ? 8 : 2, "#b99d75");
        if (high)
          segment(
            g,
            [centre - 94, -24, centre - 60, -16, centre - 19, -27],
            "#c5a55e",
            2,
          );
        else crowd(g, centre - 28, 14, 2, "#a07c70");
        break;
      case "stability":
        if (!high) barrier(g, centre + 70, -1, 52);
        else {
          banner(g, centre - 99, -2, "#c2a168");
          banner(g, centre + 99, -2, "#c2a168");
        }
        break;
      case "faith": {
        const x = centre + 145;
        segment(g, [x, -2, x - 1, high ? -61 : -12], "#a7794e", 6);
        if (high)
          shape(g, [x - 10, -50, x, -63, x + 10, -50, x, -40], "#cca273");
        else segment(g, [x - 2, -4, x + 22, -1], "#a7794e", 4);
        break;
      }
      case "culture":
        banner(g, centre - 234, 1, high ? "#a48dba" : "#6f665d", !high);
        if (high) banner(g, centre - 210, 5, "#b1a066");
        break;
      case "knowledge":
        g.rect(centre + 174, -13, 27, 15)
          .fill("#9e7650")
          .stroke({ color: "#4a3a35", width: 1 });
        if (high)
          for (let i = 0; i < 4; i++)
            segment(
              g,
              [centre + 177 + i * 5, -3, centre + 177 + i * 5, -11],
              "#e2c387",
              2,
            );
        else segment(g, [centre + 174, -13, centre + 201, 2], "#544738", 2);
        break;
      case "freedom":
        segment(
          g,
          [
            centre + 211,
            8,
            centre + 211,
            -33,
            centre + 246,
            -33,
            centre + 246,
            8,
          ],
          "#b59e83",
          3,
        );
        if (high) crowd(g, centre + 217, 5, 3);
        else barrier(g, centre + 210, 6, 38);
        break;
      case "military": {
        const x = centre + 258;
        g.ellipse(x, -11, 7, 11)
          .fill(high ? "#b08859" : "#716151")
          .stroke({ color: "#443634", width: 1.4 });
        segment(g, [x - 4, -16, x + 10, high ? -31 : 3], "#c8a681", 2);
        if (high) barrier(g, x + 13, 4, 39);
        break;
      }
      case "innovation":
        g.roundRect(centre - 275, -12, 28, 16, 2).fill("#7d6852");
        g.circle(centre - 264, -17, 9).stroke({
          color: high ? "#ceac74" : "#8d7363",
          width: 3,
        });
        segment(
          g,
          high
            ? [centre - 271, -17, centre - 248, -17, centre - 241, -24]
            : [centre - 272, -9, centre - 248, -3],
          "#d6ad77",
          2,
        );
        break;
      case "prestige":
        g.rect(centre + 280, high ? -27 : -7, 19, high ? 32 : 12)
          .fill("#877c71")
          .stroke({ color: "#443934", width: 1.5 });
        if (high)
          shape(
            g,
            [centre + 277, -28, centre + 289, -57, centre + 301, -28],
            "#be9a6b",
          );
        break;
    }
  }
}

export function drawWoods(
  g: Graphics,
  centre: number,
  foliage: string,
  depleted: boolean,
  abundant: boolean,
) {
  const count = depleted ? 3 : abundant ? 10 : 7;
  for (let i = 0; i < count; i++)
    tree(
      g,
      centre + (i - Math.floor(count / 2)) * 32,
      1 + (i % 3) * 5,
      45 + ((i * 47) % 59),
      foliage,
    );
  if (depleted)
    for (let i = 0; i < 4; i++) {
      const x = centre + (i - 2) * 54;
      segment(g, [x, 7, x + 1, -8], "#75624b", 7);
      g.ellipse(x + 1, -8, 4, 2).fill("#b49165");
    }
}
