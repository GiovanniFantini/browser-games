/** Bounded by the explicit map/token/rig URL inventory. Failed requests can retry. */
export class FieldImages {
  private readonly pending = new Map<string, Promise<HTMLImageElement>>();
  private readonly failed = new Set<string>();
  private retry = 0;
  load(url: string): Promise<HTMLImageElement> {
    const existing = this.pending.get(url);
    if (existing) return existing;
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.failed.delete(url);
        resolve(image);
      };
      image.onerror = () => {
        this.pending.delete(url);
        this.failed.add(url);
        reject(new Error("Una risorsa della mappa non è disponibile."));
      };
      const request = new URL(url, document.baseURI);
      if (this.failed.has(url))
        request.searchParams.set("retry", String(++this.retry));
      image.src = request.href;
    });
    this.pending.set(url, promise);
    return promise;
  }
}
