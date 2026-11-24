import { valley as terrain, focusFor } from "./viewpoint";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from "pixi.js";
import type { Family, HeritageSite } from "@content/campaign/definitions";
import { building, landmark } from "./architecture";
import {
  cracks,
  drawGranarySupplies,
  drawLivestock,
  drawResources,
  drawRiver,
} from "./landscape";
import { shape, segment, stones } from "./linework";
import {
  drawAttributes,
  drawCrises,
  drawWoods,
  type AttributeSignal,
} from "./signals";

export interface Scene {
  era: number;
  palette: [string, string, string, string];
  tick: number;
  population: number;
  marks?: readonly string[];
  heritage: readonly HeritageSite[];
  traditionLife: Readonly<Record<string, number>>;
  speed: number;
  attributes: readonly AttributeSignal[];
  crises: readonly Family[];
  drought: boolean;
  conflict: boolean;
  camera: number;
  zoom: number;
  reduced: boolean;
}

function homeCount(scene: Scene) {
  return Math.max(
    scene.era + 3,
    Math.min(scene.era + 6, Math.floor(Math.log10(scene.population) * 1.6) + 1),
  );
}

// Lots are measured from the founding square. Later rows fill in behind the original street.
const lots = [
  [-85, 0], [71, -3], [-155, -10], [146, -14], [213, -10], [-216, -17],
  [-119, -33], [109, -38], [188, -39], [-185, -42], [258, -37], [-244, -47],
  [16, -51], [277, -12], [-282, -23],
] as const;

function settlement(g: Graphics, scene: Scene, x: number, warm: string, ill: boolean) {
  const homes = lots.slice(0, homeCount(scene)).map(([dx, y], lot) => ({ dx, y, lot }));
  for (const { dx, y, lot } of homes.sort((a, b) => a.y - b.y)) {
    const size = 59 + (lot * 17) % 16;
    // Different households rebuild in different eras, on the same foundations.
    const style = Math.max(0, scene.era - (scene.era + lot) % 3);
    building(g, x + dx - size / 2, y, size, style, lot, warm, ill);
  }
  landmark(g, scene.era, x, -3, warm);
  if(scene.era>4) { // Reused stone at the edge of the old keep.
    g.rect(x-45,4,27,8).fill("#8e8575");
    for(let i=0;i<4;i++)g.rect(x-45+i*7,0,4,5).fill("#8e8575");
  }
  if(scene.era>5) { // The brass instrument remains beside the rebuilt observatory.
    g.circle(x+35,0,8).stroke({color:"#b39b69",width:2}); segment(g,[x+35,-8,x+35,12],"#776647",2);
  }
  // The worn track becomes a paved road, keeping the bend between the square and the ford.
  const track = [terrain.fields + 30, 29, x - 90, 26, x, 19, x + 162, 28, terrain.river - 125, 12];
  segment(g, track, "#584c39", scene.era < 3 ? 5 : 10);
  segment(g, track, scene.era < 3 ? "#ae9269" : "#b8aa8e", scene.era < 3 ? 3 : 7);
  g.ellipse(x, 20, 36, 10).fill("#a18a68").stroke({ color: "#635744", width: 2 });
  shape(g, [x-26, 20, x-24, -3, x-17, -10, x-12, -6, x-14, 20], "#a49781");
}

