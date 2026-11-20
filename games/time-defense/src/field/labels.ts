import { intersectsSegment, overlaps, containsPoint } from "./geometry";
import type { Point, Rect } from "./geometry";
export interface Caption {
  readonly id: string;
  readonly text: string;
  readonly anchor: Point;
  readonly offset: Point;
  readonly meter?: number;
}
export interface PlacedCaption extends Rect {
  readonly id: string;
  readonly text: string;
  readonly anchor: Point;
  readonly center: Point;
  readonly leader: boolean;
  readonly meter?: number;
  readonly leaderPoints: readonly Point[];
}
function connection(anchor: Point, center: Point, bodies: readonly Rect[], placed: readonly PlacedCaption[],
  width: number, height: number): readonly Point[] | null {
  const obstacles=bodies.filter(body=>!containsPoint(body,anchor));
  const safe=(points: readonly Point[]): boolean=>points.slice(1).every((point,i)=>
    ![...obstacles,...placed].some(body=>intersectsSegment(points[i]!,point,body)));
  const straight=[anchor,center];
  if(safe(straight))return straight;
  const routes: Point[][]=[];
  const xs=[2,width-2,...obstacles.flatMap(body=>[body.x-6,body.x+body.width+6])];
  const ys=[2,height-2,...obstacles.flatMap(body=>[body.y-6,body.y+body.height+6])];
  for(const x of xs)if(x>=2&&x<=width-2)routes.push([anchor,{x,y:anchor.y},{x,y:center.y},center]);
  for(const y of ys)if(y>=2&&y<=height-2)routes.push([anchor,{x:anchor.x,y},{x:center.x,y},center]);
  const length=(route:readonly Point[]):number=>route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-route[i]!.x,p.y-route[i]!.y),0);
  return routes.filter(safe).sort((a,b)=>length(a)-length(b))[0] ?? null;
}
export function placeCaptions(
  context: CanvasRenderingContext2D,
  captions: readonly Caption[],
  width: number,
  height: number,
  bodies: readonly Rect[],
  leaderBodies:readonly Rect[]=bodies,
): readonly PlacedCaption[] {
  context.font = "600 14px system-ui";
  const placed: PlacedCaption[] = [];
  for (const caption of captions) {
    const w = context.measureText(caption.text).width + 14,
      h = caption.meter === undefined ? 24 : 32;
    const candidates: (PlacedCaption & { score: number })[] = [];
    const rows = caption.meter === undefined ? [0,28,-28,56,-56,84,-84,112,-112]
      : [0,...Array.from({length:8},(_,i)=>[(i+1)*36,-(i+1)*36]).flat()];
    for (const dy of rows)
      for (const dx of [
        0,
        w + 10,
        -w - 10,
        2 * (w + 10),
        -2 * (w + 10),
        3 * (w + 10),
        -3 * (w + 10),
        ...(caption.meter === undefined ? [] : [4*(w+10),-4*(w+10),5*(w+10),-5*(w+10)]),
      ]) {
        const x = Math.max(
          w / 2 + 5,
          Math.min(width - w / 2 - 5, caption.anchor.x + caption.offset.x + dx),
        );
        const y = Math.max(
          h / 2 + 5,
          Math.min(
            height - h / 2 - 5,
            caption.anchor.y + caption.offset.y + dy,
          ),
        );
        const box = { x: x - w / 2, y: y - h / 2, width: w, height: h };
        if (bodies.some((b) => overlaps(b, box, 3))) continue;
        // A caption may not consume the attachment point of a later caption.
        if (
          captions.some(
            (other) =>
              other.id !== caption.id &&
              other.anchor.x >= box.x - 4 &&
              other.anchor.x <= box.x + box.width + 4 &&
              other.anchor.y >= box.y - 4 &&
              other.anchor.y <= box.y + box.height + 4,
          )
        )
          continue;
        candidates.push({
          ...box,
          id: caption.id,
          text: caption.text,
          ...(caption.meter === undefined ? {} : {meter: caption.meter}),
          anchor: caption.anchor,
          center: { x, y },
          leader: Math.hypot(x - caption.anchor.x, y - caption.anchor.y) > 8,
          leaderPoints: [],
          score: Math.hypot(
            x - caption.anchor.x - caption.offset.x,
            y - caption.anchor.y - caption.offset.y,
          ),
        });
      }
    candidates.sort((a, b) => a.score - b.score);
    let chosen: PlacedCaption | undefined, bestScore=Infinity;
    for(const candidate of candidates) {
      if(candidate.score>bestScore)break;
      if(placed.some(other=>overlaps(candidate,other,3)||other.leaderPoints.slice(1).some((point,i)=>
        intersectsSegment(other.leaderPoints[i]!,point,candidate))))continue;
      const points=connection(candidate.anchor,candidate.center,leaderBodies,placed,width,height);
      if(!points)continue;
      const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i]!.x,p.y-points[i]!.y),0);
      const direct=Math.hypot(candidate.center.x-candidate.anchor.x,candidate.center.y-candidate.anchor.y);
      const score=candidate.score+(length-direct)*0.15;
      if(score<bestScore){bestScore=score;chosen={...candidate,leaderPoints:points};}
    }
    if (!chosen){
      throw new Error("The field cannot fit its essential caption: "+caption.id);
    }
    placed.push(chosen);
  }
  return placed;
}
