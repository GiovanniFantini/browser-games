import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A dedicated ramp leaves the landscape's existing lighting unchanged.
const ramp = new THREE.DataTexture(new Uint8Array([85, 185, 255]), 3, 1, THREE.RedFormat);
ramp.minFilter = THREE.NearestFilter; ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const cel = new Map<string, THREE.MeshToonMaterial>();
const resolution = new THREE.Vector2(1280, 720);
const outline = new THREE.ShaderMaterial({
  uniforms: { resolution: { value: resolution }, thickness: { value: 1.05 } },
  vertexShader: `
    uniform vec2 resolution;
    uniform float thickness;
    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vec3 viewNormal = normalize(normalMatrix * normal);
      vec4 clipPosition = projectionMatrix * viewPosition;
      vec2 projectedNormal = (projectionMatrix * vec4(viewNormal, 0.0)).xy;
      float normalLength = length(projectedNormal);
      if (normalLength > 0.0001) clipPosition.xy += projectedNormal / normalLength * (2.0 * thickness / resolution) * clipPosition.w;
      gl_Position = clipPosition;
    }`,
  fragmentShader: `void main() { gl_FragColor = vec4(0.025, 0.035, 0.065, 1.0); }`,
  side: THREE.BackSide,
});

const skinnedOutline=new THREE.ShaderMaterial({
  uniforms:outline.uniforms,
  vertexShader:`
    uniform vec2 resolution;
    uniform float thickness;
    #include <common>
    #include <skinning_pars_vertex>
    void main(){
      #include <beginnormal_vertex>
      #include <skinbase_vertex>
      #include <skinnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
      #include <skinning_vertex>
      #include <project_vertex>
      vec2 projectedNormal=(projectionMatrix*vec4(transformedNormal,0.0)).xy;
      float normalLength=length(projectedNormal);
      if(normalLength>0.0001)gl_Position.xy+=projectedNormal/normalLength*(2.0*thickness/resolution)*gl_Position.w;
    }`,
  fragmentShader:outline.fragmentShader,side:THREE.BackSide,
});
function celMaterial(old:THREE.MeshToonMaterial){
  const key=old.color.getHexString()+(old.map?':'+old.map.uuid:'');
  if(!cel.has(key))cel.set(key,new THREE.MeshToonMaterial({color:old.color,map:old.map,gradientMap:ramp}));
  return cel.get(key)!;
}

export function applyCharacterCel(root: THREE.Group) {
  const parents: THREE.Object3D[] = []; root.traverse(object => parents.push(object));
  for (const parent of parents) {
    const hulls: THREE.BufferGeometry[] = [];
    for (const child of [...parent.children]) {
      if(child instanceof THREE.SkinnedMesh){
        child.material=Array.isArray(child.material)?child.material.map(m=>m instanceof THREE.MeshToonMaterial?celMaterial(m):m):child.material;
        const hull=new THREE.SkinnedMesh(child.geometry,skinnedOutline);hull.name='cel-contour';hull.userData.isContour=true;
        hull.position.copy(child.position);hull.quaternion.copy(child.quaternion);hull.scale.copy(child.scale);hull.bind(child.skeleton,child.bindMatrix);
        hull.onBeforeRender=renderer=>{renderer.getDrawingBufferSize(resolution);};parent.add(hull);continue;
      }
      if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshToonMaterial)) continue;
      child.material = celMaterial(child.material);
      child.geometry.computeBoundingBox();
      const size = child.geometry.boundingBox!.getSize(new THREE.Vector3());
      // Fine ink strokes need no second contour pass.
      if (Math.max(size.x, size.y, size.z) < 0.08) continue;
      child.updateMatrix();
      const geometry = child.geometry.clone().applyMatrix4(child.matrix);
      for (const attribute of Object.keys(geometry.attributes)) if (!['position', 'normal'].includes(attribute)) geometry.deleteAttribute(attribute);
      hulls.push(geometry);
    }
    if (!hulls.length) continue;
    const geometry = mergeGeometries(hulls, false);
    hulls.forEach(hull => hull.dispose());
    if (!geometry) continue;
    const hull = new THREE.Mesh(geometry, outline);
    hull.name = 'cel-contour'; hull.userData.isContour = true;
    hull.onBeforeRender = renderer => { renderer.getDrawingBufferSize(resolution); };
    hull.castShadow = false; hull.receiveShadow = false;
    parent.add(hull);
  }
}