function drawHeritage(g: Graphics, scene: Scene) {
  // Older features keep their footprint as the houses around them are rebuilt.
  const outline = "#544536";
  const block = (x: number, y: number, w: number, h: number, color: string) =>
    g.rect(x,y,w,h).fill(color).stroke({color:outline,width:1.5});
  if (scene.marks?.some(mark=>mark==="field" || mark==="unseeded")) {
    for(let i=0;i<6;i++) segment(g,[terrain.fields+40+i*6,45,terrain.fields+56+i*6,36],"#735642",3);
  }
  if (scene.marks?.some(mark=>mark==="hut" || mark==="clan")) {
    const x=terrain.village+75;
    block(x,19,20,16,"#8b7157");shape(g,[x-4,20,x+10,8,x+24,20],"#594431");segment(g,[x+5,25,x+15,31],"#d0b996",2);
  }
  if (scene.marks?.includes("table")) {
    const x=terrain.village-24;block(x,36,28,4,"#cb9c64");block(x+4,40,3,6,"#755333");block(x+21,40,3,6,"#755333");
  }
  if (scene.heritage.includes("hearth")) {
    const x = terrain.village - 63;
    g.ellipse(x,33,13,5).fill("#50493d").stroke({color:"#bbad93",width:3});
    shape(g,[x-6,32,x-3,22,x,26,x+3,16,x+5,31],"#dd9953");
  }
  if (scene.heritage.includes("wheel")) {
    const x = terrain.village - 133;
    for(let i=0;i<3;i++) {
      const a=i*Math.PI/3, dx=10*Math.cos(a),dy=10*Math.sin(a);
      segment(g,[x-dx,20-dy,x+dx,20+dy],outline,2);
    }
    g.circle(x,20,11).stroke({color:"#ae7950",width:4});
  }
  if (scene.heritage.includes("romanRoad")) {
    for(let i=0;i<7;i++) {
      const x=terrain.village+65+i*30, y=23+Math.min(i,4);
      block(x,y,19,4,"#bcb29f");
      if(i%3===0) block(x,y-14,5,13,"#d2c3a9");
    }
  }
  if (scene.heritage.includes("commonBridge")) {
    const x = terrain.river - 86;
    for (let i = 0; i < 4; i++) {
      const left = x + i * 25, y = 6 + i * 13;
      g.moveTo(left, y + 11).quadraticCurveTo(left + 10, y - 10, left + 25, y + 24)
        .stroke({ color: outline, width: 8 });
      g.moveTo(left, y + 10).quadraticCurveTo(left + 10, y - 11, left + 25, y + 23)
        .stroke({ color: "#c0aa8a", width: 6 });
      segment(g, [left, y - 7, left, y + 1], outline, 2);
    }
    segment(g, [x-4, 4, x+106, 61], "#74634f", 7);
    segment(g, [x-4, 2, x+106, 59], "#ceba97", 4);
    segment(g, [x-4, -5, x+106, 52], "#ad9578", 2);
  }
  if (scene.heritage.includes("revolution")) {
    const x=terrain.village+49;
    block(x-8,6,16,23,"#d5c6a6");
    for(let i=0;i<3;i++) segment(g,[x-5,11+i*4,x+5,11+i*4],outline,1);
    block(x-12,28,24,4,"#8c806a");
  }
  if (scene.heritage.includes("worldWars")) {
    const x=terrain.woods-46;
    for(let i=0;i<3;i++) {
      block(x+i*10,8-i%2*5,8,21+i%2*5,"#9a9c98");
      segment(g,[x+i*10+2,15,x+i*10+6,15],"#e1dbcc",1);
    }
    g.ellipse(x+12,31,8,3).fill("#a35248");
  }
  if (scene.heritage.includes("mutualHall")) {
    const x=terrain.village+185;
    block(x,3,37,27,"#be956d");
    shape(g,[x-4,4,x+18,-10,x+41,4],"#8c5f49");
    block(x+14,15,9,15,outline);
    for (const dx of [4,26]) block(x+dx,10,7,6,"#e5c280");
  }
  if (scene.heritage.includes("fair")) {
    const life=scene.traditionLife.fair ?? 1;
    for(let i=0;i<life;i++) {
      const x=terrain.river-118+i*19;
      segment(g,[x,17,x,0,x+14,0,x+14,17],outline,2);
      shape(g,[x-2,0,x+5,-6,x+17,-2,x+18,2],life===1?"#99856e":"#c39259");
    }
  }
  if (scene.heritage.includes("nightSchool")) {
    const life=scene.traditionLife.nightSchool ?? 1, x=terrain.village+248;
    block(x,0,36,26,"#927664");
    shape(g,[x-2,0,x+17,-9,x+38,0],"#63584c");
    for(let i=0;i<3;i++) block(x+4+i*10,7,7,10,i<life?"#f3ce82":"#544e49");
  }
  if (scene.heritage.includes("spring")) {
    const x = terrain.fields + 62;
    g.ellipse(x, 19, 29, 9).fill("#86775e").stroke({color:"#433e33",width:2});
    g.ellipse(x, 17, 24, 6).fill("#75abad");
    for (let i = 0; i < 4; i++)
      stones(g, x + 30 + i * 18, 18 + i % 2 * 3, 1, "#c2ae88");
    segment(g, [x-22, 13, x-17, -5, x-9, -7, x-7, 12], "#bca982", 4);
  }
  if (scene.heritage.includes("seedStore")) {
    const x = terrain.fields - 58;
    landmark(g, 1, x, 9, "#b98a4e");
    for (let i = 0; i < 3; i++)
      g.ellipse(x+20+i*9, 10-i%2*3, 7, 10).fill("#cfad6b").stroke({color:"#715338",width:1.4});
  }
  if (scene.heritage.includes("council")) {
    const x = terrain.village;
    for (let i=0; i<10; i++) {
      const angle = i * Math.PI / 5;
      g.ellipse(x + Math.cos(angle)*32, 21 + Math.sin(angle)*10, 5, 3)
        .fill("#dfceab").stroke({color:"#675b48",width:1.4});
    }
    g.ellipse(x,21,9,3).fill("#544237");
    segment(g,[x-4,20,x,13,x+3,20],"#da9555",2);
  }
}

