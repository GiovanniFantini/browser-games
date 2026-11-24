/// <reference lib="webworker" />

import { loadCampaignContent } from "@content/campaign/index";
import { loadContent } from "@content/index";
import { TICKS_PER_SECOND } from "@engine/core/time";
import type { ToWorker } from "./protocol";
import { createRuntime } from "./runtime";

const scope = self as unknown as DedicatedWorkerGlobalScope;

try {
  const runtime = createRuntime(
    loadContent(),
    (message) => scope.postMessage(message),
    loadCampaignContent,
  );
  const timer = setInterval(
    () => protect(runtime.advanceInterval),
    1000 / TICKS_PER_SECOND,
  );
  scope.onmessage = (event: MessageEvent<ToWorker>) =>
    protect(() => runtime.handle(event.data));

  function protect(action: () => void): void {
    try {
      action();
    } catch (error) {
      clearInterval(timer);
      reportError(error);
    }
  }
} catch (error) {
  reportError(error);
}

function reportError(error: unknown): void {
  scope.postMessage({
    type: "ERROR",
    message: error instanceof Error ? error.message : String(error),
  });
}
