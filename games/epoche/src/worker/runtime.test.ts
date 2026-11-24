import { expect, it } from "vitest";
import { loadContent } from "@content/index";
import { sumContributions } from "@engine/systems/attributes";
import { createNewGame } from "@engine/state/newGame";
import type { FromWorker, WorkerCommand } from "./protocol";
import { buildSnapshot } from "./snapshot";
import { createRuntime } from "./runtime";

it("builds a snapshot without changing the state", () => {
  const content = loadContent();
  const state = createNewGame(content, 33);
  const before = structuredClone(state);
  const snapshot = buildSnapshot(state, content, 2);
  expect(state).toEqual(before);
  expect(snapshot.attributes.filter((entry) => entry.active)).toHaveLength(7);
  expect(snapshot.policies).toHaveLength(6);
  expect(snapshot.speed).toBe(2);
  expect(snapshot.capacity).toBe(225);
  for (const attribute of snapshot.attributes) {
    expect(attribute.target).toBe(
      Math.max(1, Math.min(20, sumContributions(attribute.contributions))),
    );
  }
});

it("previews in pause, resumes queued policies and reports insufficient influence", () => {
  const messages: FromWorker[] = [];
  const runtime = createRuntime(loadContent(), (message) =>
    messages.push(message),
  );
  const send = (command: WorkerCommand, requestId: number) =>
    runtime.handle({ type: "COMMAND", command, requestId });
  runtime.handle({ type: "INIT", seed: 23 });
  send({ type: "SET_SPEED", speed: 0 }, 1);
  send({ type: "SET_POLICY", policyId: "settlement", value: 100 }, 2);
  send({ type: "SET_POLICY", policyId: "settlement", value: 0 }, 3);
  send({ type: "SET_POLICY", policyId: "fire", value: 100 }, 4);
  runtime.handle({
    type: "REQUEST_PREVIEW",
    policyId: "fire",
    value: 100,
    requestId: 5,
  });
  runtime.advanceInterval();
  runtime.advanceInterval();
  expect(messages).toContainEqual(
    expect.objectContaining({
      type: "PREVIEW",
      requestId: 5,
      preview: expect.objectContaining({ cost: 5 }),
    }),
  );
  expect(
    messages.filter((message) => message.type === "COMMAND_RESULT"),
  ).toHaveLength(0);
  expect(messages.at(-1)).toMatchObject({
    type: "SNAPSHOT",
    snapshot: { tick: 0, speed: 0 },
  });

  send({ type: "SET_SPEED", speed: 1 }, 6);
  runtime.advanceInterval();
  runtime.advanceInterval();
  expect(messages).toContainEqual({
    type: "COMMAND_RESULT",
    requestId: 2,
    policyId: "settlement",
    result: { ok: true, value: 100 },
  });
  expect(messages).toContainEqual({
    type: "COMMAND_RESULT",
    requestId: 4,
    policyId: "fire",
    result: {
      ok: false,
      reason: "insufficient_influence",
      cost: 5,
      available: expect.any(Number),
    },
  });
  expect(messages.at(-1)).toMatchObject({
    type: "SNAPSHOT",
    snapshot: { tick: 2, speed: 1 },
  });

  send({ type: "SET_SPEED", speed: 4 }, 7);
  runtime.advanceInterval();
  runtime.advanceInterval();
  expect(messages.at(-1)).toMatchObject({
    type: "SNAPSHOT",
    snapshot: { tick: 10, speed: 4 },
  });
});
