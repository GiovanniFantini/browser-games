import * as THREE from 'three';
import { character } from './characters';

const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.domElement.setAttribute('aria-label','Nuovo modello tridimensionale di Goku bambino');document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xe7e6e1);
scene.add(new THREE.HemisphereLight(0xffffff,0x707782,2.0));
const sun=new THREE.DirectionalLight(0xfff4e4,2.1);sun.position.set(-3,6,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.015;scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.16}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const goku=character('goku');scene.add(goku.root);
const camera=new THREE.PerspectiveCamera(29,innerWidth/innerHeight,.1,100);
let angle=.35,targetAngle=.35,zoom=7.6,close=false,walking=false,ready=true,drag=false,lastX=0,time=0,previous=performance.now();
goku.root.userData.pose='ready';
const button=(id:string)=>document.getElementById(id) as HTMLButtonElement;
function view(id:string,rotation:number,face=false){close=face;targetAngle=rotation;for(const name of ['three-quarter','front','side','back','face'])button(name).setAttribute('aria-pressed',String(name===id));}
button('three-quarter').onclick=()=>view('three-quarter',.35);button('front').onclick=()=>view('front',0);button('side').onclick=()=>view('side',Math.PI/2);button('back').onclick=()=>view('back',Math.PI);button('face').onclick=()=>view('face',.12,true);
button('walk').onclick=()=>{walking=!walking;button('walk').setAttribute('aria-pressed',String(walking));};
button('ready').onclick=()=>{ready=!ready;goku.root.userData.pose=ready?'ready':undefined;button('ready').setAttribute('aria-pressed',String(ready));};
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(drag){targetAngle+=(e.clientX-lastX)*.009;lastX=e.clientX;}});
renderer.domElement.addEventListener('pointerup',()=>drag=false);renderer.domElement.addEventListener('pointercancel',()=>drag=false);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.004,5.6,10);},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
camera.position.set(0,1.8,zoom);
renderer.setAnimationLoop(now=>{
  const dt=Math.min(.05,(now-previous)/1000);previous=now;time+=dt;angle+=(targetAngle-angle)*Math.min(1,dt*10);goku.root.rotation.y=angle;goku.animate(time,walking?.8:0);
  camera.position.lerp(new THREE.Vector3(0,close?2.15:1.85,close?4.3:zoom),Math.min(1,dt*10));camera.lookAt(0,close?2.12:1.48,0);
  renderer.render(scene,camera);
});