function layGround(g: Graphics, forest: string, soil: string, river: number) {
  g.clear();
  shape(
    g,
    [
      -2900,
      1,
      -460,
      0,
      -257,
      -3,
      -134,
      3,
      30,
      -4,
      260,
      -2,
      435,
      5,
      river - 108,
      -2,
      river + 185,
      11,
      3600,
      4,
      3600,
      680,
      -2900,
      680,
    ],
    soil,
    "#51402d",
  );
  g.rect(-2900, 41, 6500, 500).fill({ color: "#241c17", alpha: 0.25 });
  for (let i = 0; i < 310; i++) {
    const x = -640 + ((i * 89) % 3100);
    const y = 7 + ((i * 41) % 84);
    g.ellipse(x, y, 3 + (i % 9), 0.8 + (i % 3) * 0.5).fill({
      color: i % 5 === 0 ? "#d3a16c" : "#453428",
      alpha: 0.24,
    });
  }
  for (let i = 0; i < 88; i++) {
    const x = -480 + i * 27;
    const y = 10 + ((i * 19) % 59);
    if (x > river - 130) continue;
    segment(g, [x - 3, y - 3, x, y, x + 5, y - 5], forest, 1.4, 0.55);
  }
}

function foreground(g: Graphics) {
  g.clear();
  shape(
    g,
    [
      -2700, 79, -510, 64, -200, 58, -61, 70, 68, 65, 188, 81, 325, 72, 445, 88,
      617, 76, 821, 81, 1003, 70, 1266, 87, 1613, 76, 3600, 77, 3600, 690,
      -2700, 690,
    ],
    "#1c211d",
    "#27271d",
  );
  for (let i = 0; i < 92; i++) {
    const x = -610 + i * 29;
    const y = 78 + ((i * 7) % 15);
    const height = 9 + ((i * 11) % 22);
    shape(
      g,
      [
        x,
        y + 8,
        x - 6,
        y - height,
        x + 3,
        y - 6,
        x + 9,
        y - height + 2,
        x + 7,
        y + 8,
      ],
      "#1c211d",
      "#1c211d",
    );
  }
}

