import * as THREE from 'three';

/** Distant original structures provide several depths beyond the street blocks. */
export function createSkyline(scene: THREE.Scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#172029';
  c.fillRect(0, 0, 256, 512);
  let seed = 59291;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  for (let y = 10; y < 502; y += 15)
    for (let x = 8; x < 250; x += 18) {
      c.fillStyle =
        random() < 0.25
          ? ['#bea275', '#557d92', '#a4afb0'][Math.floor(random() * 3)]
          : '#0b131b';
      c.fillRect(x, y, 7, 6);
    }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    roughness: 0.9,
    color: 0x657480,
  });
  const body = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    material,
    28,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x1d2933, roughness: 0.8 }),
    28,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2 + 0.23,
      radius = 625 + random() * 220;
    const x = Math.sin(angle) * radius,
      z = Math.cos(angle) * radius,
      h = 65 + random() * 125,
      w = 28 + random() * 35,
      d = 25 + random() * 30;
    dummy.position.set(x, h / 2, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    body.setMatrixAt(i, dummy.matrix);
    dummy.position.y = h + 3;
    dummy.scale.set(w * 0.65, 6 + random() * 10, d * 0.65);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  }
  body.name = 'layered-distant-skyline';
  scene.add(body, crowns);
}
