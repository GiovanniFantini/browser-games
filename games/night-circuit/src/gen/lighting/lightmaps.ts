import * as THREE from 'three';
import bake from './bake.json';
let city: THREE.Texture | undefined, tunnel: THREE.Texture | undefined;
const installed = new WeakSet<THREE.Material>();
export async function prepareBakedLighting() {
  const loader = new THREE.TextureLoader();
  [city, tunnel] = await Promise.all([
    loader.loadAsync(`${import.meta.env.BASE_URL}generated/city-lightmap.png`),
    loader.loadAsync(
      `${import.meta.env.BASE_URL}generated/underpass-lightmap.png`,
    ),
  ]);
  for (const map of [city, tunnel]) {
    map.colorSpace = THREE.NoColorSpace;
    map.flipY = false;
    map.generateMipmaps = false;
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
  }
}
/** Read precomputed RGB irradiance with two texture reads, with no extra light uniforms. */
export function installBakedLighting(root: THREE.Object3D) {
  if (!city || !tunnel) return;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    let owner: THREE.Object3D | null = object;
    while (owner) {
      if (owner.userData.dynamicVehicle) return;
      owner = owner.parent;
    }
    for (const m of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (!(m instanceof THREE.MeshStandardMaterial) || installed.has(m))
        continue;
      installed.add(m);
      const prior = m.onBeforeCompile,
        key = m.customProgramCacheKey.bind(m);
      m.onBeforeCompile = (shader, renderer) => {
        prior.call(m, shader, renderer);
        shader.uniforms.cityBake = { value: city };
        shader.uniforms.tunnelBake = { value: tunnel };
        shader.vertexShader =
          `varying vec3 vBakeWorld;\n${shader.vertexShader}`.replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
          vec4 bakePos=vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            bakePos=instanceMatrix*bakePos;
          #endif
          vBakeWorld=(modelMatrix*bakePos).xyz;`,
          );
        shader.fragmentShader =
          `varying vec3 vBakeWorld;uniform sampler2D cityBake;uniform sampler2D tunnelBake;\n${shader.fragmentShader}`
            .replace(
              '#include <lights_fragment_begin>',
              `
          vec2 cityUv=(vBakeWorld.xz-vec2(${bake.cityBounds.slice(0, 2).join(',')}))/vec2(${bake.cityBounds.slice(2).join(',')});
          vec2 tunnelUv=(vBakeWorld.xz-vec2(${bake.underpassBounds.slice(0, 2).join(',')}))/vec2(${bake.underpassBounds.slice(2).join(',')});
          vec3 bounce=texture2D(cityBake,cityUv).rgb;
          float covered=smoothstep(0.0,.07,tunnelUv.x)*(1.0-smoothstep(.93,1.0,tunnelUv.x))*smoothstep(0.0,.035,tunnelUv.y)*(1.0-smoothstep(.965,1.0,tunnelUv.y));
          bounce=mix(bounce,texture2D(tunnelBake,clamp(tunnelUv,0.0,1.0)).rgb,covered);
          float poolEnergy=max(bounce.r,max(bounce.g,bounce.b));
          float staticShade=mix(1.0,mix(.08,1.0,smoothstep(.08,.6,poolEnergy)),covered);
          float verticalFalloff=exp(-max(0.,vBakeWorld.y-1.5)*.19);
          totalEmissiveRadiance+=diffuseColor.rgb*bounce*2.2*verticalFalloff;
          vec2 lampCell=mod(vBakeWorld.xz+60.0,120.0)-60.0;
          float lampDistance=min(length(vec2(abs(lampCell.x)-14.0,60.0-abs(lampCell.y))),length(vec2(60.0-abs(lampCell.x),abs(lampCell.y)-14.0)));
          float coneWidth=max(.3,14.0+(9.5-vBakeWorld.y)*.8);
          float wallCone=exp(-pow(lampDistance/coneWidth,2.0))*(1.0-smoothstep(8.5,9.6,vBakeWorld.y));
          float verticalWall=1.0-smoothstep(.4,.75,abs(inverseTransformDirection(normal,viewMatrix).y));
          float lampHue=mod(floor((vBakeWorld.x+60.0)/120.0)+floor((vBakeWorld.z+60.0)/120.0),3.0);
          vec3 lampTint=lampHue<1.0?vec3(.65,.32,.16):lampHue<2.0?vec3(.19,.37,.58):vec3(.51,.21,.35);
          totalEmissiveRadiance+=diffuseColor.rgb*lampTint*wallCone*verticalWall*(1.0-covered);
          #include <lights_fragment_begin>`,
            )
            .replace(
              '#include <lights_fragment_end>',
              `#include <lights_fragment_end>
            reflectedLight.directDiffuse*=staticShade;
            reflectedLight.indirectDiffuse*=staticShade;
            reflectedLight.directSpecular*=mix(1.0,staticShade,covered);`,
            );
      };
      m.customProgramCacheKey = () => key() + '-baked-city-v3';
      m.needsUpdate = true;
    }
  });
}
