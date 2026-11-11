import type { Vehicle } from '../vehicle/vehicle';
import type { DriveInput } from '../core/input';
export class DriftPilot {
  private until = -1;
  private next = 0;
  private direction = 0;
  drive(car: Vehicle, input: DriveInput, time: number) {
    car.assist = false;
    if (
      time >= this.next &&
      car.speed > 7 &&
      car.speed < 16 &&
      Math.abs(input.steer) > 0.18
    ) {
      this.direction = Math.sign(input.steer);
      this.until = time + 0.4;
      this.next = time + 1.6;
    }
    if (time < this.until) {
      input.steer = this.direction * 0.8;
      input.handbrake = true;
      input.throttle = 0.65;
      input.brake = 0;
    } else if (time < this.until + 0.3) {
      const angle = Math.atan2(car.slip, Math.abs(car.speed));
      input.steer = Math.max(-1, Math.min(1, input.steer + angle * 1.8));
      input.handbrake = true;
      input.throttle = 0.6;
      input.brake = 0;
    }
  }
}
