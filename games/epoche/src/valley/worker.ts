import { replay, resolve, type Book, type Turn } from "./game";
self.onmessage = (e: MessageEvent<{ book: Book; turn: Turn }>) => {
  try {
    const { book, history } = replay(e.data.book);
    resolve(history[history.length - 1]!, e.data.turn);
    self.postMessage({
      ok: true,
      book: { ...book, turns: [...book.turns, e.data.turn] },
    });
  } catch {
    self.postMessage({ ok: false });
  }
};
