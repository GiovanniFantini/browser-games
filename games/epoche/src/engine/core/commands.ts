export const speeds = [0, 1, 2, 4, 10, 25] as const;
export type Speed = (typeof speeds)[number];

export interface SetPolicyCommand {
  type: "SET_POLICY";
  policyId: string;
  value: number;
  tick: number;
}

export interface SetSpeedCommand {
  type: "SET_SPEED";
  speed: Speed;
  tick: number;
}

export type Command = SetPolicyCommand | SetSpeedCommand;

export class CommandQueue<T extends Command = Command> {
  private items: T[] = [];

  pending(): readonly T[] {
    return this.items.slice();
  }

  enqueue(command: T): void {
    this.items.push(command);
  }

  takeForTick(tick: number): T[] {
    const due: T[] = [];
    const pending: T[] = [];
    for (const command of this.items) {
      (command.tick <= tick ? due : pending).push(command);
    }
    this.items = pending;
    return due;
  }
}
