import { t } from './translation';
import { roadHeight, ORIGINS } from '../world/atlas';
import districts from '../data/career.json';
import * as THREE from 'three';
import data from '../data/district.json';
import {
  nearestRoad,
  routeFromPosition,
  type RoadGraph,
  type RoadPosition,
} from '../world/graph';

const POI_COLORS: Record<string, string> = {
  garage: '#d3ec7b',
  shop: '#e38fbd',
  event: '#edc378',
  landmark: '#78dce7',
};
export class Navigation {
  private collected = new Set<string>();
  private mapX = 0;
  private unlocked = 1;
  private mapZ = 0;
  private mapSpan = 1080;
  private pois = data.pois;
  private readonly small: HTMLCanvasElement;
  private readonly large: HTMLCanvasElement;
  readonly panel: HTMLDivElement;
  private readonly info: HTMLElement;
  private readonly gps: HTMLElement;
  private readonly line: THREE.Mesh;
  private routeVertices = new Float32Array(0);
  private route: RoadPosition[] = [];
  private target?: RoadPosition;
  private destination = '';
  private timer = 0;
  private drawTimer = 0;
  private readonly routeOrigin = { x: 0, z: 0 };
  private rotated = false;
  private readonly position = { x: 0, z: 0 };
  private yaw = 0;
  private racePath: readonly { x: number; z: number }[] | null = null;
  private raceName = '';
  private raceMarkers: readonly { x: number; z: number; color: string }[] = [];
  private readonly filters = new Set(Object.keys(POI_COLORS));
  open = false;
  distance = 0;
  onClose: () => void = () => {};
  onTeleport?: (x: number, z: number) => void;

  constructor(
    private graph: RoadGraph,
    scene: THREE.Scene,
  ) {
    const wrapper = document.createElement('div');
    wrapper.className = 'navigation';
    wrapper.innerHTML = `<div class="mini-wrap"><div class="mini-title">OLD DOCKS <span>GPS</span></div><canvas id="minimap" width="256" height="220" aria-label="Minimappa Old Docks"></canvas><div class="mini-actions"><button id="open-map">MAPPA <kbd>G</kbd></button><button id="rotate-map" aria-label="Ruota minimappa">NORD ↑</button></div><div id="gps-info" role="status">Scegli una destinazione sulla mappa</div></div><div class="city-map" hidden role="dialog" aria-modal="true" aria-label="Mappa di Old Docks"><section class="map-card"><header><div><span class="eyebrow">PORT RIDERS / QUARTIERE 01</span><h2>Old Docks</h2></div><button id="close-map">TORNA ALLA GUIDA <kbd>G</kbd></button></header><p>Clicca una strada o un punto di interesse per impostare il GPS.</p><div class="map-filters">${Object.keys(
      POI_COLORS,
    )
      .map(
        (type) =>
          `<label><input type="checkbox" checked value="${type}">${({ garage: 'Garage', shop: 'Negozi', event: 'Ritrovi', landmark: 'Luoghi' } as Record<string, string>)[type]}</label>`,
      )
      .join(
        '',
      )}</div><div class="map-body"><canvas id="city-canvas" width="700" height="700" tabindex="0" aria-label="Mappa stradale. Usa anche i pulsanti destinazione nella lista."></canvas><aside><span class="eyebrow">DESTINAZIONI</span>${this.pois.map((poi) => `<button data-poi="${poi.id}">${poi.name}<small>${poi.description}</small></button>`).join('')}<button id="clear-gps">CANCELLA PERCORSO</button></aside></div><p id="map-info" role="status">Guida in pausa. Nessun percorso impostato.</p></section></div>`;
    document.querySelector('#interface')!.append(wrapper);
    this.small = wrapper.querySelector('#minimap')!;
    this.large = wrapper.querySelector('#city-canvas')!;
    this.panel = wrapper.querySelector('.city-map')!;
    this.info = wrapper.querySelector('#map-info')!;
    this.gps = wrapper.querySelector('#gps-info')!;
    wrapper.querySelector<HTMLButtonElement>('#close-map')!.onclick = () =>
      this.onClose();
    wrapper.querySelector<HTMLButtonElement>('#rotate-map')!.onclick = (
      event,
    ) => {
      this.rotated = !this.rotated;
      (event.currentTarget as HTMLButtonElement).textContent = this.rotated
        ? 'AUTO ↑'
        : 'NORD ↑';
    };
    this.large.onclick = (event) => {
      if (this.racePath) return;
      const rect = this.large.getBoundingClientRect();
      const x =
        ((event.clientX - rect.left) / rect.width - 0.5) * this.mapSpan +
        this.mapX;
      const z =
        ((event.clientY - rect.top) / rect.height - 0.5) * this.mapSpan +
        this.mapZ;
      if (import.meta.env.DEV && event.altKey && this.onTeleport) {
        const p = nearestRoad(this.graph, x, z);
        this.onTeleport(p.x, p.z);
        return;
      }
      let nearest = this.pois[0],
        best = Infinity;
      for (const poi of this.pois)
        if (this.filters.has(poi.type)) {
          const distance = Math.hypot(poi.x - x, poi.z - z);
          if (distance < best) {
            best = distance;
            nearest = poi;
          }
        }
      if (best < 35) this.setTarget(nearest, nearest.name);
      else
        this.setTarget(
          nearestRoad(this.graph, x, z),
          'Destinazione sulla strada',
        );
    };
    for (const button of wrapper.querySelectorAll<HTMLButtonElement>(
      '[data-poi]',
    ))
      button.onclick = () => {
        if (this.racePath) return;
        const poi = this.pois.find((poi) => poi.id === button.dataset.poi)!;
        this.setTarget(poi, poi.name);
      };
    wrapper.querySelector<HTMLButtonElement>('#clear-gps')!.onclick = () =>
      this.clear();
    for (const checkbox of wrapper.querySelectorAll<HTMLInputElement>(
      '.map-filters input',
    ))
      checkbox.onchange = () => {
        if (checkbox.checked) this.filters.add(checkbox.value);
        else this.filters.delete(checkbox.value);
        for (const button of wrapper.querySelectorAll<HTMLButtonElement>(
          '[data-poi]',
        )) {
          button.hidden = !this.filters.has(
            this.pois.find((p) => p.id === button.dataset.poi)!.type,
          );
        }
        this.draw(this.large, false);
      };
    this.line = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0xb8ec7c,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.line.frustumCulled = false;
    scene.add(this.line);
    this.allocateRouteBuffer();
  }

