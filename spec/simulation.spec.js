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

  describe("elapsedTime", () => {
    it("starts at 0", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(sim.elapsedTime()).toBe(0);
    });

    it("increases by approximately the amount passed to runFor", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      sim.applyCode({ init() {}, update() {} });
      sim.runFor(10);
      expect(sim.elapsedTime()).toBeCloseTo(10, 1);
    });
  });

  describe("maxWaitTime", () => {
    it("is 0 before any user is transported", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(sim.maxWaitTime()).toBe(0);
    });

    it("reflects the wait time of a transported user", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      sim.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(60);

      expect(sim.maxWaitTime()).toBeGreaterThan(0);
    });
  });

  describe("avgWaitTime and transportedPerSec", () => {
    it("avgWaitTime reflects the average wait time across transported users", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      sim.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(60);

      expect(sim.avgWaitTime()).toBeGreaterThan(0);
    });

    it("transportedPerSec reflects transported users divided by elapsed time", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      sim.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(60);

      expect(sim.transportedPerSec()).toBeGreaterThan(0);
    });
  });

  describe("isEnded", () => {
    it("returns false before a condition is met", () => {
      const sim = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requireUserCountWithinTime(1, 60)
      });

      sim.applyCode({ init() {}, update() {} });

      expect(sim.isEnded()).toBe(false);
    });

    it("returns true after runUntilComplete finishes", () => {
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

      expect(sim.isEnded()).toBe(true);
    });

    it("tick(dt) after ended does not advance state", () => {
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

      const timeAfterEnd = sim.elapsedTime();
      sim.tick(1);
      expect(sim.elapsedTime()).toBe(timeAfterEnd);
    });
  });

  describe("automatic user spawning via spawnRate", () => {
    it("users appear in the world over time without manual spawnUser calls", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 2 });

      sim.applyCode({
        init(elevators) {
          elevators[0].on("idle", () => {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(1);
            elevators[0].goToFloor(2);
          });
        },
        update() {}
      });

      sim.runFor(30);

      expect(sim.transportedCount()).toBeGreaterThan(0);
    });
  });

  describe("tick(dt)", () => {
    it("advances the simulation by dt seconds", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      sim.applyCode({ init() {}, update() {} });

      sim.tick(5);

      expect(sim.elapsedTime()).toBeCloseTo(5, 1);
    });

    it("calling tick repeatedly is equivalent to runFor", () => {
      const simA = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simA.applyCode({ init() {}, update() {} });
      simA.runFor(10);

      const simB = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simB.applyCode({ init() {}, update() {} });
      for (let i = 0; i < 10; i++) simB.tick(1);

      expect(simB.elapsedTime()).toBeCloseTo(simA.elapsedTime(), 1);
    });
  });

  describe("usercode_error event", () => {
    it("emits usercode_error when user code throws in init", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      const errors = [];
      sim.on("usercode_error", (e) => errors.push(e));

      sim.applyCode({
        init() { throw new Error("init exploded"); },
        update() {}
      });

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe("init exploded");
    });

    it("emits usercode_error when user code throws in update", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      const errors = [];
      sim.on("usercode_error", (e) => errors.push(e));

      sim.applyCode({ init() {}, update() { throw new Error("update exploded"); } });
      sim.runFor(0.1);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe("update exploded");
    });
  });

  describe("stats_changed event", () => {
    it("fires after a user is transported", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      let statsFired = false;
      sim.on("stats_changed", () => { statsFired = true; });

      sim.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(60);

      expect(statsFired).toBe(true);
    });

    it("fires after move count changes", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      let statsFired = false;
      sim.on("stats_changed", () => { statsFired = true; });

      sim.applyCode({
        init(elevators) { elevators[0].goToFloor(2); },
        update() {}
      });

      sim.runFor(60);

      expect(statsFired).toBe(true);
    });
  });

  describe("display accessors", () => {
    it("floors returns the floor objects", () => {
      const sim = new Simulation({ floors: 4, elevators: 1, spawnRate: 0 });
      expect(sim.floors).toBeDefined();
      expect(sim.floors.length).toBe(4);
    });

    it("elevators returns the elevator objects", () => {
      const sim = new Simulation({ floors: 3, elevators: 2, spawnRate: 0 });
      expect(sim.elevators).toBeDefined();
      expect(sim.elevators.length).toBe(2);
    });

    it("floorHeight returns a positive number", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(sim.floorHeight).toBeGreaterThan(0);
    });

    it("challengeEnded is false before a condition is met", () => {
      const sim = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requireUserCountWithinTime(1, 60)
      });
      sim.applyCode({ init() {}, update() {} });
      expect(sim.challengeEnded).toBe(false);
    });

    it("challengeEnded is true after the condition resolves", () => {
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
      expect(sim.challengeEnded).toBe(true);
    });

    it("emits new_user when a user appears", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      sim.applyCode({ init() {}, update() {} });
      const users = [];
      sim.on("new_user", (user) => users.push(user));
      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      expect(users.length).toBe(1);
    });

    it("elevatorCapacities is applied to the created elevators", () => {
      const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0, elevatorCapacities: [3] });
      expect(sim.elevators[0].maxUsers).toBe(3);
    });
  });

  describe("challenge_ended event", () => {
    it("fires with true when the challenge is passed", () => {
      const sim = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requireUserCountWithinTime(1, 60)
      });
      const results = [];
      sim.on("challenge_ended", (result) => results.push(result));

      sim.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });
      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(60);

      expect(results).toEqual([true]);
    });

    it("fires with false when the challenge is failed", () => {
      const sim = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requireUserCountWithinTime(1, 60)
      });
      const results = [];
      sim.on("challenge_ended", (result) => results.push(result));

      sim.applyCode({ init() {}, update() {} });
      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(61);

      expect(results).toEqual([false]);
    });

    it("fires only once even if tick is called again after ended", () => {
      const sim = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requireUserCountWithinTime(1, 60)
      });
      const results = [];
      sim.on("challenge_ended", (result) => results.push(result));

      sim.applyCode({ init() {}, update() {} });
      sim.spawnUser({ fromFloor: 0, toFloor: 2 });
      sim.runFor(61); // ends the challenge
      sim.runFor(10); // no-op

      expect(results.length).toBe(1);
    });
  });

  describe("no shared state between instances", () => {
    it("creating a new Simulation does not interfere with a previous one", () => {
      const simA = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simA.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });
      simA.spawnUser({ fromFloor: 0, toFloor: 2 });
      simA.runFor(60);
      const countA = simA.transportedCount();

      const simB = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simB.applyCode({ init() {}, update() {} });
      simB.runFor(10);

      expect(simA.transportedCount()).toBe(countA);
      expect(simB.transportedCount()).toBe(0);
    });
  });

  describe("elevator/floor wiring", () => {
    it("triggers entrance_available on all idle elevators at a floor when up button is pressed", () => {
      const sim = new Simulation({ floors: 2, elevators: 3, spawnRate: 0 });
      sim.applyCode({ init() {}, update() {} });

      const spies = sim.elevators.map((elevator) => {
        const spy = jasmine.createSpy("entrance_available");
        elevator.on("entrance_available", spy);
        return spy;
      });

      sim.floors[0].pressUpButton();
      sim.elevators.forEach((e) => e.updateElevatorMovement(0.5));

      spies.forEach((spy, i) => {
        expect(spy).withContext(`elevator ${i}`).toHaveBeenCalled();
      });
    });

    it("users reconsider boarding when elevator indicator changes while stopped at their floor", () => {
      const sim = new Simulation({ floors: 2, elevators: 1, spawnRate: 0 });

      sim.applyCode({
        init(elevators) {
          const elevator = elevators[0];
          elevator.goingDownIndicator(false);
          let idleCount = 0;
          elevator.on("idle", () => {
            idleCount++;
            if (idleCount === 1) {
              elevator.goToFloor(1);
            } else {
              elevator.goingDownIndicator(true);
            }
          });
          elevator.on("floor_button_pressed", (floorNum) => {
            elevator.goToFloor(floorNum);
          });
        },
        update() {}
      });

      sim.spawnUser({ fromFloor: 1, toFloor: 0 });

      sim.runFor(10);

      expect(sim.transportedCount()).toBe(1);
    });
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

