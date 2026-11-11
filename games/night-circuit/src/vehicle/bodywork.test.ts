import { expect, test, vi } from 'vitest';
import * as THREE from 'three';
import { batchBodywork } from './bodywork';

test('il merge conserva i dettagli con attributi diversi e unisce quelli compatibili', () => {
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial();
  const first = new THREE.BoxGeometry();
  const untextured = new THREE.BoxGeometry();
  untextured.deleteAttribute('uv');
  root.add(
    new THREE.Mesh(first, material),
    new THREE.Mesh(untextured, material),
    new THREE.Mesh(first.clone(), material),
  );
  const errors = vi.spyOn(console, 'error');
  try {
    batchBodywork(root);
    expect(errors).not.toHaveBeenCalled();
    const meshes = root.children as THREE.Mesh[];
    expect(meshes).toHaveLength(2);
    expect(
      meshes.map((m) => m.geometry.index!.count).sort((a, b) => a - b),
    ).toEqual([36, 72]);
    expect(meshes.filter((m) => m.geometry.attributes.uv)).toHaveLength(1);
  } finally {
    errors.mockRestore();
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    material.dispose();
  }
});
