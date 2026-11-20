import type { Point } from "./geometry";
export interface Coverage {readonly length:number;readonly paths:readonly (readonly Point[])[];}
/** Acquisition range on the sampled route, not a promise of hits or damage. */
export function routeCoverage(points:readonly Point[],center:Point,radius:number):Coverage{
  let length=0;const paths:Point[][]=[];
  if(!Number.isFinite(radius)||radius<=0)return{length,paths};
  for(let i=1;i<points.length;i++){
    const a=points[i-1]!,b=points[i]!,dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy;if(A===0)continue;
    const x=a.x-center.x,y=a.y-center.y,B=2*(x*dx+y*dy),C=x*x+y*y-radius*radius,discriminant=B*B-4*A*C;
    if(discriminant<=0)continue;const root=Math.sqrt(discriminant),from=Math.max(0,(-B-root)/(2*A)),to=Math.min(1,(-B+root)/(2*A));if(to<=from)continue;
    const start={x:a.x+dx*from,y:a.y+dy*from},end={x:a.x+dx*to,y:a.y+dy*to},previous=paths.at(-1),last=previous?.at(-1);
    if(previous&&last&&Math.hypot(last.x-start.x,last.y-start.y)<1e-6)previous.push(end);else paths.push([start,end]);length+=(to-from)*Math.sqrt(A);
  }
  return{length,paths};
}
