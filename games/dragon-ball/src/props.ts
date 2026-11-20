import * as THREE from 'three';
import { box, ellipsoid, mesh } from './models';

function lettering(text: string, background: string, color: string, width: number, height: number) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = background; context.fillRect(0, 0, 512, 128);
  context.fillStyle = color; context.font = 'bold 85px sans-serif'; context.textAlign = 'center'; context.fillText(text, 256, 94);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
}

export function turboCar() {
  const car = new THREE.Group();
  box(car, 0xf9fbff, [2.35, 0.7, 3.9], [0, 0.95, 0]);
  box(car, 0x243849, [2.45, 0.2, 4.1], [0, 0.59, 0]);
  box(car, 0x1c4564, [1.98, 1.05, 1.7], [0, 1.77, -0.1]);
  const glass = new THREE.MeshStandardMaterial({ color: 0x64ccef, roughness: 0.14, metalness: 0.2 });
  const windshield = box(car, 0x6dbfda, [1.88, 0.86, 0.045], [0, 1.83, 0.78]);
  windshield.material = glass; windshield.rotation.x = -0.18;
  box(car, 0xf9fbff, [2.18, 0.14, 1.9], [0, 2.32, -0.1]);
  for (const side of [-1, 1]) {
    box(car, 0xf9fbff, [0.12, 1.06, 0.12], [side * 1.01, 1.82, 0.74]).rotation.x = -0.18;
    box(car, 0xf9fbff, [0.13, 1.04, 0.15], [side * 1.01, 1.82, -0.93]);
    box(car, 0x121f2e, [0.13, 0.1, 0.35], [side * 1.21, 1.13, -0.15]);
    const label = lettering('TURBO', '#f9fbff', '#dc272e', 1.5, 0.37);
    label.position.set(side * 1.182, 0.97, 0); label.rotation.y = side * Math.PI / 2; car.add(label);
    for (const end of [-1, 1]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.42, 14), 0x151c25, car, side * 1.25, 0.56, end * 1.35);
      wheel.rotation.z = Math.PI / 2;
      const hub = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.44, 12), 0xc3d6e3, car, side * 1.26, 0.56, end * 1.35);
      hub.rotation.z = Math.PI / 2;
      for (let j = 0; j < 10; j++) {
        const angle = j / 10 * Math.PI * 2;
        const tread = box(car, 0x26323d, [0.45, 0.15, 0.16], [side * 1.25, 0.56 + Math.cos(angle) * 0.55, end * 1.35 + Math.sin(angle) * 0.55]);
        tread.rotation.x = -angle;
      }
    }
    box(car, 0xffee9a, [0.44, 0.3, 0.08], [side * 0.77, 1.08, 1.98]);
    box(car, 0xe8413d, [0.38, 0.22, 0.08], [side * 0.8, 0.99, -1.99]);
  }
  box(car, 0x26323d, [1.0, 0.27, 0.09], [0, 0.99, 1.99]);
  const plate = lettering('EP 801', '#f3e8c9', '#24384d', 0.65, 0.19); plate.position.set(0, 0.72, 2.06); car.add(plate);
  return car;
}

export function mountainHouse() {
  const house = new THREE.Group(), shell = new THREE.Group(); house.add(shell);
  const walls = [
    box(shell, 0xffe2a0, [0.22, 3.4, 6.4], [-3.2, 1.7, 0]),
    box(shell, 0xffe2a0, [0.22, 3.4, 6.4], [3.2, 1.7, 0]),
    box(shell, 0xffe2a0, [6.4, 3.4, 0.22], [0, 1.7, -3.2]),
    box(shell, 0xffe2a0, [1.9, 3.4, 0.22], [-2.25, 1.7, 3.2]),
    box(shell, 0xffe2a0, [1.9, 3.4, 0.22], [2.25, 1.7, 3.2]),
    box(shell, 0x7c3225, [2.6, 0.55, 0.28], [0, 3.12, 3.2]),
  ];
  for (const x of [-3.12, 3.12]) for (const z of [-3.12, 3.12]) box(shell, 0x8b3221, [0.22, 3.5, 0.22], [x, 1.75, z]);
  for (let i = 0; i < 3; i++) {
    const roof = mesh(new THREE.ConeGeometry(5.75 - i * 0.19, 2.4 - i * 0.15, 4), i === 0 ? 0x19516c : 0x216887, shell, 0, 4.6 + i * 0.12, 0);
    roof.rotation.y = Math.PI / 4;
  }
  const finial = mesh(new THREE.SphereGeometry(0.19, 8, 6), 0xe7ad27, shell, 0, 6.05, 0); finial.scale.y = 1.5;
  for (const side of [-1, 1]) {
    const door = new THREE.Group(); door.position.set(side * 1.3, 0, 3.2); door.rotation.y = side * 1.12; shell.add(door);
    box(door, 0xa9472c, [1.25, 2.8, 0.11], [-side * 0.625, 1.4, 0]);
    const symbol = lettering('福', '#f3c345', '#982a22', 0.75, 0.75);
    symbol.position.set(-side * 0.625, 1.8, 0.065); door.add(symbol);
  }
  // One modest room, based on the official manga interior reference.
  box(house, 0x9c5e2c, [6.4, 0.12, 6.4], [0, 0.02, 0]);
  for (let i = 0; i < 12; i++) box(house, 0xbd7e3f, [0.025, 0.013, 6.2], [-3.0 + i * 0.55, 0.09, 0]);
  box(house, 0x67351e, [1.45, 0.5, 2.7], [-2.2, 0.36, -0.5]);
  box(house, 0xf8f1cd, [1.4, 0.2, 2.65], [-2.2, 0.72, -0.5]);
  box(house, 0x2c8ca5, [1.4, 0.09, 1.7], [-2.2, 0.87, -0.1]);
  ellipsoid(house, 0xfffaf0, [0.5, 0.1, 0.3], [-2.2, 0.9, -1.4]);
  box(house, 0x713a20, [1.4, 1.0, 0.85], [1.7, 0.55, -1.4]);
  for (let i = 0; i < 3; i++) {
    box(house, 0x9c5428, [1.26, 0.23, 0.03], [1.7, 0.3 + i * 0.28, -0.96]);
    ellipsoid(house, 0xe9bc4a, [0.04, 0.04, 0.04], [1.7, 0.3 + i * 0.28, -0.91]);
  }
  box(house, 0x9a5025, [1.4, 0.12, 0.85], [0.3, 0.65, 0.4]);
  for (const side of [-1, 1]) box(house, 0x713a20, [0.12, 0.65, 0.7], [0.3 + side * 0.5, 0.32, 0.4]);
  for (const object of shell.children) object.userData.cameraFadeGroup = shell;
  for (const wall of walls) wall.userData.cameraFadeGroup = shell;
  return { house, shell, spherePosition: new THREE.Vector3(1.7, 1.35, -1.4) };
}
