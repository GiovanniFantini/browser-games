import { t } from '../ui/translation';
import { preferences } from '../core/preferences';
import * as THREE from 'three';
import catalog from '../data/races.json';
import type { RaceRoute } from './route';

export class RaceVisuals {
  private readonly line: THREE.Mesh;
  private readonly gate = new THREE.Group();
  private readonly signCanvas = document.createElement('canvas');
  private readonly signTexture: THREE.CanvasTexture;
  private readonly markerMaterial = new THREE.MeshBasicMaterial({
    color: 0x77e5ee,
  });
  private readonly meetings = new THREE.Group();
  private gateKey = '';

  constructor(scene: THREE.Scene) {
    this.line = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0x74dce9,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.line.visible = false;
    this.line.frustumCulled = false;
    scene.add(this.line, this.gate, this.meetings);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 5, 0.18),
        this.markerMaterial,
      );
      post.position.set(side * catalog.gateHalfWidth, 2.5, 0);
      this.gate.add(post);
    }
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(catalog.gateHalfWidth * 2, 0.12, 0.12),
      this.markerMaterial,
    );
    top.position.y = 5;
    this.gate.add(top);
    this.signCanvas.width = 512;
    this.signCanvas.height = 96;
    this.signTexture = new THREE.CanvasTexture(this.signCanvas);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.65),
      new THREE.MeshBasicMaterial({
        map: this.signTexture,
        side: THREE.DoubleSide,
      }),
    );
    sign.position.y = 6.2;
    sign.rotation.y = Math.PI;
    this.gate.add(sign);
    this.gate.visible = false;
    for (const event of catalog.events.filter(
      (e) => !('hidden' in e && e.hidden) || e.id.startsWith('career-'),
    )) {
      const circle = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.035, 4, 48),
        new THREE.MeshBasicMaterial({
          color: event.mode === 'circuit' ? 0xc3caa5 : 0x83b7bb,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      circle.rotation.x = Math.PI / 2;
      circle.position.set(event.meeting.x, 0.08, event.meeting.z);
      circle.userData.district =
        'district' in event ? event.district : 'old-docks';
      this.meetings.add(circle);
    }
    this.setDistrict('old-docks');
  }
  setDistrict(id: string) {
    for (const marker of this.meetings.children)
      marker.visible = marker.userData.district === id;
  }
  setRoute(route: RaceRoute | null) {
    this.gateKey = '';
    this.gate.visible = !!route;
    this.line.visible = !!route;
    this.meetings.visible = !route;
    if (!route) return;
    const vertices: number[] = [];
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i],
        nx = -a.dz * 0.45,
        nz = a.dx * 0.45;
      vertices.push(
        a.x + nx,
        (a.y ?? 0) + 0.055,
        a.z + nz,
        b.x + nx,
        (b.y ?? 0) + 0.055,
        b.z + nz,
        a.x - nx,
        (a.y ?? 0) + 0.055,
        a.z - nz,
        a.x - nx,
        (a.y ?? 0) + 0.055,
        a.z - nz,
        b.x + nx,
        (b.y ?? 0) + 0.055,
        b.z + nz,
        b.x - nx,
        (b.y ?? 0) + 0.055,
        b.z - nz,
      );
    }
    this.line.geometry.dispose();
    this.line.geometry = new THREE.BufferGeometry();
    this.line.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  }
  update(route: RaceRoute, gateIndex: number, lap: number) {
    const key = `${lap}:${gateIndex}:${preferences.language}`;
    if (this.gateKey === key) return;
    this.gateKey = key;
    const gate = route.gates[gateIndex];
    this.gate.position.set(gate.x, gate.y ?? 0, gate.z);
    this.gate.rotation.y = Math.atan2(gate.dx, gate.dz);
    const finish = gateIndex === route.gates.length - 1;
    this.markerMaterial.color.setHex(finish ? 0xd3ec7b : 0x77e5ee);
    const ctx = this.signCanvas.getContext('2d')!;
    ctx.fillStyle = '#0a1729';
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = finish ? '#d3ec7b' : '#77e5ee';
    ctx.font = '700 45px "Circuit Grid"';
    ctx.textAlign = 'center';
    ctx.fillText(
      t(
        finish
          ? lap + 1 === route.definition.laps
            ? 'TRAGUARDO'
            : 'FINE GIRO'
          : `CHECKPOINT ${gateIndex + 1} / ${route.gates.length}`,
      ),
      256,
      64,
    );
    this.signTexture.needsUpdate = true;
  }
  showGate(visible: boolean) {
    this.gate.visible = visible;
  }
}
