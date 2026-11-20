import * as THREE from 'three';

export type Point=[number,number,number];
export type Profile=[y:number,width:number,front:number,back:number,x?:number,z?:number];

// Control sections describe the sculpt; cubic interpolation defines the surface
// between them. Render geometry is sampled from that surface, not its cage.
export function profileSampler(profile:Profile[]){
  const times=new Float32Array(profile.map(p=>p[0]));
  const values=new Float32Array(profile.flatMap(p=>[p[1],p[2],p[3],p[4]??0,p[5]??0]));
  const interpolant=new THREE.CubicInterpolant(times,values,5);
  return (y:number)=>{
    const v=interpolant.evaluate(THREE.MathUtils.clamp(y,times[0],times[times.length-1]));
    return [y,Math.max(.001,v[0]),Math.max(.001,v[1]),Math.max(.001,v[2]),v[3],v[4]] as Profile;
  };
}

export function curvedLoft(profile:Profile[],around=16,vertical=14,sculpt?:(p:THREE.Vector3,a:number,t:number)=>void){
  const sample=profileSampler(profile),vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  const min=profile[0][0],max=profile[profile.length-1][0];
  for(let j=0;j<=vertical;j++){
    const t=j/vertical,[y,w,front,back,cx=0,cz=0]=sample(THREE.MathUtils.lerp(min,max,t));
    for(let i=0;i<=around;i++){
      const a=-Math.PI+i/around*Math.PI*2,c=Math.cos(a);
      const p=new THREE.Vector3(cx+Math.sin(a)*w,y,cz+c*(c>=0?front:back));
      sculpt?.(p,a,t);vertices.push(...p.toArray());uv.push(i/around,t);
    }
  }
  const stride=around+1;
  for(let j=0;j<vertical;j++)for(let i=0;i<around;i++){
    const a=j*stride+i,b=a+1;indices.push(a,b,a+stride,b,b+stride,a+stride);
  }
  for(const [row,bottom] of [[0,true],[vertical,false]] as const){
    const base=row*stride;
    for(let i=1;i<around-1;i++)indices.push(...(bottom?[base,base+i+1,base+i]:[base,base+i,base+i+1]));
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const normals=g.attributes.normal;
  for(let j=0;j<=vertical;j++){
    const a=j*stride,b=a+around;
    const n=new THREE.Vector3(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();
    normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);
  }
  return g;
}

// A curved elliptical blade, tapering along a cubic center line. The cross
// section has volume and soft normals from every angle, including the back.
export function curvedLock(points:Point[],widths:number[],depths:number[],steps=7,sides=6){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const times=new Float32Array(points.map((_,i)=>i/(points.length-1)));
  const radii=new THREE.CubicInterpolant(times,new Float32Array(widths.flatMap((w,i)=>[w,depths[i]])),2);
  const vertices:number[]=[],indices:number[]=[];
  let previousTangent=curve.getTangent(0).normalize();
  const side=new THREE.Vector3(-previousTangent.y,previousTangent.x,0);
  if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
    side.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(previousTangent,tangent));
    side.addScaledVector(tangent,-side.dot(tangent)).normalize();previousTangent=tangent;
    const depth=new THREE.Vector3().crossVectors(side,tangent).normalize(),r=radii.evaluate(t);
    for(let j=0;j<sides;j++){
      const a=j/sides*Math.PI*2;
      const v=p.clone().addScaledVector(side,Math.cos(a)*Math.max(.0005,r[0])).addScaledVector(depth,Math.sin(a)*Math.max(.0005,r[1]));vertices.push(...v.toArray());
    }
    if(i)for(let j=0;j<sides;j++){const a=(i-1)*sides+j,b=(i-1)*sides+(j+1)%sides,c=i*sides+j,d=i*sides+(j+1)%sides;indices.push(a,c,b,b,c,d);}
  }
  for(let j=1;j<sides-1;j++){indices.push(0,j,j+1);const n=steps*sides;indices.push(n,n+j+1,n+j);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
