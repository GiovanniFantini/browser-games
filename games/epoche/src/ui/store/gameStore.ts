import { create } from "zustand";
import type {
  AbsenceReport,
  Campaign,
  CampaignAction,
  QueuedPolicy,
  StartCampaign,
} from "@engine/campaign/model";
import type { Speed } from "@engine/core/commands";
import type { PolicyPreview, PolicyResult } from "@engine/systems/policies";
import { createClient } from "@worker/client";
import type { FromWorker, Snapshot } from "@worker/protocol";

interface GameStore {
  snapshot: Snapshot | null;
  error: string | null;
  speed: Speed;
  lastRunningSpeed: Exclude<Speed, 0>;
  pending: Record<string, number>;
  lastResult: { policyId: string; result: PolicyResult } | null;
  absence: AbsenceReport | null;
  absenceProgress: number | null;
  actionRejected: boolean;
  revision: number;
  setSpeed: (speed: Speed) => void;
  setPolicy: (policyId: string, value: number) => void;
  previewPolicy: (
    policyId: string,
    value: number,
  ) => Promise<PolicyPreview | null>;
  sendAction: (action: CampaignAction) => void;
  clearAbsence: () => void;
}

let client: ReturnType<typeof createClient> | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
  snapshot: null,
  error: null,
  speed: 1,
  lastRunningSpeed: 1,
  pending: {},
  lastResult: null,
  absence: null,
  absenceProgress: null,
  actionRejected: false,
  revision: 0,
  setSpeed(speed) {
    if (!client || get().error) return;
    client.send({ type: "SET_SPEED", speed });
    set({
      speed,
      lastRunningSpeed: speed === 0 ? get().lastRunningSpeed : speed,
      revision: get().revision + 1,
    });
  },
  setPolicy(policyId, value) {
    if (
      !client ||
      get().error ||
      Object.hasOwn(get().pending, policyId) ||
      get().snapshot?.queuedPolicies?.includes(policyId)
    )
      return;
    const policy = get().snapshot?.policies.find(
      (entry) => entry.id === policyId,
    );
    if (!policy || policy.target === value) return;
    const request = client.send({ type: "SET_POLICY", policyId, value });
    set((state) => ({
      pending: { ...state.pending, [policyId]: request },
      lastResult: null,
      revision: state.revision + 1,
    }));
  },
  previewPolicy(policyId, value) {
    return client?.requestPreview(policyId, value) ?? Promise.resolve(null);
  },
  sendAction(action) {
    if (!get().error) client?.action(action);
  },
  clearAbsence() {
    set({ absence: null });
  },
}));

function handleMessage(message: FromWorker): void {
  if (message.type === "SNAPSHOT") {
    useGameStore.setState((state) => ({
      snapshot: message.snapshot,
      absenceProgress: null,
      speed: message.snapshot.speed,
      error: null,
      revision:
        state.snapshot?.campaign?.chronicle.at(-1)?.id !==
        message.snapshot.campaign?.chronicle.at(-1)?.id
          ? state.revision + 1
          : state.revision,
    }));
  } else if (message.type === "COMMAND_RESULT") {
    useGameStore.setState((store) => {
      const { policyId, requestId, result } = message;
      if (requestId >= 0 && store.pending[policyId] !== requestId) return store;
      const pending = { ...store.pending };
      delete pending[policyId];
      const snapshot =
        result.ok && store.snapshot
          ? {
              ...store.snapshot,
              policies: store.snapshot.policies.map((policy) =>
                policy.id === policyId
                  ? { ...policy, target: result.value }
                  : policy,
              ),
            }
          : store.snapshot;
      return { pending, snapshot, lastResult: { policyId, result } };
    });
  } else if (message.type === "ABSENCE_PROGRESS") {
    useGameStore.setState({ absenceProgress: message.percent });
  } else if (message.type === "ABSENCE") {
    useGameStore.setState({ absence: message.report });
  } else if (message.type === "ACTION_RESULT") {
    useGameStore.setState((state) => ({
      actionRejected: !message.ok,
      revision: state.revision + (message.ok ? 1 : 0),
    }));
  } else if (message.type === "ERROR") {
    useGameStore.setState({ error: message.message, pending: {} });
  }
}

export type GameLaunch =
  | { start: StartCampaign }
  | {
      campaign: Campaign;
      speed: Speed;
      elapsed: number;
      queued: QueuedPolicy[];
    };

export function startGame(launch?: GameLaunch): void {
  stopGame();
  useGameStore.setState({
    snapshot: null,
    error: null,
    speed: 1,
    lastRunningSpeed: 1,
    pending: {},
    lastResult: null,
    absence: null,
    absenceProgress: null,
    actionRejected: false,
    revision: 0,
  });
  try {
    client = createClient(handleMessage);
    if (launch && "start" in launch) client.start(launch.start);
    else if (launch)
      client.restore(
        launch.campaign,
        launch.speed,
        launch.elapsed,
        launch.queued,
      );
    else client.init(crypto.getRandomValues(new Uint32Array(1))[0] ?? 1);
  } catch (error) {
    stopGame();
    useGameStore.setState({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function captureGame() {
  return client?.capture() ?? Promise.resolve(null);
}

export function stopGame(): void {
  client?.dispose();
  client = null;
}
