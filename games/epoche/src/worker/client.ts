import type {
  Campaign,
  CampaignAction,
  QueuedPolicy,
  StartCampaign,
} from "@engine/campaign/model";
import type { Speed } from "@engine/core/commands";
import type { PolicyPreview } from "@engine/systems/policies";
import type { FromWorker, ToWorker, WorkerCommand } from "./protocol";

export interface CapturedCampaign {
  campaign: Campaign | null;
  speed: Speed;
  queued: QueuedPolicy[];
}

const captureTimeoutMs = 2500;

export function createClient(onMessage: (message: FromWorker) => void) {
  const worker = new Worker(
    new URL("./simulation.worker.ts", import.meta.url),
    { type: "module" },
  );
  const pending = new Map<number, (preview: PolicyPreview | null) => void>();
  const captures = new Map<
    number,
    (capture: CapturedCampaign | null) => void
  >();
  let nextId = 0;
  let unavailable = false;

  function clearPending(): void {
    for (const resolve of pending.values()) resolve(null);
    for (const resolve of captures.values()) resolve(null);
    pending.clear();
    captures.clear();
  }
  function post(message: ToWorker): void {
    worker.postMessage(message);
  }
  worker.onmessage = ({ data }: MessageEvent<FromWorker>) => {
    if (data.type === "PREVIEW") {
      pending.get(data.requestId)?.(data.preview);
      pending.delete(data.requestId);
    } else if (data.type === "CAPTURED") {
      captures.get(data.requestId)?.({
        campaign: data.campaign,
        speed: data.speed,
        queued: data.queued,
      });
      captures.delete(data.requestId);
    } else {
      if (data.type === "ERROR") {
        unavailable = true;
        clearPending();
      }
      onMessage(data);
    }
  };
  worker.onerror = (event) => {
    unavailable = true;
    clearPending();
    onMessage({ type: "ERROR", message: event.message });
  };
  worker.onmessageerror = () => {
    unavailable = true;
    clearPending();
    onMessage({ type: "ERROR", message: "Unreadable simulation message" });
  };

  return {
    init(seed: number) {
      post({ type: "INIT", seed });
    },
    start(start: StartCampaign) {
      post({ type: "START_CAMPAIGN", start });
    },
    restore(
      campaign: Campaign,
      speed: Speed,
      elapsed: number,
      queued: QueuedPolicy[],
    ) {
      post({ type: "RESTORE_CAMPAIGN", campaign, speed, elapsed, queued });
    },
    action(action: CampaignAction) {
      post({ type: "ACTION", action });
    },
    send(command: WorkerCommand): number {
      const requestId = ++nextId;
      post({ type: "COMMAND", command, requestId });
      return requestId;
    },
    capture(): Promise<CapturedCampaign | null> {
      if (unavailable) return Promise.resolve(null);
      return new Promise((resolve) => {
        const requestId = ++nextId;
        const settle = (capture: CapturedCampaign | null) => {
          clearTimeout(timeout);
          captures.delete(requestId);
          resolve(capture);
        };
        const timeout = setTimeout(() => settle(null), captureTimeoutMs);
        captures.set(requestId, settle);
        try {
          post({ type: "CAPTURE", requestId });
        } catch {
          settle(null);
        }
      });
    },
    requestPreview(
      policyId: string,
      value: number,
    ): Promise<PolicyPreview | null> {
      return new Promise((resolve) => {
        const requestId = ++nextId;
        pending.set(requestId, resolve);
        post({ type: "REQUEST_PREVIEW", policyId, value, requestId });
      });
    },
    dispose() {
      unavailable = true;
      worker.terminate();
      clearPending();
    },
  };
}
