import { campaignBalance } from "@content/campaign/definitions";
import { loadCampaignContent } from "@content/campaign/index";
import {
  applyCampaignAction,
  createCampaign,
  stepCampaign,
} from "@engine/campaign/campaign";
import type { Campaign } from "@engine/campaign/model";
import { enterEra } from "@engine/campaign/world";
import { createRuntime } from "@worker/runtime";
import type { FromWorker } from "@worker/protocol";
import { expect, it } from "vitest";

const content = loadCampaignContent();
function neolithic(): Campaign {
  const campaign = createCampaign(content, {
    seed: 832,
    id: "decisions",
    choices: [50, 50, 50, 50],
    inherited: 0,
  });
  return {
    ...campaign,
    core: enterEra(campaign.core, "neolithic", content),
    highestEra: 1,
  };
}

it("keeps ordinary decisions playable, pauses for urgent ones and restores queued choices", () => {
  const campaign = neolithic();
  for (const [id, urgent] of [
    ["grazing", false],
    ["drought", true],
  ] as const) {
    const messages: FromWorker[] = [];
    const runtime = createRuntime(content, (m) => messages.push(m));
    runtime.handle({
      type: "RESTORE_CAMPAIGN",
      campaign: { ...campaign, pending: { id, openedAt: 0 } },
      elapsed: 0,
      speed: 1,
      queued: [{ policyId: "fields", value: 72 }],
    });
    expect(messages.at(-1)).toMatchObject({
      type: "SNAPSHOT",
      snapshot: { queuedValues: { fields: 72 }, speed: urgent ? 0 : 1 },
    });
    runtime.advanceInterval();
    runtime.advanceInterval();
    runtime.handle({ type: "CAPTURE", requestId: 1 });
    expect(messages.at(-1)).toMatchObject({
      type: "CAPTURED",
      campaign: {
        core: {
          tick: urgent ? 0 : 2,
          policies: { fields: { target: urgent ? 50 : 72 } },
        },
      },
    });
  }
});

it.each([
  ["grazing", 2],
  ["fences", 1],
] as const)("applies the free response when %s expires and rejects a stale click", (id, index) => {
  const campaign = neolithic();
  const end = campaignBalance.decisionWindowTicks;
  const waiting = {
    ...campaign,
    core: { ...campaign.core, tick: end - 2 },
    pending: { id, openedAt: 0 },
  };
  const before = stepCampaign(waiting, [], content).campaign;
  expect(before.pending).toEqual(waiting.pending);
  const late = applyCampaignAction(
    before,
    { type: "RESPOND", choice: 0, eventId: id, openedAt: 1 },
    content,
  );
  expect(late).toBe(before);
  const after = stepCampaign(before, [], content).campaign;
  expect(after.pending).toBeNull();
  expect(after.chronicle.at(-1)).toMatchObject({
    key: "log.response",
    nameKey: "response." + id + "." + index,
  });
});

it("announces new fields only when the effective setting reaches its target", () => {
  const campaign = neolithic();
  let next = stepCampaign(
    campaign,
    [{ type: "SET_POLICY", policyId: "fields", value: 70, tick: 1 }],
    content,
  ).campaign;
  expect(next.chronicle.at(-1)).toMatchObject({
    key: "log.policyChosen",
    setting: 70,
  });
  while (next.core.policies.fields!.effective !== 70 && next.core.tick < 100)
    next = stepCampaign(next, [], content).campaign;
  expect(next.core.policies.fields!.effective).toBe(70);
  next = stepCampaign(next, [], content).campaign;
  expect(
    next.chronicle.filter((e) => e.key === "log.fieldsExpand"),
  ).toHaveLength(1);
});
