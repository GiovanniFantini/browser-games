import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// Capture the actual meshes once. Dialogue portraits add no continuous render pass.
export function createPortraits(renderer: THREE.WebGLRenderer, goku: THREE.Object3D, bulma: THREE.Object3D) {
  const size = renderer.getSize(new THREE.Vector2());
  const ratio = renderer.getPixelRatio(), shadows = renderer.shadowMap.enabled;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd7ebf7);
  scene.add(new THREE.HemisphereLight(0xffffff,0x506481,2));
  const sun = new THREE.DirectionalLight(0xfff3df,2.4);sun.position.set(-3,5,5);scene.add(sun);
  renderer.setPixelRatio(1);renderer.setSize(128,160,false);renderer.shadowMap.enabled=false;
  const portraits: Record<string,string> = {};
  for(const [kind,source,headY] of [['goku',goku,1.96],['bulma',bulma,2.77]] as const){
    const model=clone(source); model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.setScalar(1);
    model.traverse(object=>{
      if(object instanceof THREE.Mesh && object.userData.isContour && object.material instanceof THREE.ShaderMaterial){
        const shader=object.material;
        object.onBeforeRender=currentRenderer=>{currentRenderer.getDrawingBufferSize(shader.uniforms.resolution.value);};
      }
    });
    scene.add(model);
    const targetY=typeof source.userData.portraitTarget==='number'?source.userData.portraitTarget:headY;
    const camera=new THREE.PerspectiveCamera(32,128/160,0.1,10);
    camera.position.set(kind==='goku'?0.12:0.08,targetY+0.04,kind==='goku'?2.75:2.1);camera.lookAt(0,targetY,0);
    renderer.render(scene,camera);
    portraits[kind]=renderer.domElement.toDataURL('image/png');
    scene.remove(model);
  }
  renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);renderer.shadowMap.enabled=shadows;
  return portraits;
}
