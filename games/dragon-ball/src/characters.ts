import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mesh } from './geometry.ts';
import { applyCharacterCel } from './character-cel.ts';
import { assetCharacter } from './asset-characters';

type Kind = 'goku' | 'bulma';
type Point = [number, number, number];
export type Character = { root: THREE.Group; animate: (time: number, speed: number, airborne?: boolean) => void };

const colours = { skin: 0xffbd81, ink: 0x151a2b, goku: 0x2c4f96, fold: 0x172c60, trousers: 0xe5aa32, belt: 0xf2eee0, hair: 0x11141a, turquoise: 0x2eb5c6, hairShade: 0x16899d, dress: 0xe95c8d, purple: 0x9c357a, boot: 0x197ab2 };
const roundGeometry = new THREE.SphereGeometry(1, 12, 8);
const clothGeometry = new THREE.SphereGeometry(1, 10, 6);
const tubeGeometries = new Map<string, THREE.BufferGeometry>();

function orb(parent: THREE.Object3D, colour: number, scale: Point, position: Point, cloth = false) {
  const result = mesh(cloth ? clothGeometry : roundGeometry, colour, parent, ...position);
  result.scale.set(...scale); return result;
}
function cylinder(parent: THREE.Object3D, colour: number, top: number, bottom: number, height: number, pos: Point, segments = 8) {
  const key = `${top}/${bottom}/${height}/${segments}`;
  if (!tubeGeometries.has(key)) tubeGeometries.set(key, new THREE.CylinderGeometry(top, bottom, height, segments));
  return mesh(tubeGeometries.get(key)!, colour, parent, ...pos);
}
function stroke(parent: THREE.Object3D, colour: number, points: Point[], radius = 0.012, segments = 8) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 4, false), colour, parent);
}
function ribbon(parent: THREE.Object3D, colour: number, points: Point[], widths: number[], depths: number[]) {
  const vertices: number[] = [], indices: number[] = [];
  points.forEach((point, i) => {
    const previous = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const tangent = new THREE.Vector3(next[0] - previous[0], next[1] - previous[1], 0).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
    for (let j = 0; j < 4; j++) {
      const angle = j * Math.PI / 2;
      vertices.push(point[0] + normal.x * Math.cos(angle) * widths[i], point[1] + normal.y * Math.cos(angle) * widths[i], point[2] + Math.sin(angle) * depths[i]);
    }
    if (i) for (let j = 0; j < 4; j++) {
      const a = (i - 1) * 4 + j, b = (i - 1) * 4 + (j + 1) % 4, c = i * 4 + j, d = i * 4 + (j + 1) % 4;
      indices.push(a, b, c, b, d, c);
    }
  });
  indices.push(0, 3, 2, 0, 2, 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(geometry, colour, parent);
}

// Original line art drawn at runtime, two frames in one small 256 x 512 atlas.
function faceAtlas(kind: Kind) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
  const c = canvas.getContext('2d')!;
  c.scale(0.5, 0.5);
  for (let frame = 0; frame < 2; frame++) {
    c.save(); c.translate(0, frame * 512);
    c.strokeStyle = '#172135'; c.fillStyle = '#fffef5'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const side of [-1, 1]) {
      const x = 256 + side * (kind === 'goku' ? 83 : 91);
      if (frame === 1) {
        c.beginPath(); c.moveTo(x - 50, 249); c.quadraticCurveTo(x, 273, x + 50, 249); c.stroke();
      } else if (kind === 'goku') {
        c.beginPath(); c.moveTo(x - 60, 256); c.bezierCurveTo(x - 61, 190, x - 15, 173, x + 45, 194); c.quadraticCurveTo(x + 72, 237, x + 51, 291); c.quadraticCurveTo(x + 1, 309, x - 51, 291); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#141b2a'; c.beginPath(); c.ellipse(x - side * 5, 250, 19, 32, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fffef5';
      } else {
        c.beginPath(); c.moveTo(x - 57, 248); c.bezierCurveTo(x - 43, 171, x + 39, 175, x + 56, 239); c.quadraticCurveTo(x + 1, 304, x - 57, 248); c.fill(); c.stroke();
        c.fillStyle = '#31557b'; c.beginPath(); c.ellipse(x, 246, 26, 35, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#121b30'; c.beginPath(); c.ellipse(x, 250, 13, 26, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - 8, 218, 9, 15, 0, 0, Math.PI * 2); c.fill();
        c.lineWidth = 8; c.beginPath(); c.moveTo(x - 56, 247); c.bezierCurveTo(x - 39, 171, x + 37, 175, x + 55, 240); c.stroke();
        for (let j = 0; j < 2; j++) { const outer = x + side * (44 - j * 8); c.beginPath(); c.moveTo(outer, 204 - j * 12); c.lineTo(outer + side * 16, 184 - j * 12); c.stroke(); }
        c.lineWidth = 5; c.fillStyle = '#fffef5';
      }
      c.lineWidth = kind === 'goku' ? 14 : 5;
      c.beginPath(); c.moveTo(x - 49, kind === 'goku' ? 151 + side * 11 : 133); c.lineTo(x + 49, kind === 'goku' ? 151 - side * 11 : 137); c.stroke();
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(x + side * 55, 306); c.lineTo(x + side * 62, 322); c.stroke();
    }
    c.strokeStyle = '#995f4b'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(256, 288); c.lineTo(246, 314); c.lineTo(259, 317); c.stroke();
    c.strokeStyle = '#653c36'; c.beginPath(); c.moveTo(226, 368); c.quadraticCurveTo(256, 376, 285, 367); c.stroke();
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(1, 0.5); texture.offset.y = 0.5;
  texture.generateMipmaps = true;
  return texture;
}

function jawWidth(kind: Kind, y: number) {
  return 1 - Math.pow(Math.max(0, -y), 1.05) * (kind === 'bulma' ? 0.35 : 0.28);
}
function headShape(kind: Kind, radius: Point) {
  const geometry = new THREE.SphereGeometry(1, 20, 12);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const jaw = jawWidth(kind,y);
    positions.setXYZ(i, positions.getX(i) * radius[0] * jaw, y * radius[1], positions.getZ(i) * radius[2]);
  }
  geometry.computeVertexNormals(); return geometry;
}
function faceSurface(kind: Kind, radius: Point) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 8, columns = 12;
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const v = y / rows, u = x / columns, h = 0.82 - v * 1.64, angle = (u - 0.5) * 2.14;
    const jaw = jawWidth(kind,h);
    const circle = Math.sqrt(1 - h * h);
    positions.push(Math.sin(angle) * radius[0] * circle * jaw, h * radius[1], Math.cos(angle) * radius[2] * circle + 0.009);
    uv.push(u, 1 - v);
    if (x < columns && y < rows) { const a = y * (columns + 1) + x; indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function labelledPatch(parent: THREE.Object3D) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96;
  const c = canvas.getContext('2d')!; c.fillStyle = '#ffe1a8'; c.fillRect(0, 0, 256, 96);
  c.fillStyle = '#182034'; c.font = 'bold 62px sans-serif'; c.textAlign = 'center'; c.fillText('BULMA', 128, 72);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.17), new THREE.MeshBasicMaterial({ map: texture })); label.position.set(0, 2.02, 0.258); parent.add(label);
  const backCanvas=document.createElement('canvas'); backCanvas.width=128; backCanvas.height=128;
  const backContext=backCanvas.getContext('2d')!;backContext.font='bold 99px sans-serif';backContext.textAlign='center';backContext.strokeStyle='#fff4dd';backContext.lineWidth=8;backContext.strokeText('97',64,103);backContext.fillStyle='#172135';backContext.fillText('97',64,103);
  const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;
  const backLabel=new THREE.Mesh(new THREE.PlaneGeometry(0.43,0.39),new THREE.MeshBasicMaterial({map:backTexture,transparent:true,depthWrite:false}));backLabel.position.set(0,2.02,-0.258);backLabel.rotation.y=Math.PI;parent.add(backLabel);
}

