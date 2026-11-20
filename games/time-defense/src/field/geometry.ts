export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface Rect extends Point {
  readonly width: number;
  readonly height: number;
}
export interface CameraTransform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

// Fixed throughout a field visit. Refines task28's border to avoid vertical letterboxing.
export const fieldCamera: Rect = {
  x: -260,
  y: -240,
  width: 2016,
  height: 1344,
};
export function fitCamera(width: number, height: number): CameraTransform {
  const scale = Math.min(
    width / fieldCamera.width,
    height / fieldCamera.height,
  );
  return {
    scale,
    offsetX: (width - fieldCamera.width * scale) / 2 - fieldCamera.x * scale,
    offsetY: (height - fieldCamera.height * scale) / 2 - fieldCamera.y * scale,
  };
}
export function project(point: Point, camera: CameraTransform): Point {
  return {
    x: point.x * camera.scale + camera.offsetX,
    y: point.y * camera.scale + camera.offsetY,
  };
}
export function unproject(point: Point, camera: CameraTransform): Point {
  return {
    x: (point.x - camera.offsetX) / camera.scale,
    y: (point.y - camera.offsetY) / camera.scale,
  };
}
export function pickSlot<T extends Point & { readonly id: string }>(
  point: Point,
  slots: readonly T[],
  radius: number,
): T | null {
  let nearest: T | null = null,
    best = radius;
  for (const slot of slots) {
    const distance = Math.hypot(slot.x - point.x, slot.y - point.y);
    if (
      distance < best ||
      (distance === best && (!nearest || slot.id.localeCompare(nearest.id) < 0))
    ) {
      nearest = slot;
      best = distance;
    }
  }
  return nearest;
}
export function intersectsSegment(from: Point, to: Point, box: Rect): boolean {
  let low = 0,
    high = 1;
  for (const [a, b, min, max] of [
    [from.x, to.x, box.x, box.x + box.width],
    [from.y, to.y, box.y, box.y + box.height],
  ]) {
    if (
      a === undefined ||
      b === undefined ||
      min === undefined ||
      max === undefined
    )
      return false;
    const delta = b - a;
    if (Math.abs(delta) < 1e-9) {
      if (a < min || a > max) return false;
    } else {
      low = Math.max(low, Math.min((min - a) / delta, (max - a) / delta));
      high = Math.min(high, Math.max((min - a) / delta, (max - a) / delta));
      if (low > high) return false;
    }
  }
  return true;
}
export function overlaps(a: Rect, b: Rect, gap = 0): boolean {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

/** Inclusive edge test with subpixel tolerance for independently projected corners. */
export function containsPoint(rect:Rect,point:Point):boolean{const epsilon=1e-7;return point.x>=rect.x-epsilon&&point.x<=rect.x+rect.width+epsilon&&point.y>=rect.y-epsilon&&point.y<=rect.y+rect.height+epsilon;}
