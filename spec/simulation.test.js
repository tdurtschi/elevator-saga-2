import Simulation from "../src/simulation/Simulation.js";
import { requireUserCountWithinTime } from "../src/challenges/challenges.js";

describe("Simulation", () => {
  it("counts a user as transported when they reach their destination floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0); // pick up
        elevators[0].goToFloor(2); // drop off
      },
      update() {}
    });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(1);
  });

  it("does not count a user as transported if the elevator never reaches their destination", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.applyCode({
      init(elevators) {
        // only ever shuttles between floor 0 and 1 — never reaches floor 2
        elevators[0].on("idle", () => {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(1);
        });
      },
      update() {}
    });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(0);
  });

  it("passes the within-time condition when enough users are transported before the limit", () => {
    const sim = new Simulation({
      floors: 3, elevators: 1, spawnRate: 0,
      condition: requireUserCountWithinTime(1, 60)
    });

    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0);
        elevators[0].goToFloor(2);
      },
      update() {}
    });

    sim.runUntilComplete();

    expect(sim.passed()).toBe(true);
  });

  it("fails the within-time condition when not enough users are transported before the limit", () => {
    const sim = new Simulation({
      floors: 3, elevators: 1, spawnRate: 0,
      condition: requireUserCountWithinTime(1, 60)
    });

    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.applyCode({
      init() {}, // elevator does nothing
      update() {}
    });

    sim.runUntilComplete();

    expect(sim.passed()).toBe(false);
  });

  it("costs 0 moves when goToFloor is called on the current floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0); // already here
      },
      update() {}
    });

    sim.runFor(10);

    expect(sim.moveCount()).toBe(0);
  });

  it("transports a user who pressed the down button when the elevator responds and stops at their floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators, floors) {
        floors[2].on("down_button_pressed", () => {
          elevators[0].goToFloor(2);
          elevators[0].goToFloor(0);
        });
      },
      update() {}
    });

    sim.spawnUser({ fromFloor: 2, toFloor: 0 });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(1);
  });

  it("costs 1 move when the elevator travels from floor 0 to floor 2", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(2);
      },
      update() {}
    });

    sim.runFor(60);

    expect(sim.moveCount()).toBe(1);
  });

});
