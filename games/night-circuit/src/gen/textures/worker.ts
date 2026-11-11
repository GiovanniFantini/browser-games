import { generateTexture, type TextureId } from './generator';
self.onmessage = async (
  event: MessageEvent<{ id: TextureId; seed: number; size: number }>,
) => {
  try {
    self.postMessage({
      pack: await generateTexture(
        event.data.id,
        event.data.seed,
        event.data.size,
      ),
    });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
