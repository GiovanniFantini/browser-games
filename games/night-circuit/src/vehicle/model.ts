import { bodyGeometry, batchBodywork } from './bodywork';
import career from '../data/career.json';
import * as THREE from 'three';
import {
  defaultAppearance,
  visualCatalog,
  type Appearance,
} from '../tuning/appearance';
import { vinylTexture } from '../tuning/vinyl';
import { sideVinylGeometry } from '../tuning/vinyl-surface';

export interface StudioPose {
  doors: boolean;
  hood: boolean;
  hatch: boolean;
}
const closed: StudioPose = { doors: false, hood: false, hatch: false };
export function createCar(
  options: {
    color?: string;
    simple?: boolean;
    appearance?: Appearance;
    model?: string;
  } = {},
) {
  const a = options.appearance ?? defaultAppearance(),
    simple = !!options.simple;
  const spec =
    career.models.find((m) => m.id === options.model) ?? career.models[0];
  const maker = career.makers.find((m) => m.id === spec.maker)!,
    design = spec.design;
  const cabinWidth =
    design.roofWidth * (spec.family === 'prototype' ? 0.68 : 1);
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const finish = visualCatalog.slots.finish.options[a.parts.finish];
  const paint = new THREE.MeshPhysicalMaterial({
    color: options.color ?? a.paint,
    metalness: finish.metalness,
    roughness: finish.roughness,
    clearcoat: finish.clearcoat,
  });
  if ('shift' in finish) {
    const shift = finish.shift ?? 0;
    paint.onBeforeCompile = (shader) => {
      shader.uniforms.shiftColor = { value: new THREE.Color(a.secondary) };
      shader.fragmentShader =
        'uniform vec3 shiftColor;\n' +
        shader.fragmentShader.replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\ndiffuseColor.rgb = mix(diffuseColor.rgb, shiftColor, pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.0)*${shift.toFixed(2)});`,
        );
    };
    paint.customProgramCacheKey = () => `angle-paint-${a.parts.finish}`;
  }
  const dark = new THREE.MeshStandardMaterial({
    color: 0x101923,
    roughness: 0.72,
    metalness: 0.2,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: a.rims,
    roughness: 0.28,
    metalness: 0.85,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x173540,
    transparent: true,
    opacity: 0.22 + a.tint * 0.72,
    roughness: 0.12,
    metalness: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const headlight = new THREE.MeshBasicMaterial({ color: a.headColor });
  const tailMaterial = new THREE.MeshBasicMaterial({ color: a.tailColor });
  const tailColor = new THREE.Color(a.tailColor);
  const caliper = new THREE.MeshStandardMaterial({
    color: a.calipers,
    roughness: 0.4,
    metalness: 0.45,
  });
  const carbonData = new Uint8Array(8 * 8 * 4);
  for (let i = 0; i < 64; i++) {
    const value = (Math.floor(i / 8) + (i % 8)) % 2 ? 52 : 25;
    carbonData.set([value, value + 3, value + 5, 255], i * 4);
  }
  const carbonMap = new THREE.DataTexture(carbonData, 8, 8);
  carbonMap.repeat.set(8, 8);
  carbonMap.wrapS = carbonMap.wrapT = THREE.RepeatWrapping;
  carbonMap.needsUpdate = true;
  textures.push(carbonMap);
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x79848e,
    map: carbonMap,
    roughness: 0.4,
    metalness: 0.35,
  });
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    parent: THREE.Object3D = root,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(
    radius: number,
    length: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    parent: THREE.Object3D = root,
    axis: 'x' | 'z' = 'x',
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 12),
      material,
    );
    mesh.rotation[axis === 'x' ? 'z' : 'x'] = Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  const kit = visualCatalog.slots.kit.options[a.parts.kit],
    width = kit.width,
    depth = kit.depth;
  const shell = new THREE.Mesh(
    bodyGeometry(spec.family === 'single' ? 1.05 : 1.86, design, spec.family),
    paint,
  );
  shell.castShadow = shell.receiveShadow = true;
  root.add(shell);
  box(spec.family === 'single' ? 0.8 : 1.78, 0.16, 4.25, 0, -0.18, 0, dark);
  const wheels: THREE.Group[] = [],
    spinners: THREE.Group[] = [],
    calipers: THREE.Group[] = [];
  const engine = new THREE.Group();
  root.add(engine);
  const hood = new THREE.Group();
  hood.position.set(0, 0.27, 0.3);
  hood.scale.z = design.hoodScale;
  root.add(hood);
  box(
    1.7,
    0.09,
    1.55,
    0,
    0.075,
    0.77,
    a.parts.hood === 2 ? carbon : paint,
    hood,
  ).rotation.x = spec.hoodSlope;
  const hatch = new THREE.Group();
  hatch.position.set(
    0,
    spec.family === 'sedan' ? 0.6 : spec.family === 'coupe' ? 0.72 : 0.83,
    -0.95 + design.deckOffset,
  );
  hatch.scale.z = design.rearScale;
  root.add(hatch);
  const roofPanel = box(
    1.48,
    0.06,
    1.22 * spec.cabin,
    0,
    0.85,
    -0.5 + spec.cabinOffset,
    a.parts.roof === 2 ? carbon : paint,
  );
  roofPanel.name = 'roof-surface';
  roofPanel.scale.x = cabinWidth;
  if (spec.family === 'single') {
    roofPanel.position.set(0, 0.25, -1.25);
    roofPanel.scale.set(1 / 1.48, 1, 1.2 / (1.22 * spec.cabin));
  }
  const doorGroups: THREE.Group[] = [];
  if (simple) {
    box(1.48, 0.53, 1.7, 0, 0.56, -0.35, glass);
    box(1.5, 0.1, 0.04, 0, 0.15, -2.04, tailMaterial);
    box(1.5, 0.08, 0.04, 0, 0.24, 2.035, headlight);
  } else {
    const windscreen = box(
      spec.family === 'single' ? 0.6 : 1.46 * cabinWidth,
      0.045,
      spec.family === 'single' ? 0.35 : 1.05,
      0,
      0.54,
      0.43 + spec.cabinOffset,
      glass,
    );
    windscreen.rotation.x = -design.screenAngle;
    if (spec.family !== 'single') {
      const angle = Math.abs(design.screenAngle),
        half = 0.525;
      windscreen.scale.z = Math.min(
        1,
        (0.225 - Math.cos(angle) * 0.0225) / (Math.sin(angle) * half),
      );
      const extent =
        Math.sin(angle) * half * windscreen.scale.z + Math.cos(angle) * 0.0225;
      windscreen.position.y = roofPanel.position.y - extent;
      windscreen.position.z =
        roofPanel.position.z +
        0.61 * spec.cabin +
        Math.cos(angle) * half * windscreen.scale.z -
        0.015;
    }
    const rearGlass = box(
      1.43 * cabinWidth,
      0.045,
      0.8,
      0,
      -0.18,
      -0.34,
      glass,
      hatch,
    );
    rearGlass.rotation.x = -design.rearAngle;
    const rearAngle = Math.abs(design.rearAngle);
    rearGlass.scale.z = Math.min(
      1,
      (0.225 - Math.cos(rearAngle) * 0.0225) / (Math.sin(rearAngle) * 0.4),
    );
    rearGlass.position.y =
      roofPanel.position.y -
      hatch.position.y -
      (Math.sin(rearAngle) * 0.4 * rearGlass.scale.z +
        Math.cos(rearAngle) * 0.0225);
    rearGlass.position.z =
      (roofPanel.position.z - 0.61 * spec.cabin - hatch.position.z) /
        hatch.scale.z -
      Math.cos(rearAngle) * 0.4 * rearGlass.scale.z +
      0.015;
    windscreen.name = 'front-glazing';
    rearGlass.name = 'rear-glazing';
    box(1.72, 0.08, 0.75, 0, -0.48, -0.73, paint, hatch);
    if (spec.family === 'sedan')
      box(1.62, 0.12, 0.9 * design.rearScale, 0, 0.31, -1.48, paint);
    if (spec.family === 'coupe') box(1.5, 0.08, 0.7, 0, 0.38, -1.1, paint);
    if (spec.family === 'compact') box(1.52, 0.17, 0.12, 0, 0.44, -1.77, paint);
    for (const side of [-1, 1]) {
      const door = new THREE.Group();
      door.position.set(side * 0.91, 0.22, 0.5);
      root.add(door);
      doorGroups.push(door);
      if (spec.family === 'single') door.visible = false;
      box(0.045, 0.32, 1.35, side * 0.015, 0.08, -0.67, paint, door);
      const upperX = side * (0.73 * cabinWidth - 0.91);
      const windowGeometry = new THREE.BufferGeometry();
      windowGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          [
            side * 0.015,
            0.24,
            -1.27,
            side * 0.015,
            0.24,
            -0.07,
            upperX,
            0.6,
            -1.27,
            upperX,
            0.6,
            -0.07,
          ],
          3,
        ),
      );
      windowGeometry.setIndex([0, 1, 2, 1, 3, 2]);
      windowGeometry.computeVertexNormals();
      door.add(new THREE.Mesh(windowGeometry, glass));
      box(0.055, 0.05, 1.35, upperX, 0.61, -0.67, paint, door);
      const mirror = a.parts.mirrors;
      box(
        mirror === 2 ? 0.3 : 0.22,
        0.12,
        mirror === 1 ? 0.23 : 0.33,
        side * ((spec.family === 'single' ? 0.48 : 1.02) + mirror * 0.035),
        0.4,
        0.44,
        mirror ? paint : dark,
      );
      if (spec.family !== 'single')
        box(
          0.09,
          0.48,
          0.1,
          side * 0.73 * cabinWidth,
          0.53,
          -1.12,
          paint,
        ).rotation.x = 0.2;
      if (spec.family !== 'single')
        box(
          0.1,
          0.46,
          0.09,
          side * 0.73 * cabinWidth,
          0.53,
          0.48,
          paint,
        ).rotation.x = -0.2;
      box(
        0.12 + a.parts.skirts * 0.045,
        0.14 + a.parts.skirts * 0.025,
        2.7,
        side * 0.94 * width,
        -0.14,
        0,
        a.parts.skirts === 2 ? carbon : paint,
      );
      if (a.parts.kit) {
        for (const z of [-1.33, 1.33])
          box(0.14, 0.22, 0.94, side * 0.94 * width, 0.06, z, paint);
        box(0.07, 0.12, 1.6, side * 0.99 * width, -0.18, 0, dark);
      }
      box(0.55, 0.12, 0.16, side * 0.59, 0.11, 2.04 * depth, headlight);
      box(0.6, 0.11, 0.05, side * 0.58, 0.15, -2.04, tailMaterial);
      if (a.parts.lights === 1)
        for (let n = 0; n < 3; n++)
          box(
            0.035,
            0.16,
            0.18,
            side * 0.59 + (n - 1) * 0.18,
            0.11,
            2.13 * depth,
            dark,
          );
      if (a.parts.lights === 2) {
        box(0.6, 0.16, 0.17, side * 0.59, 0.11, 2.06 * depth, dark);
        for (let n = 0; n < 2; n++)
          cylinder(
            0.09,
            0.045,
            side * 0.59 + (n - 0.5) * 0.26,
            0.13,
            2.17 * depth,
            headlight,
            root,
            'z',
          );
      }
      box(0.06, 0.03, 0.5, side * 0.65, 0.28, -0.45, dark);
      if (spec.family !== 'single') {
        box(0.4, 0.49, 0.4, side * 0.42, 0.48, -0.37, dark);
        box(0.4, 0.13, 0.5, side * 0.42, 0.25, -0.2, dark);
      }
    }
    box(
      1.88 * width,
      0.16 + a.parts.front * 0.045,
      0.22 + a.parts.front * 0.09,
      0,
      -0.12,
      2.03 * depth,
      paint,
    );
    box(1.55, 0.065, 0.12, 0, -0.21, 2.17 * depth + a.parts.front * 0.08, dark);
    box(
      1.9 * width,
      0.18,
      0.25 + a.parts.rear * 0.1,
      0,
      -0.1,
      -2.02 * depth,
      paint,
    );
    if (a.parts.rear)
      for (let i = -2; i <= 2; i++)
        box(0.04, 0.13, 0.4, i * 0.28, -0.23, -2.08 * depth, carbon);
    if (a.parts.front) {
      box(0.74, 0.13, 0.04, 0, -0.1, 2.18 * depth, dark);
      if (a.parts.front === 2)
        box(0.09, 0.15, 0.07, 0, -0.1, 2.24 * depth, paint);
    }
    if (a.parts.kit === 1) box(1.98, 0.055, 0.42, 0, -0.23, 2.15, dark);
    if (a.parts.kit === 2)
      for (const side of [-1, 1])
        for (let n = 0; n < 3; n++)
          box(
            0.08,
            0.055,
            0.4,
            side * 1.03,
            0.05 + n * 0.08,
            1.1,
            dark,
          ).rotation.z = side * 0.18;
    if (a.parts.kit === 3)
      for (const side of [-1, 1]) {
        box(0.22, 0.13, 1.2, side * 1.02, 0.17, -1.3, carbon);
        box(0.12, 0.34, 0.35, side * 0.88, 0.35, -1.8, paint);
      }
    if (a.parts.kit === 4) {
      box(0.48, 0.06, 1.75, 0, 0.31, 1.05, carbon);
      for (const side of [-1, 1])
        box(0.23, 0.22, 0.3, side * 0.78, -0.04, 2.16, dark);
    }
    if (a.parts.kit === 5)
      for (const side of [-1, 1]) {
        box(0.25, 0.24, 1.5, side * 1.02, -0.03, -0.25, paint);
        box(0.07, 0.3, 0.65, side * 0.97, 0.32, -1.7, carbon).rotation.z =
          side * 0.2;
      }
    if (a.parts.spoiler) {
      for (const side of [-1, 1])
        box(
          0.08,
          0.2 + a.parts.spoiler * 0.1,
          0.12,
          side * 0.56,
          0.4,
          -1.78,
          dark,
        );
      box(
        1.6 + a.parts.spoiler * 0.1,
        0.06,
        0.33,
        0,
        0.51 + a.parts.spoiler * 0.1,
        -1.8,
        carbon,
      );
      if (a.parts.spoiler === 2) box(1.65, 0.05, 0.22, 0, 0.5, -1.72, paint);
    }
    if (a.parts.hood) {
      box(0.44, 0.14, 0.5, 0, 0.15, 0.7, dark, hood);
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++)
          box(0.22, 0.016, 0.04, side * 0.48, 0.14, 0.6 + i * 0.12, dark, hood);
    }
    if (a.parts.roof === 1)
      box(0.48, 0.14, 0.4, 0, 0.1, 0.28, dark, roofPanel).name = 'roof-intake';
    const fuel = cylinder(
      0.105 + a.parts.fuel * 0.015,
      0.04,
      spec.family === 'single' ? 0.33 : 0.955,
      spec.family === 'single' ? 0.3 : 0.18,
      -1.43,
      a.parts.fuel ? silver : paint,
    );
    if (spec.family === 'single') fuel.rotation.z = 0;
    if (a.parts.fuel === 2) {
      const insert = cylinder(
        0.055,
        0.045,
        spec.family === 'single' ? 0.33 : 0.98,
        spec.family === 'single' ? 0.31 : 0.18,
        -1.43,
        dark,
      );
      if (spec.family === 'single') insert.rotation.z = 0;
    }
    // Interior and rear audio remain visible through the glazing and open hatch.
    box(
      spec.family === 'single' ? 0.65 : 1.35,
      0.16,
      0.38,
      0,
      0.29,
      0.25,
      dark,
    );
    cylinder(
      0.14,
      0.04,
      spec.family === 'single' ? 0 : -0.4,
      0.5,
      0.15,
      silver,
      root,
      'z',
    );
    box(spec.family === 'single' ? 0.8 : 1.38, 0.07, 0.7, 0, 0.25, -1.43, dark);
    if (a.parts.audio)
      for (let i = 0; i < (a.parts.audio === 2 ? 4 : 2); i++) {
        const count = a.parts.audio === 2 ? 4 : 2;
        const speaker = cylinder(
          0.14,
          0.07,
          (i - (count - 1) / 2) * (spec.family === 'single' ? 0.19 : 0.31),
          spec.family === 'single' ? 0.32 : 0.34,
          -1.46,
          dark,
        );
        speaker.rotation.set(0, 0, 0);
        const cone = cylinder(
          0.1,
          0.08,
          (i - (count - 1) / 2) * (spec.family === 'single' ? 0.19 : 0.31),
          0.36,
          -1.46,
          silver,
        );
        cone.rotation.set(0, 0, 0);
      }
    box(0.72, 0.1, 0.6, 0, 0.31, 1.05, dark, engine);
    for (let i = 0; i < 4; i++)
      box(0.08, 0.12, 0.5, (i - 1.5) * 0.15, 0.4, 1.05, silver, engine);
    for (const side of ['left', 'right', 'hood', 'roof'] as const) {
      const texture = vinylTexture(a.vinyls, side);
      if (!texture) continue;
      textures.push(texture);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh<THREE.BufferGeometry>(
        new THREE.PlaneGeometry(
          side === 'left' || side === 'right' ? 3.8 : 1.45,
          side === 'left' || side === 'right'
            ? 0.29
            : side === 'hood'
              ? 1.45
              : 1.1 * spec.cabin,
        ),
        mat,
      );
      if (side === 'left' || side === 'right') {
        mesh.geometry.dispose();
        mesh.geometry = sideVinylGeometry(a, side === 'left');
        root.add(mesh);
      } else {
        mesh.rotation.x = -Math.PI / 2;
        if (side === 'hood') {
          mesh.position.set(0, 0.124, 0.77);
          hood.add(mesh);
        } else {
          mesh.name = 'vinyl-roof';
          mesh.position.set(0, 0.045, 0);
          roofPanel.add(mesh);
        }
      }
    }
  }
  const wheelDef = visualCatalog.wheels[a.wheel],
    rimRadius = 0.205 + (a.diameter - 17) * 0.011;
  for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Group();
    root.add(wheel);
    wheels.push(wheel);
    cylinder(0.34, 0.25, 0, 0, 0, dark, wheel);
    if (simple) {
      cylinder(0.235, 0.265, 0, 0, 0, silver, wheel);
      continue;
    }
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(rimRadius, 0.021, 4, 20),
      silver,
    );
    outer.rotation.y = Math.PI / 2;
    outer.position.x = i % 2 ? 0.135 : -0.135;
    wheel.add(outer);
    cylinder(0.07, 0.29, 0, 0, 0, silver, wheel);
    const spokes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.27, 0.028, rimRadius * 0.85),
      silver,
      wheelDef.spokes * (wheelDef.double ? 2 : 1),
    );
    const dummy = new THREE.Object3D();
    let index = 0;
    for (let n = 0; n < wheelDef.spokes; n++)
      for (let d = 0; d < (wheelDef.double ? 2 : 1); d++) {
        const angle = (n / wheelDef.spokes) * Math.PI * 2 + d * 0.1;
        dummy.position.set(
          0,
          Math.sin(angle) * rimRadius * 0.52,
          Math.cos(angle) * rimRadius * 0.52,
        );
        dummy.rotation.set(-angle + wheelDef.twist, 0, 0);
        dummy.updateMatrix();
        spokes.setMatrixAt(index++, dummy.matrix);
      }
    wheel.add(spokes);
    if (wheelDef.ring) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rimRadius * 0.63, 0.016, 4, 16),
        silver,
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.x = i % 2 ? 0.14 : -0.14;
      wheel.add(ring);
    }
    const carrier = new THREE.Group();
    carrier.name = 'brake-carrier';
    wheel.add(carrier);
    box(0.09, 0.17, 0.09, i % 2 ? 0.09 : -0.09, 0.13, 0, caliper, carrier);
    calipers.push(carrier);
    const spinner = new THREE.Group();
    wheel.add(spinner);
    spinners.push(spinner);
    spinner.visible = a.spinner;
    for (let n = 0; n < 3; n++) {
      const blade = box(
        0.015,
        0.04,
        rimRadius * 1.7,
        i % 2 ? 0.165 : -0.165,
        0,
        0,
        headlight,
        spinner,
      );
      blade.rotation.x = (n * Math.PI) / 3;
    }
  }
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.8, 7),
    new THREE.MeshBasicMaterial({ color: 0x82eeff }),
  );
  flame.rotation.x = -Math.PI / 2;
  flame.position.set(-0.58, -0.15, -2.4);
  flame.name = 'nitro-flame';
  flame.visible = false;
  root.add(flame);
  for (let n = 0; n <= a.parts.exhaust; n++)
    cylinder(
      0.085,
      0.22,
      -0.58 + n * 0.2,
      -0.15,
      -2.16 * depth,
      silver,
      root,
      'z',
    );
  const glowMaterials: THREE.MeshBasicMaterial[] = [];
  if (!simple)
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: a.neonColor,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      glowMaterials.push(mat);
      const mesh = new THREE.Mesh<THREE.BufferGeometry>(
        new THREE.PlaneGeometry(i < 2 ? 0.75 : 2.4, i < 2 ? 4.5 : 0.9),
        mat,
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        i < 2 ? (i ? 1 : -1) : 0,
        -0.48,
        i < 2 ? 0 : i === 2 ? 1.8 : -1.8,
      );
      mesh.visible = a.parts.neon > 0;
      root.add(mesh);
    }
  for (const x of simple ? [] : [-0.6, 0.6]) {
    const light = new THREE.SpotLight(a.headColor, 70, 60, 0.44, 0.65, 1.3);
    light.position.set(x, 0.25, 1.9);
    light.target.position.set(x * 2, -1.1, 30);
    root.add(light, light.target);
  }
  const roof = spec.roof;
  if (spec.family === 'single') {
    hatch.visible = false;
    hood.scale.x = 0.46;
    box(0.42, 0.42, 0.65, 0, 0.4, -0.35, dark);
    box(2.05, 0.08, 0.3, 0, 0.5, -1.8, paint);
    for (const side of [-1, 1])
      box(0.38, 0.18, 1.5, side * 0.75, -0.06, -0.2, paint);
  }
  if (spec.family === 'suv') {
    const rails = new THREE.Group();
    roofPanel.add(rails);
    for (const side of [-1, 1]) {
      box(0.08, 0.06, 1.4 * spec.cabin, side * 0.6, 0.12, 0, silver, rails);
      for (const z of [-0.45, 0.45])
        box(0.06, 0.06, 0.1, side * 0.6, 0.06, z * spec.cabin, silver, rails);
      box(0.12, 0.22, 3, side * 0.98, -0.1, 0, dark);
    }
    box(1.5, 0.55, 0.18, 0, 0.5, -1.75, paint);
  }
  if (spec.family === 'classic' || spec.family === 'retro') {
    for (const side of [-1, 1]) {
      cylinder(0.17, 0.13, side * 0.62, 0.24, 2.08, headlight, root, 'z');
      box(0.07, 0.06, 1.5, side * 0.4, 0.36, 1, dark);
    }
    box(1.4, 0.08, 0.12, 0, -0.02, 2.2, silver);
  }
  if (spec.family === 'prototype') {
    hood.scale.x = 0.72;

    for (const side of [-1, 1]) {
      box(0.4, 0.4, 1, side * 0.77, 0.2, 1.35, paint);
      box(0.35, 0.38, 1, side * 0.77, 0.2, -1.35, paint);
    }
    box(1.9, 0.07, 0.4, 0, 0.7, -1.8, carbon);
  }
  if (spec.family === 'super') {
    for (const side of [-1, 1]) {
      box(0.08, 0.3, 0.65, side * 0.8, 0.32, -0.7, dark).rotation.y =
        side * 0.25;
      box(0.35, 0.04, 0.8, side * 0.5, 0.34, 1.25, carbon);
    }
    hood.rotation.x = spec.hoodSlope;
  }
  if (!simple) {
    const brand = maker.design,
      accent = new THREE.MeshBasicMaterial({ color: brand.accent });
    // Each invented badge uses its own three-letter stroke pattern, not a real logo.
    for (let i = 0; i < spec.badge.length; i++) {
      const bits = spec.badge.charCodeAt(i);
      for (let bit = 0; bit < 5; bit++)
        if (bits & (1 << bit))
          box(
            0.024,
            0.028,
            0.018,
            (i - 1) * 0.085,
            0.17 + bit * 0.033,
            2.095,
            silver,
          );
    }
    const grille = brand.grille;
    const count =
      grille === 'braced' || grille === 'diamond'
        ? 3
        : grille === 'triple'
          ? 3
          : grille === 'split'
            ? 2
            : grille === 'none'
              ? 0
              : grille === 'stack'
                ? 4
                : 1;
    for (let i = 0; i < count; i++) {
      const g = box(
        grille === 'stack' ? 0.9 : 1.15 / count,
        grille === 'slit' ? 0.04 : 0.16,
        0.04,
        grille === 'stack' ? 0 : ((i - (count - 1) / 2) * 1.3) / count,
        grille === 'stack' ? -0.03 + i * 0.055 : 0.08,
        2.14,
        dark,
      );
      if (grille === 'diamond' || grille === 'braced')
        g.rotation.z = Math.PI / 4;
      if (grille === 'frame' || grille === 'hex' || grille === 'oval')
        box(1.3, 0.025, 0.05, 0, 0.19, 2.17, accent);
    }
    for (const side of [-1, 1]) {
      const n =
        brand.lamps === 'quad'
          ? 4
          : brand.lamps === 'triad'
            ? 3
            : design.lampSegments;
      for (let i = 0; i < n; i++) {
        const x = side * (0.48 + (i * 0.28) / Math.max(1, n - 1)),
          z = 2.19 * depth;
        if (['round', 'twin', 'halo'].includes(brand.lamps))
          cylinder(
            brand.lamps === 'halo' ? 0.095 : 0.065,
            0.04,
            x,
            0.25,
            z,
            headlight,
            root,
            'z',
          );
        else {
          const lamp = box(
            brand.lamps === 'vertical' ? 0.035 : 0.21 / n,
            brand.lamps === 'vertical' ? 0.22 : 0.055,
            0.045,
            x,
            0.25 + (brand.lamps === 'slash' ? i * 0.035 : 0),
            z,
            headlight,
          );
          if (brand.lamps === 'slash') lamp.rotation.z = side * 0.5;
        }
      }
      const tailCount = ['triple', 'stack'].includes(brand.tail)
        ? 3
        : ['paired', 'twin', 'split'].includes(brand.tail)
          ? 2
          : 1;
      for (let i = 0; i < tailCount; i++)
        box(
          brand.tail === 'blade' ? 0.55 : 0.16,
          0.05,
          0.04,
          side * (0.46 + i * 0.12),
          0.29 + i * (brand.tail === 'stack' ? 0.055 : 0),
          -2.18 * depth,
          tailMaterial,
        );
      box(
        0.028,
        0.055,
        0.7 * design.rearScale,
        side * (spec.family === 'single' ? 0.5 : 0.94),
        0.3,
        -0.7,
        accent,
      );
    }
  }

  if (roof !== 1 || spec.width !== 1.86 || spec.length !== 4.25) {
    const bodywork = new THREE.Group();
    bodywork.name = 'bodywork';
    for (const child of [...root.children])
      if (!wheels.includes(child as THREE.Group)) bodywork.add(child);
    bodywork.scale.set(spec.width / 1.86, roof, spec.length / 4.25);
    bodywork.position.y = (roof - 1) * 0.1;
    root.add(bodywork);
  }
  batchBodywork(root);
  function animate(
    time: number,
    _speed: number,
    braking = false,
    pose: StudioPose = closed,
  ) {
    engine.visible = pose.hood;
    tailMaterial.color.copy(tailColor).multiplyScalar(braking ? 1.6 : 1);
    hood.rotation.x = pose.hood ? -1.05 : 0;
    hatch.rotation.x = pose.hatch ? 1.1 : 0;
    for (let i = 0; i < doorGroups.length; i++) {
      doorGroups[i].rotation.x = pose.doors ? 1.15 : 0;
      doorGroups[i].rotation.z = pose.doors ? (i ? -0.12 : 0.12) : 0;
    }
    for (let i = 0; i < spinners.length; i++) {
      const spin = wheels[i].userData.spin ?? wheels[i].rotation.x;
      spinners[i].rotation.x = time * 2 - spin;
      calipers[i].rotation.x = -spin;
    }
    for (let i = 0; i < glowMaterials.length; i++)
      glowMaterials[i].opacity =
        a.parts.neon === 2
          ? 0.2 + 0.13 * Math.sin(time * 4)
          : a.parts.neon === 3
            ? 0.08 + 0.3 * Math.max(0, Math.sin(time * 5 - (i * Math.PI) / 2))
            : 0.28;
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const m of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(m);
        if (object instanceof THREE.InstancedMesh) object.dispose();
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }
  return { root, wheels, flame, tailMaterial, animate, dispose, spec };
}