// Merge only static siblings; animated pivots, faces and their atlases stay independent.
function combineStaticMeshes(root: THREE.Group) {
  const parents: THREE.Object3D[] = []; root.traverse(node => parents.push(node));
  for (const parent of parents) {
    const batches = new Map<string, THREE.Mesh[]>();
    for (const child of parent.children) if (child instanceof THREE.Mesh && !Array.isArray(child.material)) {
      const key = `${child.material.uuid}:${Object.keys(child.geometry.attributes).sort().join(',')}`;
      const batch = batches.get(key) ?? []; batch.push(child); batches.set(key, batch);
    }
    for (const batch of batches.values()) {
      if (batch.length < 2) continue;
      const transformed = batch.map(object => { object.updateMatrix(); return object.geometry.clone().applyMatrix4(object.matrix); });
      const geometry = mergeGeometries(transformed, false);
      if (geometry) {
        const merged = new THREE.Mesh(geometry, batch[0].material); merged.castShadow = true; merged.receiveShadow = true; parent.add(merged); batch.forEach(object => parent.remove(object));
      }
      transformed.forEach(geometry => geometry.dispose());
    }
  }
}

export function character(kind: Kind): Character {
  return assetCharacter(kind);
}

function legacyCharacter(kind: Kind): Character {
  const goku = kind === 'goku', root = new THREE.Group(), body = new THREE.Group(); root.name = kind; root.add(body);
  const outfit = goku ? colours.goku : colours.dress;
  const hipY = goku ? 0.68 : 1.41, shoulderY = goku ? 1.22 : 2.12;
  const headY = goku ? 1.74 : 2.69;
  const headRadius: Point = goku ? [0.40, 0.40, 0.34] : [0.30, 0.36, 0.275];
  const head = new THREE.Group(); head.position.y = headY; body.add(head);
  mesh(headShape(kind, headRadius), colours.skin, head);
  cylinder(body, colours.skin, goku ? 0.12 : 0.1, goku ? 0.13 : 0.11, 0.21, [0, goku ? 1.31 : 2.3, 0]);
  const atlas = faceAtlas(kind);
  const face = new THREE.Mesh(faceSurface(kind, headRadius), new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  face.name = `${kind}-face`; face.renderOrder = 1; head.add(face);
  for (const side of [-1, 1]) {
    orb(head, colours.skin, [0.10, 0.14, 0.075], [side * (headRadius[0] - 0.005), -0.045, 0]);
    stroke(head, 0xba7759, [[side * (headRadius[0] + 0.018), 0.01, 0.056], [side * (headRadius[0] + 0.055), 0.035, 0.064], [side * (headRadius[0] + 0.06), -0.07, 0.062]], 0.009, 4);
  }
  // A very small nose gives the profile depth; eyes and mouth remain drawn on the face.
  orb(head, colours.skin, [0.025,0.04,0.035], [0,-0.075,headRadius[2]-0.006]);

  const ponytail = new THREE.Group();
  const hair = new THREE.Group(); head.add(hair);
  if (goku) {
    hair.scale.set(0.8,0.72,0.88);
    const crown = mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),colours.hair,hair,0,0.305,-0.02);
    crown.scale.set(0.52,0.42,0.43);
    const nape = mesh(new THREE.SphereGeometry(1,16,10,Math.PI,Math.PI),colours.hair,hair,0,0.15,-0.03);
    nape.scale.set(0.52,0.58,0.43);
    const spikes: { points: Point[]; widths: number[]; depths: number[] }[] = [
      {points:[[-0.24,0.22,-0.06],[-0.44,0.57,-0.07],[-0.76,0.77,-0.04],[-1.02,0.67,0]],widths:[0.24,0.23,0.12,0],depths:[0.24,0.19,0.1,0]},
      {points:[[-0.09,0.28,-0.13],[-0.16,0.68,-0.09],[-0.35,1.00,-0.04],[-0.58,1.22,0]],widths:[0.26,0.23,0.14,0],depths:[0.26,0.19,0.1,0]},
      {points:[[0.12,0.24,-0.10],[0.26,0.59,-0.07],[0.17,1.02,0]],widths:[0.21,0.15,0],depths:[0.25,0.16,0]},
      {points:[[0.27,0.16,-0.08],[0.61,0.33,-0.06],[0.91,0.26,-0.03],[1.13,0.1,0]],widths:[0.23,0.2,0.1,0],depths:[0.25,0.18,0.09,0]},
      {points:[[0.30,-0.03,-0.08],[0.65,0.01,-0.04],[0.96,-0.18,0]],widths:[0.2,0.14,0],depths:[0.22,0.12,0]},
      {points:[[-0.3,0.02,-0.1],[-0.61,0.14,-0.1],[-0.94,0.2,-0.06]],widths:[0.19,0.13,0],depths:[0.22,0.12,0]},
      {points:[[-0.15,0.18,-0.25],[-0.28,0.35,-0.48],[-0.43,0.43,-0.74]],widths:[0.22,0.16,0],depths:[0.17,0.1,0]},
      {points:[[0.18,0.14,-0.23],[0.4,0.31,-0.46],[0.55,0.34,-0.68]],widths:[0.2,0.13,0],depths:[0.16,0.09,0]},
      {points:[[-0.26,0.32,0.14],[-0.3,0.23,0.3],[-0.45,0.09,0.3]],widths:[0.15,0.1,0],depths:[0.13,0.08,0]},
      {points:[[0.08,0.32,0.15],[-0.08,0.25,0.34],[-0.27,0.12,0.36]],widths:[0.16,0.1,0],depths:[0.13,0.07,0]},
      {points:[[0.28,0.27,0.12],[0.25,0.15,0.29],[0.09,0.05,0.35]],widths:[0.13,0.08,0],depths:[0.13,0.07,0]},
    ];
    for (const spike of spikes) ribbon(hair,colours.hair,spike.points,spike.widths,spike.depths);
    stroke(hair,0x3b3c40,[[-0.81,0.64,0.03],[-0.55,0.54,0.13],[-0.35,0.3,0.22]],0.012,5);
    stroke(hair,0x393b41,[[-0.4,0.92,0.02],[-0.27,0.64,0.13],[-0.17,0.38,0.24]],0.011,5);

    orb(body, outfit, [0.37, 0.35, 0.235], [0, 1.01, 0], true);
    cylinder(body, outfit, 0.3, 0.36, 0.24, [0, 0.75, 0]);
    ribbon(body, colours.fold, [[-0.24,1.29,0.11],[0.0,1.02,0.234],[0.17,0.84,0.21]], [0.045,0.047,0.035], [0.016,0.016,0.014]);
    ribbon(body, colours.goku, [[0.24,1.29,0.11],[0.08,1.10,0.235],[-0.12,0.88,0.23]], [0.055,0.055,0.035], [0.02,0.02,0.016]);
    cylinder(body, colours.belt, 0.32, 0.33, 0.12, [0, 0.78, 0]);
    orb(body, colours.belt, [0.105,0.075,0.06], [0.1,0.78,0.28]);
    ribbon(body, colours.belt, [[0.08,0.76,0.29],[0.06,0.56,0.3],[0.11,0.39,0.3]], [0.055,0.05,0.04], [0.015,0.015,0.012]);
    ribbon(body, colours.belt, [[0.14,0.76,0.28],[0.25,0.58,0.29],[0.3,0.46,0.29]], [0.048,0.045,0.03], [0.015,0.015,0.01]);
    const staff = cylinder(body, 0xbd2925, 0.045, 0.045, 1.9, [0, 1.12, -0.29]); staff.rotation.z = -0.45;
    cylinder(staff, 0xf0b451, 0.05, 0.05, 0.08, [0, 0.85, 0]);
    cylinder(staff, 0xf0b451, 0.05, 0.05, 0.08, [0, -0.85, 0]);
  } else {
    hair.scale.set(0.86,0.85,0.86);
    orb(hair, colours.turquoise, [0.38,0.4,0.31], [0,0.16,-0.11]);
    const fringe: Point[][] = [
      [[-0.28,0.33,0.13],[-0.32,0.24,0.27],[-0.29,0.12,0.29]],
      [[-0.15,0.37,0.18],[-0.21,0.27,0.32],[-0.13,0.14,0.33]],
      [[0.0,0.38,0.18],[-0.05,0.28,0.35],[0.04,0.13,0.34]],
      [[0.14,0.35,0.16],[0.12,0.26,0.32],[0.19,0.15,0.3]],
      [[0.26,0.31,0.1],[0.29,0.22,0.23],[0.3,0.1,0.22]],
    ];
    fringe.forEach(points => ribbon(hair, colours.turquoise, points, [0.11,0.07,0.015], [0.09,0.065,0.01]));
    for (let i = 0; i < 4; i++) stroke(hair, colours.hairShade, [[-0.28+i*0.16,0.31,0.22],[-0.25+i*0.15,0.21,0.29],[-0.24+i*0.15,0.13,0.3]], 0.007, 4);
    ponytail.position.set(0.3,0.25,-0.18); hair.add(ponytail);
    for (let i = 0; i < 5; i++) orb(ponytail, i % 2 ? colours.hairShade : colours.turquoise, [0.12-i*0.009,0.16,0.13-i*0.008], [0.14 + Math.sin(i*0.55)*0.08, -i*0.19, -0.07-i*0.035], true);
    cylinder(ponytail, 0xe64c4f, 0.07,0.07,0.06,[0.21,-0.82,-0.19]);
    ribbon(ponytail, colours.turquoise, [[0.21,-0.83,-0.19],[0.26,-0.99,-0.19],[0.19,-1.08,-0.16]], [0.07,0.05,0], [0.06,0.04,0]);
    for (const side of [-1, 1]) ribbon(hair, 0xf24b4b, [[0.24,0.44,-0.02],[0.24+side*0.2,0.59,-0.04],[0.24+side*0.23,0.36,-0.015]], [0.06,0.14,0.04], [0.045,0.035,0.03]);
    orb(hair, 0xf45b54, [0.07,0.09,0.07], [0.24,0.44,0.015]);

    const profile = [[0.42,1.33],[0.41,1.45],[0.27,1.75],[0.30,2.0],[0.32,2.14],[0.17,2.28]].map(([r,y]) => new THREE.Vector2(r,y));
    const dress = mesh(new THREE.LatheGeometry(profile, 12), outfit, body); dress.scale.z = 0.76;
    cylinder(body, 0x75442a,0.275,0.28,0.1,[0,1.75,0]);
    labelledPatch(body);
    stroke(body, 0xc56035, [[0,1.89,0.245],[0,1.72,0.225],[0,1.38,0.33]], 0.008, 4);
    const scarf = mesh(new THREE.TorusGeometry(0.21,0.085,5,12),colours.purple,body,0,2.29,0); scarf.rotation.x = Math.PI / 2;
    orb(body,colours.purple,[0.13,0.095,0.11],[-0.16,2.25,0.15]);
    ribbon(body,colours.purple,[[-0.14,2.25,0.16],[-0.24,2.05,0.24],[-0.31,1.94,0.27]],[0.09,0.07,0.025],[0.024,0.02,0.01]);
    mesh(new THREE.BoxGeometry(0.28,0.32,0.14),0x159fda,body,0.29,1.65,0.2);
    mesh(new THREE.BoxGeometry(0.285,0.12,0.025),0x1287bd,body,0.29,1.74,0.283);
    cylinder(body,0xf4d365,0.023,0.023,0.015,[0.29,1.7,0.303]).rotation.x = Math.PI / 2;
  }

  const elbows: THREE.Group[] = [], knees: THREE.Group[] = [];
  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group(); arm.position.set(side * (goku ? 0.36 : 0.34), shoulderY,0); body.add(arm);
    const upper = goku ? 0.29 : 0.37, lower = goku ? 0.27 : 0.34;
    cylinder(arm,colours.skin,goku ? 0.125 : 0.095,goku ? 0.11 : 0.085,upper,[0,-upper/2,0]);
    if (!goku) { orb(arm,outfit,[0.17,0.19,0.155],[0,-0.045,0],true); cylinder(arm,outfit,0.16,0.16,0.045,[0,-0.18,0]); }
    const elbow = new THREE.Group(); elbow.position.y = -upper; arm.add(elbow); elbows.push(elbow);
    cylinder(elbow,colours.skin,goku ? 0.1 : 0.085,goku ? 0.085 : 0.075,lower,[0,-lower/2,0]);
    cylinder(elbow,goku ? 0xd72724 : 0x9c6439,goku ? 0.105 : 0.09,goku ? 0.105 : 0.09,goku ? 0.1 : 0.13,[0,-lower+0.06,0]);
    orb(elbow,colours.skin,[goku ? 0.105 : 0.085,0.12,0.085],[0,-lower-0.045,0],true);
    orb(elbow,colours.skin,[0.045,0.065,0.06],[-side*0.07,-lower-0.015,0.045],true);
    if (!goku) orb(elbow,0x9c6439,[0.087,0.085,0.08],[0,-lower-0.005,0],true);
    arm.rotation.z = side*0.1; return arm;
  });
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Group(); leg.position.set(side*(goku ? 0.19 : 0.17),hipY,0); body.add(leg);
    const upper = goku ? 0.31 : 0.64, lower = goku ? 0.24 : 0.6;
    cylinder(leg,goku ? colours.trousers : colours.skin,goku ? 0.205 : 0.12,goku ? 0.17 : 0.09,upper,[0,-upper/2,0]);
    const knee = new THREE.Group(); knee.position.y = -upper; leg.add(knee); knees.push(knee);
    cylinder(knee,goku ? colours.trousers : colours.skin,goku ? 0.16 : 0.09,goku ? 0.12 : 0.075,lower,[0,-lower/2,0]);
    const footwear = goku ? 0x172139 : colours.boot;
    cylinder(knee,footwear,goku ? 0.12 : 0.13,goku ? 0.14 : 0.15,goku ? 0.16 : 0.36,[0,-lower+(goku ? 0.055 : 0.15),0]);
    orb(knee,footwear,[goku ? 0.16 : 0.15,0.095,goku ? 0.24 : 0.25],[0,-lower+0.01,0.1],true);
    if (goku) {
      cylinder(knee,0xd6ba85,0.13,0.13,0.05,[0,-lower+0.13,0]);
      stroke(knee,0xe2cd9c,[[-0.1,-lower+0.07,0.14],[0,-lower+0.13,0.16],[0.1,-lower+0.07,0.14]],0.015,3);
    } else {
      orb(knee,0xf6e5d1,[0.151,0.035,0.25],[0,-lower-0.055,0.1],true);
      for (let i=0;i<3;i++) stroke(knee,0xc5e4ec,[[-0.09,-lower+0.04+i*0.065,0.14],[0,-lower+0.05+i*0.065,0.16],[0.09,-lower+0.04+i*0.065,0.14]],0.01,3);
      cylinder(knee,colours.purple,0.115,0.11,0.09,[0,-lower+0.36,0]);
    }
    return leg;
  });
  const tail = new THREE.Group();
  if (goku) {
    tail.position.set(0,0.74,-0.16); body.add(tail);
    stroke(tail,0x854f28,[[0,0,0],[0.38,-0.12,-0.35],[0.74,0.02,-0.5],[0.88,0.28,-0.39],[0.78,0.42,-0.29]],0.065,16);
    orb(tail,0x854f28,[0.07,0.075,0.07],[0.78,0.42,-0.29],true);
  }
  combineStaticMeshes(root);
  applyCharacterCel(root);
  return { root, animate(time, speed, airborne = false) {
    const stride = Math.sin(time*9.5)*Math.min(speed,1)*0.67;
    legs[0].rotation.x = airborne ? -0.65 : stride; legs[1].rotation.x = airborne ? 0.35 : -stride;
    knees[0].rotation.x = airborne ? 0.9 : Math.max(0,-stride)*0.6;
    knees[1].rotation.x = airborne ? 0.9 : Math.max(0,stride)*0.6;
    arms[0].rotation.x = airborne ? -1.1 : -stride*0.75; arms[1].rotation.x = airborne ? -1.1 : stride*0.75;
    elbows[0].rotation.x = -0.12; elbows[1].rotation.x = -0.12;
    if (root.userData.pose === 'carry') { arms[0].rotation.x = -2.35; elbows[0].rotation.x = -0.5; arms[1].rotation.x = -0.4; }
    if (root.userData.pose === 'lift') { arms[0].rotation.x = -2.65; arms[1].rotation.x = -2.65; elbows.forEach(elbow => { elbow.rotation.x = -0.2; }); }
    body.position.y = Math.sin(time*2.3)*0.016+Math.abs(stride)*0.035;
    head.rotation.y = speed < 0.1 ? Math.sin(time*0.6)*0.045 : 0;
    head.rotation.z = speed < 0.1 ? Math.sin(time*0.8)*0.016 : 0;
    tail.rotation.y = Math.sin(time*2)*0.18; tail.rotation.z = Math.sin(time*1.7)*0.045;
    ponytail.rotation.x = Math.sin(time*(speed > 0.1 ? 9.5 : 2.1))*Math.min(0.23,0.06+speed*0.15);
    atlas.offset.y = time % 4.4 > 4.25 ? 0 : 0.5;
  } };
}
