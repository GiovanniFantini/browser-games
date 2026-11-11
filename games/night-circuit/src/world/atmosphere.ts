import * as THREE from 'three';

function cloudNoise() {
  const pixels = new Uint8Array(256 * 256);
  let seed = 7193;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    pixels[i] = (seed >>> 24) & 255;
  }
  const map = new THREE.DataTexture(pixels, 256, 256, THREE.RedFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

/** Original dusk sky. Clouds are evaluated in world directions, never screen space. */
export class Atmosphere {
  private readonly dome = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      uniforms: {
        cloudNoise: { value: cloudNoise() },
        inverseProjection: { value: new THREE.Matrix4() },
        cameraWorld: { value: new THREE.Matrix4() },
      },
      vertexShader: `varying vec2 skyUv;
        void main(){skyUv=position.xy;gl_Position=vec4(position.xy,1.,1.);}`,
      fragmentShader: `varying vec2 skyUv;uniform mat4 inverseProjection;uniform mat4 cameraWorld;uniform sampler2D cloudNoise;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return texture2D(cloudNoise,(i+f+.5)/256.).r;}
        float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.03+7.3;a*=.5;}return v;}
        void main(){vec4 view=inverseProjection*vec4(skyUv,1.,1.);vec3 d=normalize(mat3(cameraWorld)*view.xyz);float h=max(0.,d.y);
          vec3 col=mix(vec3(.19,.075,.12),vec3(.016,.025,.073),pow(h,.55));
          vec2 q=d.xz/(h+.27)*1.7;float n=fbm(q*1.7);
          float clouds=smoothstep(.33,.66,n);float underside=smoothstep(.2,.75,fbm(q*1.7+vec2(0,.17)));
          col=mix(col,mix(vec3(.064,.045,.085),vec3(.30,.13,.18),underside),clouds*.86);
          col+=vec3(.16,.065,.025)*exp(-pow((d.y-.025)*7.,2.))*(.3+.7*noise(q));
          float horizon=.012+fbm(vec2(atan(d.x,d.z)*13.,0.))* .035;
          col=mix(col,vec3(.012,.022,.026),1.-smoothstep(horizon,horizon+.012,d.y));
          float stars=step(.9986,hash(floor(d.xz/(h+.1)*900.)))*smoothstep(.3,.7,h)*(1.-clouds);
          col+=vec3(.3,.35,.5)*stars;
          gl_FragColor=vec4(col*.48,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  constructor(scene: THREE.Scene) {
    this.dome.name = 'procedural-dusk-sky';
    this.dome.renderOrder = -1000;
    this.dome.frustumCulled = false;
    scene.add(this.dome);
  }
  update(camera: THREE.PerspectiveCamera) {
    camera.updateMatrixWorld();
    this.dome.material.uniforms.inverseProjection.value.copy(
      camera.projectionMatrixInverse,
    );
    this.dome.material.uniforms.cameraWorld.value.copy(camera.matrixWorld);
  }
}
