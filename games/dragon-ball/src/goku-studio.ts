import * as THREE from 'three';
import { character } from './characters';

// A fixed, repeatable view of the real game mesh for visual review. No saves.
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.toneMapping=THREE.NeutralToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xe7e6e1);scene.add(new THREE.HemisphereLight(0xffffff,0x707782,2.0));
const sun=new THREE.DirectionalLight(0xfff4e4,2.1);sun.position.set(-3,6,6);scene.add(sun);
const goku=character('goku');scene.add(goku.root);
const silhouette=document.getElementById('silhouette') as HTMLInputElement,ready=document.getElementById('ready') as HTMLInputElement;
const black=new THREE.MeshBasicMaterial({color:0x152021});
const originals=new Map<THREE.Mesh,{material:THREE.Material|THREE.Material[];visible:boolean}>();
goku.root.traverse(node=>{if(node instanceof THREE.Mesh)originals.set(node,{material:node.material,visible:node.visible});});
const camera=new THREE.OrthographicCamera(-.9,.9,1.125,-1.125,.1,30);
function draw(){
  goku.root.userData.pose=ready.checked?'ready':undefined;goku.animate(0,0);goku.root.updateMatrixWorld(true);
  for(const [node,original] of originals){
    node.visible=original.visible;node.material=original.material;
    if(silhouette.checked){
      const materials=Array.isArray(original.material)?original.material:[original.material];
      if(materials.some(m=>m.transparent)||node.userData.isContour)node.visible=false;
      else node.material=black;
    }
  }
  for(const [id,angle] of [['front',0],['quarter',Math.PI/4],['profile',Math.PI/2]] as const){
    goku.root.rotation.y=angle;
    camera.position.set(0,2.08,10);camera.lookAt(0,2.08,0);
    camera.left=-.9;camera.right=.9;camera.top=1.125;camera.bottom=-1.125;camera.updateProjectionMatrix();
    renderer.setSize(512,640,false);renderer.render(scene,camera);
    (document.getElementById(id) as HTMLImageElement).src=renderer.domElement.toDataURL('image/png');
    camera.top=.9;camera.bottom=-.9;camera.updateProjectionMatrix();renderer.setSize(128,128,false);renderer.render(scene,camera);
    (document.getElementById(id+'-mini') as HTMLImageElement).src=renderer.domElement.toDataURL('image/png');
  }
  document.getElementById('status')!.textContent='Stessa mesh del gioco, viste alla stessa scala. La somiglianza resta da valutare.';
}
silhouette.onchange=draw;ready.onchange=draw;draw();
