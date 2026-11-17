import * as THREE from 'three';

/** Mount the intake on the authored roof or rear cover, including curved panels. */
export function createRoofIntake(roof: THREE.Mesh, material: THREE.Material) {
  const surface = roof.geometry;
  surface.computeBoundingBox();
  const bounds = surface.boundingBox!,
    width = Math.min(0.48, (bounds.max.x - bounds.min.x) * 0.45),
    depth = Math.min(0.4, (bounds.max.z - bounds.min.z) * 0.35),
    cx = (bounds.min.x + bounds.max.x) / 2,
    cz = (bounds.min.z + bounds.max.z) / 2;
  const ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0)),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    hit = new THREE.Vector3(),
    position = surface.attributes.position;
  const height = (x: number, z: number) => {
    ray.origin.set(x, bounds.max.y + 1, z);
    let y = -Infinity;
    const count = surface.index?.count ?? position.count;
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(position, surface.index?.getX(i) ?? i);
      b.fromBufferAttribute(position, surface.index?.getX(i + 1) ?? i + 1);
      c.fromBufferAttribute(position, surface.index?.getX(i + 2) ?? i + 2);
      if (ray.intersectTriangle(a, b, c, false, hit)) y = Math.max(y, hit.y);
    }
    return Number.isFinite(y) ? y : bounds.max.y;
  };
  const geometry = new THREE.BoxGeometry(width, 0.14, depth),
    vertices = geometry.attributes.position;
  const top = Math.max(
    height(cx, cz),
    ...[-1, 1].flatMap((x) =>
      [-1, 1].map((z) => height(cx + (x * width) / 2, cz + (z * depth) / 2)),
    ),
  );
  for (let i = 0; i < vertices.count; i++) {
    const x = cx + vertices.getX(i),
      z = cz + vertices.getZ(i),
      rise = vertices.getY(i) > 0 ? 0.1 + 0.05 * ((z - cz) / depth + 0.5) : 0;
    vertices.setXYZ(i, x, rise > 0 ? top + rise : height(x, z), z);
  }
  geometry.computeVertexNormals();
  const intake = new THREE.Mesh(geometry, material);
  intake.name = 'roof-intake';
  intake.castShadow = intake.receiveShadow = true;
  const opening = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.76, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x020305 }),
  );
  opening.position.set(cx, top + 0.075, cz + depth / 2 + 0.0005);
  intake.add(opening);
  return intake;
}
