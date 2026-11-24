import { playMode } from "../ui/playMode";
import Dexie, { type EntityTable } from "dexie";
import { validateSave, type SaveFile } from "./save";

export type Slot = 1 | 2 | 3;
export const slots = [1, 2, 3] as const;
export type Lease = { slot: Slot; token: string };
export type SlotRecord = { slot: Slot; token: string; save?: SaveFile };
type LegacyRecord = { id: string; value: number };

type LibraryDb = Dexie & {
  slots: EntityTable<SlotRecord, "slot">;
  legacy: EntityTable<LegacyRecord, "id">;
};
let database: LibraryDb | undefined;

function db() {
  if (!database) {
    const storage = new Dexie(({current:"epoche",trial:"epoche-studio",winter:"epoche-rimedi",winterStudy:"epoche-inverno"})[playMode()]) as LibraryDb;
    storage.version(1).stores({ slots: "slot", legacy: "id" });
    database = storage;
  }
  return database;
}

export class LeaseLost extends Error {}

export async function listCampaigns() {
  const storage = db();
  const [records, legacy] = await Promise.all([
    storage.slots.toArray(),
    storage.legacy.toArray(),
  ]);
  return {
    records,
    legacy: legacy.reduce((sum, entry) => sum + entry.value, 0),
  };
}

export async function claimSlot(
  slot: Slot,
  restore: boolean,
): Promise<{ lease: Lease; save: SaveFile | null }> {
  const storage = db();
  return storage.transaction("rw", storage.slots, async () => {
    const current = await storage.slots.get(slot);
    const save = restore && current?.save ? validateSave(current.save) : null;
    const lease = { slot, token: crypto.randomUUID() };
    await storage.slots.put({ ...current, ...lease });
    return { lease, save };
  });
}

export async function persist(lease: Lease, save: SaveFile): Promise<void> {
  const storage = db();
  await storage.transaction("rw", storage.slots, storage.legacy, async () => {
    const record = await storage.slots.get(lease.slot);
    if (record?.token !== lease.token) throw new LeaseLost();
    if (
      record.save?.campaign.id === save.campaign.id &&
      record.save.savedAt > save.savedAt
    )
      return;
    await storage.slots.put({ ...lease, save: validateSave(save) });
    const ending = save.campaign.outcome?.kind;
    if (ending === "collapse" || ending === "extinction" || ending === "transcendence") {
      const past = await storage.legacy.get(save.campaign.id);
      await storage.legacy.put({
        id: save.campaign.id,
        value: Math.max(past?.value ?? 0, save.campaign.legacy),
      });
    }
  });
}
