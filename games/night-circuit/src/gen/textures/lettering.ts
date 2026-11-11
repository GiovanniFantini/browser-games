import typeface from './typeface.json';

// Original vector strokes shared with tools/fonts/generate.py.
export function drawLettering(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  scale: number,
  weight = 1.15,
) {
  ctx.save();
  ctx.lineWidth = scale * weight;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const char of text) {
    const glyph = typeface[char as keyof typeof typeface] ?? typeface['?'];
    for (const stroke of glyph.strokes) {
      ctx.beginPath();
      stroke.forEach(([px, py], i) =>
        i
          ? ctx.lineTo(x + px * scale, baseline - py * scale)
          : ctx.moveTo(x + px * scale, baseline - py * scale),
      );
      ctx.stroke();
    }
    x += (glyph.width + 3) * scale;
  }
  ctx.restore();
}
