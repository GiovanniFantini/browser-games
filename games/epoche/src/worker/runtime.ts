import type { ContentBundle } from "@content/schema";
import {
  CommandQueue,
  type SetPolicyCommand,
  type Speed,
} from "@engine/core/commands";
import {
  applyCampaignAction,
  catchUp,
  createCampaign,
  stepCampaign,
} from "@engine/campaign/campaign";
import {
  urgentDecision,
  type Campaign,
  type Pace,
} from "@engine/campaign/model";
import type { GameState } from "@engine/state/gameState";
import { createNewGame } from "@engine/state/newGame";
import { step } from "@engine/step";
import { previewPolicyChange } from "@engine/systems/policies";
import { buildCampaignView } from "./campaignView";
import type { FromWorker, ToWorker } from "./protocol";
import { buildSnapshot } from "./snapshot";

type ScheduledPolicy = SetPolicyCommand & { requestId: number };

export function createRuntime(
  baseline: ContentBundle,
  emit: (message: FromWorker) => void,
  getCampaignContent: (pace: Pace) => ContentBundle = () => baseline,
) {
  let state: GameState | null = null;
  let campaign: Campaign | null = null;
  let content = baseline;
  let speed: Speed = 1;
  let queue = new CommandQueue<ScheduledPolicy>();
  let intervalCount = 0;
  let dirty = false;
  const blocked = () =>
    !!campaign && (urgentDecision(campaign) || !!campaign.outcome);

  function publish(): void {
    if (state) {
      const snapshot = buildSnapshot(state, content, blocked() ? 0 : speed);
      if (campaign) snapshot.campaign = buildCampaignView(campaign);
      snapshot.queuedValues = Object.fromEntries(
        queue.pending().map((order) => [order.policyId, order.value]),
      );
      snapshot.queuedPolicies = queue.pending().map(({ policyId }) => policyId);
      emit({ type: "SNAPSHOT", snapshot });
    }
    intervalCount = 0;
    dirty = false;
  }

  function handle(message: ToWorker): void {
    if (message.type === "INIT") {
      content = baseline;
      campaign = null;
      state = createNewGame(content, message.seed);
      speed = 1;
      queue = new CommandQueue<ScheduledPolicy>();
      publish();
      return;
    }
    if (
      message.type === "START_CAMPAIGN" ||
      message.type === "RESTORE_CAMPAIGN"
    ) {
      content = getCampaignContent(
        message.type === "START_CAMPAIGN"
          ? (message.start.pace ?? "rapid")
          : message.campaign.pace,
      );
      speed = 1;
      queue = new CommandQueue<ScheduledPolicy>();
      if (message.type === "START_CAMPAIGN") {
        campaign = createCampaign(content, message.start);
      } else {
        speed = message.speed;
        const restored = catchUp(
          message.campaign,
          message.elapsed,
          speed,
          content,
          message.queued,
          (percent) => emit({ type: "ABSENCE_PROGRESS", percent }),
        );
        campaign = restored.campaign;
        if (!restored.appliedQueue)
          message.queued.forEach((order, index) =>
            queue.enqueue({
              ...order,
              type: "SET_POLICY",
              tick: restored.campaign.core.tick + 1,
              requestId: -index - 1,
            }),
          );
        if (restored.report) {
          if (restored.report.stopped && !campaign.pending && !campaign.outcome)
            speed = 0;
          emit({ type: "ABSENCE", report: restored.report });
        }
      }
      state = campaign.core;
      publish();
      return;
    }
    if (message.type === "CAPTURE") {
      emit({
        type: "CAPTURED",
        requestId: message.requestId,
        campaign,
        speed,
        queued: queue
          .pending()
          .map(({ policyId, value }) => ({ policyId, value })),
      });
      return;
    }
    if (!state) return;
    if (message.type === "ACTION") {
      if (!campaign) return;
      const previous = campaign;
      campaign = applyCampaignAction(campaign, message.action, content);
      state = campaign.core;
      emit({ type: "ACTION_RESULT", ok: campaign !== previous });
      if (campaign !== previous) publish();
      return;
    }
    if (message.type === "REQUEST_PREVIEW") {
      emit({
        type: "PREVIEW",
        requestId: message.requestId,
        preview: previewPolicyChange(
          state,
          content,
          message.policyId,
          message.value,
        ),
      });
      return;
    }
    const command = message.command;
    if (command.type === "SET_SPEED") {
      speed = command.speed;
      dirty = true;
    } else {
      queue.enqueue({
        ...command,
        tick: state.tick + 1,
        requestId: message.requestId,
      });
    }
  }

  function advanceInterval(): void {
    if (!state) return;
    for (let i = 0; i < speed && !blocked(); i++) {
      const due = queue.takeForTick(state.tick + 1);
      let commandResults: ReturnType<typeof step>["commandResults"];
      if (campaign) {
        const advanced = stepCampaign(campaign, due, content);
        campaign = advanced.campaign;
        state = campaign.core;
        commandResults = advanced.commandResults;
      } else {
        const advanced = step(state, due, content);
        state = advanced.state;
        commandResults = advanced.commandResults;
      }
      commandResults.forEach(({ policyId, result }, index) => {
        const command = due[index];
        if (command)
          emit({
            type: "COMMAND_RESULT",
            requestId: command.requestId,
            policyId,
            result,
          });
      });
      dirty = true;
    }
    intervalCount++;
    if (dirty && intervalCount >= 2) publish();
  }

  return { handle, advanceInterval };
}
