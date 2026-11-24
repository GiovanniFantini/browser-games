import type {
  AbsenceReport,
  Campaign,
  CampaignAction,
  QueuedPolicy,
  StartCampaign,
} from "@engine/campaign/model";
import type { CampaignView } from "./campaignView";
import type { AttributeDef } from "@content/schema";
import type {
  SetPolicyCommand,
  SetSpeedCommand,
  Speed,
} from "@engine/core/commands";
import type { AttributeState, PolicyState } from "@engine/state/gameState";
import type { Contribution } from "@engine/systems/attributes";
import type { PolicyPreview, PolicyResult } from "@engine/systems/policies";

export type WorkerCommand =
  Omit<SetPolicyCommand, "tick"> | Omit<SetSpeedCommand, "tick">;

export interface AttributeSnapshot extends AttributeState {
  id: string;
  nameKey: string;
  group: AttributeDef["group"];
  zone: AttributeDef["zone"];
  target: number;
  contributions: Contribution[];
}

export interface PolicySnapshot extends PolicyState {
  id: string;
  nameKey: string;
  leftLabelKey: string;
  rightLabelKey: string;
  tradeoffKey: string;
}

export interface Snapshot {
  campaign?: CampaignView;
  queuedValues?: Record<string, number>;
  queuedPolicies?: string[];
  year: number;
  tick: number;
  eraNameKey: string;
  speed: Speed;
  population: number;
  capacity: number;
  populationPressure: number;
  pressureThreshold: number | null;
  influence: number;
  influenceCap: number;
  historySampleYears: number;
  legitimacy: number;
  complexity: number;
  complexityNameKey: string;
  attributes: AttributeSnapshot[];
  policies: PolicySnapshot[];
}

export type ToWorker =
  | { type: "INIT"; seed: number }
  | { type: "START_CAMPAIGN"; start: StartCampaign }
  | {
      type: "RESTORE_CAMPAIGN";
      campaign: Campaign;
      speed: Speed;
      elapsed: number;
      queued: QueuedPolicy[];
    }
  | { type: "ACTION"; action: CampaignAction }
  | { type: "CAPTURE"; requestId: number }
  | { type: "COMMAND"; command: WorkerCommand; requestId: number }
  | {
      type: "REQUEST_PREVIEW";
      policyId: string;
      value: number;
      requestId: number;
    };

export type FromWorker =
  | {
      type: "CAPTURED";
      requestId: number;
      campaign: Campaign | null;
      speed: Speed;
      queued: QueuedPolicy[];
    }
  | { type: "ABSENCE"; report: AbsenceReport }
  | { type: "ABSENCE_PROGRESS"; percent: number }
  | { type: "ACTION_RESULT"; ok: boolean }
  | { type: "SNAPSHOT"; snapshot: Snapshot }
  | {
      type: "COMMAND_RESULT";
      requestId: number;
      policyId: string;
      result: PolicyResult;
    }
  | { type: "PREVIEW"; requestId: number; preview: PolicyPreview | null }
  | { type: "ERROR"; message: string };
