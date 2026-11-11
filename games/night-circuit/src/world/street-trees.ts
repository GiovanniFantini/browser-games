import * as THREE from 'three';
import type { RoadGraph } from './graph';

/** Lit leaf clusters replace the flat circular tree silhouettes. */
export function createStreetTrees(scene: THREE.Scene, graph: RoadGraph) {
  const foliage = document.createElement('canvas');
  foliage.width = foliage.height = 256;
  const ctx = foliage.getContext('2d')!;
  ctx.strokeStyle = '#34412a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(124, 248);
  ctx.bezierCurveTo(135, 163, 118, 88, 132, 14);
  ctx.stroke();
  for (let j = 0; j < 11; j++)
    for (const side of [-1, 1]) {
      const y = 27 + j * 18,
        x = 129 + Math.sin(j * 2) * 5,
        w = 26 + Math.sin(j * 0.28) * 15;
      ctx.fillStyle = ['#465e35', '#5b7041', '#384e2f', '#6a774b'][j % 4];
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.quadraticCurveTo(x + side * w, y - 15, x + side * (w + 15), y - 20);
      ctx.quadraticCurveTo(x + side * (w + 9), y + 13, x, y + 16);
      ctx.fill();
    }
  const leafMap = new THREE.CanvasTexture(foliage);
  leafMap.colorSpace = THREE.SRGBColorSpace;
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b3931,
    roughness: 1,
  });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b9f7b,
    map: leafMap,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 1,
    emissive: 0x102219,
    emissiveIntensity: 0.08,
  });
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.13, 0.28, 4.7, 6),
    trunkMaterial,
    graph.edges.length,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1.8, 2),
    leafMaterial,
    graph.edges.length * 60,
  );
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  let seed = 93627;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  graph.edges.forEach((e, i) => {
    const a = graph.nodes[e.a],
      b = graph.nodes[e.b],
      vertical = a.x === b.x,
      side = i % 2 ? 1 : -1;
    const x = (a.x + b.x) / 2 + (vertical ? side * 19 : 13),
      z = (a.z + b.z) / 2 + (vertical ? 13 : side * 19);
    dummy.position.set(x, 2.35, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0.05);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 60; j++) {
      const angle = j * 2.4 + random(),
        spread = Math.sqrt(random()) * 2.3;
      dummy.position.set(
        x + Math.sin(angle) * spread,
        4.8 + random() * 3.1,
        z + Math.cos(angle) * spread,
      );
      dummy.scale.set(0.65 + random() * 0.5, 0.8 + random() * 0.5, 1);
      dummy.rotation.set(random(), random() * 3, random());
      dummy.updateMatrix();
      crowns.setMatrixAt(i * 60 + j, dummy.matrix);
      color.setHSL(
        0.31 + random() * 0.04,
        0.18 + random() * 0.2,
        0.3 + random() * 0.13,
      );
      crowns.setColorAt(i * 60 + j, color);
    }
  });
  crowns.castShadow = true;
  crowns.layers.set(1);
  crowns.receiveShadow = true;
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  scene.add(trunks, crowns);
}