  setCollected(ids: readonly string[]) {
    this.collected = new Set(ids);
    for (const b of this.panel.querySelectorAll<HTMLButtonElement>(
      '[data-poi]',
    )) {
      const p = this.pois.find((p) => p.id === b.dataset.poi);
      if (p)
        b.querySelector('small')!.textContent =
          (this.collected.has(p.id) ? 'RACCOLTO · ' : '') + p.description;
    }
  }
  private allocateRouteBuffer() {
    this.line.geometry.dispose();
    this.line.geometry = new THREE.BufferGeometry();
    this.routeVertices = new Float32Array((this.graph.nodes.length + 2) * 18);
    this.line.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.routeVertices, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    this.line.geometry.setDrawRange(0, 0);
  }
  setAtlas(graph: RoadGraph, unlocked: number) {
    this.graph = graph;
    this.allocateRouteBuffer();
    this.unlocked = unlocked;
    this.mapX = unlocked >= 3 ? 700 : unlocked > 1 ? 540 : 0;
    this.mapZ = unlocked > 2 ? 540 : 0;
    this.mapSpan = unlocked >= 3 ? 2440 : unlocked > 1 ? 2160 : 1080;
  }
  setDistrict(name: string, pois: typeof data.pois, preserveRoute = false) {
    this.pois = pois;
    if (!preserveRoute) this.clear();
    else if (this.target) this.recalculate();
    document.querySelector('.mini-title')!.innerHTML =
      `${name.toUpperCase()} <span>GPS</span>`;
    this.panel.setAttribute('aria-label', `Mappa di ${name}`);
    this.panel.querySelector('h2')!.textContent = name;
    this.panel.querySelector('.eyebrow')!.textContent =
      'PORT RIDERS / ' + name.toUpperCase();
    this.small.setAttribute('aria-label', `Minimappa ${name}`);
    const aside = this.panel.querySelector('aside')!;
    aside.innerHTML = `<span class="eyebrow">DESTINAZIONI</span>${pois.map((p) => `<button data-poi="${p.id}" ${this.filters.has(p.type) ? '' : 'hidden'}>${p.name}<small>${p.description}</small></button>`).join('')}<button id="clear-gps">CANCELLA PERCORSO</button>`;
    for (const button of aside.querySelectorAll<HTMLButtonElement>(
      '[data-poi]',
    ))
      button.onclick = () => {
        if (!this.racePath) {
          const p = this.pois.find((p) => p.id === button.dataset.poi)!;
          this.setTarget(p, p.name);
        }
      };
    aside.querySelector<HTMLButtonElement>('#clear-gps')!.onclick = () =>
      this.clear();
  }
  bindOpen(callback: () => void) {
    document.querySelector<HTMLButtonElement>('#open-map')!.onclick = callback;
  }
  show() {
    this.open = true;
    this.panel.hidden = false;
    this.draw(this.large, false);
    this.panel.querySelector<HTMLButtonElement>('#close-map')!.focus();
  }
  hide() {
    this.open = false;
    this.panel.hidden = true;
  }

