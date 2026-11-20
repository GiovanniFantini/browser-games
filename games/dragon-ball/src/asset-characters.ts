import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { Character } from './characters';

const loader = new GLTFLoader();
const models = new Map<string, THREE.Group>();
const loading = document.createElement('p'); loading.textContent = 'Preparazione dell’avventura…';
loading.setAttribute('role', 'status'); document.body.prepend(loading);
const ramp = new THREE.DataTexture(new Uint8Array([150, 220, 255]), 3, 1, THREE.RedFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
await Promise.all(['goku', 'bulma'].map(async kind => {
  const asset = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${kind}.glb`);
  asset.scene.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    // The projected concept already contains its cel tones. Avoid double lighting.
    const convert = (old: THREE.Material) => {
      const source = old as THREE.MeshStandardMaterial;
      const mat = source.map
        ? new THREE.MeshBasicMaterial({ map: source.map, color: source.color, side: THREE.FrontSide })
        : new THREE.MeshToonMaterial({ color: source.color.clone().multiplyScalar(.55), gradientMap: ramp });
      if (mat.map) { mat.map.anisotropy = 4; mat.map.colorSpace = THREE.SRGBColorSpace; }
      if (mat.map && !/gi/.test(node.name)) {
        const name = node.name.toLowerCase();
        let fallback = kind === 'goku' ? 0x25265e : 0xee7c44;
        if (/head|ear|neck|arm/.test(name) || kind === 'bulma' && /leg/.test(name)) fallback = 0xffbf8a;
        if (/hair|bang|braid/.test(name)) fallback = kind === 'goku' ? 0x090a10 : 0x279fa6;
        if (/boot/.test(name)) fallback = kind === 'goku' ? 0x202332 : 0x297296;
        mat.onBeforeCompile = shader => {
          shader.uniforms.sheetFallback = { value: new THREE.Color(fallback) };
          shader.fragmentShader = 'uniform vec3 sheetFallback;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            #include <map_fragment>
            float hi=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
            float lo=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
            if(hi-lo < .065 && hi > .10 && hi < .65) diffuseColor.rgb=sheetFallback;
          `);
        };
        mat.customProgramCacheKey = () => 'concept-background-key';
      }
      return mat;
    };
    node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material);
    node.castShadow = true; node.receiveShadow = false;
  });
  models.set(kind, asset.scene);
})).catch(error => {
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'Impossibile caricare i modelli 3D locali. Ricarica la pagina o riavvia il server del gioco.';
  document.body.prepend(message);
  throw error;
}).finally(() => loading.remove());

export function assetCharacter(kind: 'goku' | 'bulma'): Character {
  const root = clone(models.get(kind)!) as THREE.Group;
  root.name = `${kind}-concept-mesh-v1`;
  root.userData.modelRevision = 'blender-concept-projection-v1';
  root.userData.portraitTarget = kind === 'goku' ? 2.10 : 2.66;
  if (kind === 'goku') {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.18,10),new THREE.MeshBasicMaterial({color:0x982719}));
    staff.name='nyoi-bo'; staff.position.set(-.02,1.73,-.27); staff.rotation.z=-.48; staff.castShadow=true;root.add(staff);
  }
  const bones = new Map<string, THREE.Bone>();
  const rest = new Map<string, THREE.Quaternion>();
  const key = (name: string) => name.replace(/[._]/g, '');
  root.traverse(node => { if (node instanceof THREE.Bone) { bones.set(key(node.name), node); rest.set(key(node.name), node.quaternion.clone()); } });
  const axis = new THREE.Vector3(1, 0, 0);
  const turn = (name: string, angle: number) => {
    name = key(name);
    const bone = bones.get(name);
    if (bone) bone.quaternion.copy(rest.get(name)!).multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
  };
  return { root, animate(time, speed, airborne = false) {
    for (const [name, bone] of bones) bone.quaternion.copy(rest.get(name)!);
    const stride = Math.sin(time * 9.5) * Math.min(speed, 1) * .48;
    for (const [side, direction] of [['L', 1], ['R', -1]] as const) {
      turn(`thigh.${side}`, airborne ? direction * .4 : direction * stride);
      turn(`shin.${side}`, airborne ? .55 : Math.max(0, -direction * stride) * .65);
      let arm = airborne ? -1 : -direction * stride * .7;
      let elbow = -.10;
      if (root.userData.pose === 'ready') { arm = -.32; elbow = -.8; }
      if (root.userData.pose === 'carry' && side === 'L') { arm = -2.2; elbow = -.4; }
      if (root.userData.pose === 'lift') { arm = -2.5; elbow = -.2; }
      turn(`upper.${side}`, arm); turn(`lower.${side}`, elbow);
    }
    turn('tail', Math.sin(time * 1.8) * .08);
    root.updateMatrixWorld(true);
  } };
}
