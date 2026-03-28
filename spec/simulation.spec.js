import Simulation from "../src/simulation/Simulation.js";
import { requireUserCountWithinTime, requireUserCountWithinMoves, requireUserCountWithMaxWaitTime, requireUserCountWithinTimeWithMaxWaitTime } from "../src/challenges/challenges.js";

describe("Simulation", () => {
  it("counts a user as transported when they reach their destination floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0); // pick up
        elevators[0].goToFloor(2); // drop off
      },
      update() {}
    });

    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(1);
  });

  it("does not count a user as transported if the elevator never reaches their destination", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

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

    sim.spawnUser({ fromFloor: 0, toFloor: 2 });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(0);
  });

  it("calls update on every tick", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
    let updateCount = 0;

    sim.applyCode({
      init() {},
      update() { updateCount++; }
    });

    sim.runFor(1);

    expect(updateCount).toBeGreaterThan(1);
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

  describe("challenge conditions", () => {
    describe("requireUserCountWithinTime", () => {
      it("passes when enough users are transported before the time limit", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinTime(1, 60)
        });

        sim.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(true);
      });

      it("fails when not enough users are transported before the time limit", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinTime(1, 60)
        });

        sim.applyCode({
          init() {}, // elevator does nothing
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(false);
      });
    });

    describe("requireUserCountWithinMoves", () => {
      it("passes when enough users are transported within the move limit", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinMoves(1, 2)
        });

        sim.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(true);
      });

      it("fails when the move limit is exceeded before enough users are transported", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinMoves(1, 1)
        });

        sim.applyCode({
          init(elevators, floors) {
            floors[2].on("down_button_pressed", () => {
              // wastes a move going to floor 1 before picking up the user on floor 2
              elevators[0].goToFloor(1);
              elevators[0].goToFloor(2);
              elevators[0].goToFloor(0);
            });
          },
          update() {}
        });

        sim.spawnUser({ fromFloor: 2, toFloor: 0 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(false);
      });
    });

    describe("requireUserCountWithMaxWaitTime", () => {
      it("passes when enough users are transported within the max wait time", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithMaxWaitTime(1, 60)
        });

        sim.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(true);
      });

      it("fails when a user waits longer than the max wait time even if eventually transported", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithMaxWaitTime(1, 1)
        });

        let elapsed = 0;
        let responded = false;

        sim.applyCode({
          init() {},
          update(dt, elevators) {
            elapsed += dt;
            if (elapsed > 5 && !responded) {
              responded = true;
              elevators[0].goToFloor(0);
              elevators[0].goToFloor(2);
            }
          }
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(false);
      });
    });

    describe("requireUserCountWithinTimeWithMaxWaitTime", () => {
      it("passes when enough users are transported within time and max wait time", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinTimeWithMaxWaitTime(1, 60, 60)
        });

        sim.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(true);
      });

      it("fails when not enough users are transported before the time limit", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinTimeWithMaxWaitTime(1, 60, 60)
        });

        sim.applyCode({
          init() {}, // elevator does nothing
          update() {}
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(false);
      });

      it("fails when a user waits longer than the max wait time even if eventually transported", () => {
        const sim = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requireUserCountWithinTimeWithMaxWaitTime(1, 60, 1)
        });

        let elapsed = 0;
        let responded = false;

        sim.applyCode({
          init() {},
          update(dt, elevators) {
            elapsed += dt;
            if (elapsed > 5 && !responded) {
              responded = true;
              elevators[0].goToFloor(0);
              elevators[0].goToFloor(2);
            }
          }
        });

        sim.spawnUser({ fromFloor: 0, toFloor: 2 });

        sim.runUntilComplete();

        expect(sim.passed()).toBe(false);
      });
    });
  });
});

