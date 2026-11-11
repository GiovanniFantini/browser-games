import * as THREE from 'three';
const installed = new WeakSet<THREE.Material>();
/** World-space attenuation keeps elevated terrain and upper towers out of dense ground mist. */
export function installHeightFog(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (
        installed.has(material) ||
        !(
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshBasicMaterial
        )
      )
        continue;
      installed.add(material);
      const previous = material.onBeforeCompile,
        key = material.customProgramCacheKey.bind(material);
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.vertexShader =
          'varying float vGroundFogHeight;\n' +
          shader.vertexShader.replace(
            '#include <fog_vertex>',
            `#include <fog_vertex>
 #ifdef USE_FOG
 vec4 groundFogPosition=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 groundFogPosition=instanceMatrix*groundFogPosition;
 #endif
 vGroundFogHeight=(modelMatrix*groundFogPosition).y;
 #endif`,
          );
        shader.fragmentShader =
          'varying float vGroundFogHeight;\n' +
          shader.fragmentShader.replace(
            '#include <fog_fragment>',
            `#ifdef USE_FOG
 #ifdef FOG_EXP2
 float heightAttenuation=exp(-max(vGroundFogHeight,0.0)*0.025);
 float fogFactor=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*heightAttenuation*heightAttenuation);
 #else
 float fogFactor=smoothstep(fogNear,fogFar,vFogDepth);
 #endif
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor);
 #endif`,
          );
      };
      material.customProgramCacheKey = () => key() + '-ground-fog-1';
      material.needsUpdate = true;
    }
  });
}