export async function mountDiorama(host: HTMLElement) {
  const app = new Application();
  await app.init({
    resizeTo: host,
    autoStart: false,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 1.75),
    autoDensity: true,
    background: "#192021",
    preference: "webgl",
    powerPreference: "low-power",
  });
  host.append(app.canvas);
  const base = import.meta.env.BASE_URL + "art/";
  let distant: Texture | null = null;
  let woodsTexture: Texture | null = null;
  try {
    [distant, woodsTexture] = await Promise.all([
      Assets.load<Texture>(base + "valley-distance.webp"),
      Assets.load<Texture>(base + "valley-woods.webp"),
    ]);
  } catch {
    // The linework stays usable if a backdrop fails to load.
  }
  const mountain = distant && new Sprite(distant);
  const woods = woodsTexture && new Sprite(woodsTexture);
  const baseLayer = new Graphics();
  const world = new Container();
  const ground = new Graphics();
  const objects = new Graphics();
  const moving = new Graphics();
  const near = new Graphics();
  const tint = new Graphics();
  world.addChild(ground, objects, moving, near);
  app.stage.addChild(baseLayer);
  if (mountain) app.stage.addChild(mountain);
  if (woods) app.stage.addChild(woods);
  app.stage.addChild(world, tint);
  foreground(near);
  let last: Scene | null = null;
  let lastLandscape = "";
  let counter = 0;
  let illness = false;


  function animate(scene: Scene) {
    moving.clear();
    const phase = scene.reduced ? 0 : counter;
    const x = terrain.village + 18;
    if (scene.era < 2 && !illness) {
      const glow = 1 + Math.sin(phase / 19) * 0.15;
      moving
        .ellipse(x, -7, 25 * glow, 15)
        .fill({ color: "#ed8751", alpha: 0.19 });
      shape(
        moving,
        [x - 9, -4, x - 2, -24 * glow, x + 3, -14, x + 9, -4],
        "#ffc36c",
        "#b6693b",
      );
      stones(moving, x - 18, -1, 3, "#6d5948");
      for (let i = 0; i < 3; i++)
        moving
          .ellipse(
            x + i * 7 + Math.sin(phase / 35 + i) * 3,
            -29 - i * 12,
            6 + i * 3,
            5 + i,
          )
          .fill({ color: "#b4a590", alpha: 0.19 - i * 0.036 });
    } else if (scene.era === 2 || scene.era === 6) {
      const start = scene.era === 2 ? -96 : -152;
      for (let i = 0; i < 4; i++)
        moving
          .ellipse(
            x + i * 11,
            start - i * 9 - Math.sin(phase / 26 + i) * 4,
            10 + i * 4,
            6 + i * 2,
          )
          .fill({ color: "#9d9180", alpha: 0.42 - i * 0.07 });
    }
    const walkers = illness
      ? 1
      : Math.min(8, 2 + Math.floor(Math.log10(scene.population)));
    for (let i = 0; i < walkers; i++) {
      const stride = phase / (illness ? 185 : 100);
      const px =
        x -
        terrain.width * 0.42 +
        i * ((terrain.width * 0.8) / walkers) +
        Math.sin(stride + i * 2) * 16;
      const y = 5 + 6 * (i % 3);
      moving.circle(px, y - 18, 2.5).fill("#41342c");
      moving
        .poly([
          px - 2.5,
          y - 16,
          px + 2.5,
          y - 16,
          px + 4,
          y - 6,
          px - 4,
          y - 6,
        ])
        .fill(i % 2 ? "#a18365" : "#5d4a3d");
      segment(
        moving,
        [px - 1, y - 6, px - 2 + Math.sin(phase / 8 + i), y],
        "#43342b",
        1.6,
      );
      segment(
        moving,
        [px + 1, y - 6, px + 2 - Math.sin(phase / 8 + i), y],
        "#43342b",
        1.6,
      );
    }
    if (!scene.drought) {
      const water = terrain.river + 61;
      const drift = Math.sin(phase / 46) * 10;
      segment(
        moving,
        [water + drift, 57, water + drift + 39, 58],
        "#9ab6af",
        1.3,
        0.6,
      );
    }
  }

  function draw(scene: Scene) {
    last = scene;
    const w = app.screen.width;
    const h = app.screen.height;
    if (w < 1 || h < 1) return;

    const [sky, forest, soil, warm] = scene.palette;
    const groundY = h * 0.68;
    const scale = (w / (terrain.river - terrain.fields + 285)) * scene.zoom;
    const pan = focusFor(scene.camera, terrain);
    const offset = w / 2 - pan * scale;
    const hasBand = (id: string, direction: AttributeSignal["direction"]) =>
      scene.attributes.some(
        (signal) => signal.id === id && signal.direction === direction,
      );
    const scarce =
      hasBand("sustenance", "below") || scene.crises.includes("food");
    const stocked = !scarce && hasBand("sustenance", "above");
    const depleted = hasBand("environment", "below");
    const fertile = hasBand("environment", "above");
    illness = hasBand("health", "below") || scene.crises.includes("health");

    baseLayer.clear().rect(0, 0, w, h).fill(sky);
    if (mountain) {
      mountain.width = w * 1.22;
      mountain.height = h * 0.84;
      mountain.position.set(-w * (scene.camera * 0.16 + 0.02), -h * 0.13);
      mountain.tint =
        scene.era < 6 ? "#d6dac7" : scene.era < 9 ? "#a8bdcc" : "#a9a6e2";
    }
    if (woods) {
      woods.width = w * 1.28;
      woods.height = h * (depleted ? 1.06 : 1.38);
      woods.position.set(
        -w * (scene.camera * 0.23 + 0.02),
        groundY - woods.height * 0.916,
      );
      woods.tint = depleted ? "#acaa8e" : "#e0e3ce";
    }
    world.position.set(offset, groundY);
    world.scale.set(scale);
    // Camera and time updates can reuse the same local-space terrain geometry.
    const landscape = JSON.stringify([
      scene.era,
      scene.palette,
      scene.heritage, scene.marks,
      scene.traditionLife,
      homeCount(scene),
      scene.attributes,
      scene.crises,
      scene.drought,
      scene.conflict,
    ]);
    if (landscape !== lastLandscape) {
      lastLandscape = landscape;
      layGround(ground, forest, soil, terrain.river);
      objects.clear();
      drawWoods(objects, terrain.woods, forest, depleted, fertile);
      drawResources(
        objects,
        terrain.fields,
        scene.era,
        scene.drought,
        scarce,
        stocked,
      );
      if (scene.drought) {
        cracks(objects, terrain.fields - 130, 315, 42);
        cracks(objects, terrain.river - 165, 310, 35);
      }
      settlement(objects, scene, terrain.village, warm, illness);
      if (scene.era === 1) {
        drawGranarySupplies(objects, terrain.village, scarce, stocked);
        drawLivestock(objects, terrain.village + 243, !illness);
      }
      drawRiver(objects, terrain.river, scene.era, scene.drought, depleted);
      drawHeritage(objects, scene);
      drawAttributes(objects, terrain.village, scene.attributes);
      drawCrises(
        objects,
        terrain.village,
        scene.crises,
        illness,
        scene.conflict,
      );
    }
    animate(scene);

    const dusk =
      Math.max(0, -Math.cos((scene.tick / 1440) * Math.PI * 2)) * 0.28;
    const conflict = scene.conflict || scene.crises.includes("clans");
    const haze = scene.crises.includes("state") || depleted;
    tint
      .clear()
      .rect(0, 0, w, h)
      .fill({
        color: conflict
          ? "#713b37"
          : illness
            ? "#6d8867"
            : haze
              ? "#665c52"
              : "#141a35",
        alpha: Math.max(
          dusk,
          conflict ? 0.25 : illness ? 0.31 : haze ? 0.18 : 0,
        ),
      });
    if (scene.speed > 0 && !scene.reduced) app.start();
    else app.stop();
    app.render();
  }

  const resized = new ResizeObserver(() => {
    app.resize();
    if (last) draw(last);
  });
  resized.observe(host);
  app.ticker.add((ticker) => {
    if (!last || last.speed === 0 || last.reduced) return;
    counter += ticker.deltaTime * Math.sqrt(last.speed);
    animate(last);
  });
  return {
    draw,
    destroy() {
      resized.disconnect();
      app.destroy({ removeView: true }, { children: true });
    },
  };
}