  private setTarget(position: RoadPosition, name: string) {
    this.target = nearestRoad(this.graph, position.x, position.z);
    this.destination = name;
    this.recalculate();
    this.draw(this.large, false);
  }

  clear() {
    if (this.racePath) return;
    this.target = undefined;
    this.route = [];
    this.distance = 0;
    this.line.visible = false;
    this.gps.textContent = 'Scegli una destinazione sulla mappa';
    this.info.textContent = 'Percorso cancellato.';
    this.draw(this.large, false);
  }

  setRaceRoute(
    points: readonly { x: number; z: number }[] | null,
    name: string,
    markers: readonly { x: number; z: number; color: string }[],
  ) {
    this.racePath = points;
    this.raceName = name;
    this.raceMarkers = markers;
    this.panel.querySelector<HTMLElement>('.map-card > p')!.textContent = points
      ? 'Mappa della gara: segui il percorso e i checkpoint. Il GPS personale è disponibile nella guida libera.'
      : 'Clicca una strada o un punto di interesse per impostare il GPS.';
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '[data-poi],#clear-gps',
    ))
      button.disabled = !!points;
    if (points) {
      this.line.visible = false;
      this.info.textContent = `Percorso gara: ${name}. Attraversa i checkpoint nell’ordine indicato.`;
      this.gps.textContent = name;
    } else {
      this.info.textContent = 'Scegli una destinazione per il GPS.';
      this.gps.textContent = 'Scegli una destinazione sulla mappa';
    }
  }

  private recalculate() {
    if (!this.target) return;
    this.routeOrigin.x = this.position.x;
    this.routeOrigin.z = this.position.z;
    this.route = routeFromPosition(this.graph, this.position, this.target);
    this.distance = 0;
    for (let i = 1; i < this.route.length; i++)
      this.distance += Math.hypot(
        this.route[i].x - this.route[i - 1].x,
        this.route[i].z - this.route[i - 1].z,
      );
    const vertices = this.routeVertices;
    let cursor = 0;
    for (let i = 1; i < this.route.length; i++) {
      const a = this.route[i - 1],
        b = this.route[i],
        length = Math.hypot(b.x - a.x, b.z - a.z);
      if (length < 0.01) continue;
      const nx = (-(b.z - a.z) / length) * 0.65,
        nz = ((b.x - a.x) / length) * 0.65;
      vertices[cursor++] = a.x + nx;
      vertices[cursor++] = roadHeight(a.x, a.z) + 0.06;
      vertices[cursor++] = a.z + nz;
      vertices[cursor++] = b.x + nx;
      vertices[cursor++] = roadHeight(b.x, b.z) + 0.06;
      vertices[cursor++] = b.z + nz;
      vertices[cursor++] = a.x - nx;
      vertices[cursor++] = roadHeight(a.x, a.z) + 0.06;
      vertices[cursor++] = a.z - nz;
      vertices[cursor++] = a.x - nx;
      vertices[cursor++] = roadHeight(a.x, a.z) + 0.06;
      vertices[cursor++] = a.z - nz;
      vertices[cursor++] = b.x + nx;
      vertices[cursor++] = roadHeight(b.x, b.z) + 0.06;
      vertices[cursor++] = b.z + nz;
      vertices[cursor++] = b.x - nx;
      vertices[cursor++] = roadHeight(b.x, b.z) + 0.06;
      vertices[cursor++] = b.z - nz;
    }
    this.line.geometry.setDrawRange(0, cursor / 3);
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.visible = true;
    const text = `${this.destination} · ${Math.round(this.distance)} m`;
    this.gps.textContent = text;
    this.info.textContent = `GPS impostato: ${text}. Il percorso è evidenziato sulla strada.`;
  }

  update(x: number, z: number, yaw: number, dt: number) {
    this.position.x = x;
    this.position.z = z;
    this.yaw = yaw;
    this.timer += dt;
    this.drawTimer += dt;
    if (this.drawTimer < 0.1) return;
    this.drawTimer = 0;
    const recalc = this.timer >= 0.8;
    if (this.racePath) {
      this.gps.textContent = `GARA · ${this.raceName}`;
    } else if (
      this.target &&
      Math.hypot(x - this.target.x, z - this.target.z) < 22
    ) {
      this.gps.textContent = `Arrivato: ${this.destination}`;
      this.info.textContent = `Destinazione raggiunta: ${this.destination}`;
      this.target = undefined;
      this.route = [];
      this.distance = 0;
      this.line.visible = false;
    } else if (
      recalc &&
      this.target &&
      Math.hypot(x - this.routeOrigin.x, z - this.routeOrigin.z) > 12
    )
      this.recalculate();
    if (recalc) this.timer = 0;
    this.draw(this.small, true);
    if (this.open) this.draw(this.large, false);
  }

  private draw(canvas: HTMLCanvasElement, mini: boolean) {
    const ctx = canvas.getContext('2d')!,
      size = canvas.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b1724';
    ctx.fillRect(0, 0, size, canvas.height);
    let centerX = this.mapX,
      centerZ = this.mapZ,
      span = this.mapSpan;
    if (!mini && this.racePath) {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      for (const p of this.racePath) {
        minX = Math.min(minX, p.x - 60);
        maxX = Math.max(maxX, p.x + 60);
        minZ = Math.min(minZ, p.z - 60);
        maxZ = Math.max(maxZ, p.z + 60);
      }
      centerX = (minX + maxX) / 2;
      centerZ = (minZ + maxZ) / 2;
      span = Math.max(maxX - minX, maxZ - minZ);
    }
    const scale = mini ? 0.46 : size / span;
    ctx.save();
    ctx.translate(size / 2, canvas.height / 2);
    if (mini && this.rotated) ctx.rotate(this.yaw + Math.PI);
    ctx.scale(scale, scale);
    ctx.translate(
      mini ? -this.position.x : -centerX,
      mini ? -this.position.z : -centerZ,
    );
    if (!mini && this.mapSpan > 1080) {
      for (let i = 0; i < this.unlocked; i++) {
        const o = ORIGINS[i];
        if (!o) continue;
        ctx.strokeStyle = '#7b9baa';
        ctx.lineWidth = 1 / scale;
        ctx.strokeRect(o.x - 480, o.z - 480, 960, 960);
        ctx.fillStyle = '#d3ec7b';
        ctx.font = `700 ${18 / scale}px "Circuit Grid"`;
        ctx.fillText(districts.districts[i].name, o.x - 400, o.z - 440);
      }
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#344b5c';
    ctx.lineWidth = data.roadWidth;
    ctx.beginPath();
    for (const edge of this.graph.edges) {
      const a = this.graph.nodes[edge.a],
        b = this.graph.nodes[edge.b];
      ctx.moveTo(a.x, a.z);
      ctx.lineTo(b.x, b.z);
    }
    ctx.stroke();
    const path = this.racePath ?? this.route;
    if (path.length) {
      ctx.strokeStyle = this.racePath ? '#77dce5' : '#d3ec7b';
      ctx.lineWidth = 5 / scale;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const point = path[i];
        if (i) ctx.lineTo(point.x, point.z);
        else ctx.moveTo(point.x, point.z);
      }
      ctx.stroke();
    }
    if (this.racePath)
      for (const marker of this.raceMarkers) {
        ctx.fillStyle = marker.color;
        ctx.beginPath();
        ctx.arc(marker.x, marker.z, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
      }
    for (const poi of this.pois)
      if (this.filters.has(poi.type)) {
        ctx.fillStyle = this.collected.has(poi.id)
          ? '#526a73'
          : POI_COLORS[poi.type];
        ctx.beginPath();
        ctx.arc(poi.x, poi.z, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
        if (!mini && this.mapSpan === 1080) {
          ctx.font = '600 17px "Circuit Grid"';
          ctx.textAlign = poi.x > 200 ? 'right' : 'left';
          ctx.fillText(poi.name, poi.x + (poi.x > 200 ? -12 : 12), poi.z - 13);
        }
      }
    if (this.target) {
      ctx.strokeStyle = '#d3ec7b';
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.z, 11 / scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.translate(this.position.x, this.position.z);
    ctx.rotate(-this.yaw);
    ctx.fillStyle = '#f1f6f8';
    ctx.strokeStyle = '#07111e';
    ctx.lineWidth = 2 / scale;
    ctx.beginPath();
    ctx.moveTo(0, 10 / scale);
    ctx.lineTo(-6 / scale, -6 / scale);
    ctx.lineTo(0, -3 / scale);
    ctx.lineTo(6 / scale, -6 / scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#8eabb7';
    ctx.font = '600 14px "Circuit Grid"';
    ctx.fillText(t(mini && this.rotated ? 'AUTO ↑' : 'N ↑'), 12, 22);
  }
}
