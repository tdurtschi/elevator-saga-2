import Simulation from "../src/simulation/Simulation.js";
import { requirePassengerCountWithinTime, requirePassengerCountWithinMoves, requirePassengerCountWithMaxWaitTime, requirePassengerCountWithinTimeWithMaxWaitTime } from "../src/challenges/challenges.js";

describe("Simulation", () => {
  it("counts a passenger as transported when they reach their destination floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0); // pick up
        elevators[0].goToFloor(2); // drop off
      },
      update() {}
    });

    simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

    simulation.runFor(60);

    expect(simulation.transportedCount()).toBe(1);
  });

  it("does not count a passenger as transported if the elevator never reaches their destination", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        // only ever shuttles between floor 0 and 1 — never reaches floor 2
        elevators[0].on("idle", () => {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(1);
        });
      },
      update() {}
    });

    simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

    simulation.runFor(60);

    expect(simulation.transportedCount()).toBe(0);
  });

  it("calls update on every tick", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
    let updateCount = 0;

    simulation.applyCode({
      init() {},
      update() { updateCount++; }
    });

    simulation.runFor(1);

    expect(updateCount).toBeGreaterThan(1);
  });

  it("costs 0 moves when goToFloor is called on the current floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        elevators[0].goToFloor(0); // already here
      },
      update() {}
    });

    simulation.runFor(10);

    expect(simulation.moveCount()).toBe(0);
  });

  it("costs 1 move when the elevator travels from floor 0 to floor 2", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        elevators[0].goToFloor(2);
      },
      update() {}
    });

    simulation.runFor(60);

    expect(simulation.moveCount()).toBe(1);
  });

  describe("elapsedTime", () => {
    it("starts at 0", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(simulation.elapsedTime()).toBe(0);
    });

    it("increases by approximately the amount passed to runFor", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulation.applyCode({ init() {}, update() {} });
      simulation.runFor(10);
      expect(simulation.elapsedTime()).toBeCloseTo(10, 1);
    });
  });

  describe("maxWaitTime", () => {
    it("is 0 before any passenger is transported", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(simulation.maxWaitTime()).toBe(0);
    });

    it("reflects the wait time of a transported passenger", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(60);

      expect(simulation.maxWaitTime()).toBeGreaterThan(0);
    });
  });

  describe("avgWaitTime and transportedPerSec", () => {
    it("avgWaitTime reflects the average wait time across transported passengers", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(60);

      expect(simulation.avgWaitTime()).toBeGreaterThan(0);
    });

    it("transportedPerSec reflects transported passengers divided by elapsed time", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(60);

      expect(simulation.transportedPerSec()).toBeGreaterThan(0);
    });
  });

  describe("isEnded", () => {
    it("returns false before a condition is met", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });

      simulation.applyCode({ init() {}, update() {} });

      expect(simulation.isEnded()).toBe(false);
    });

    it("returns true after runUntilComplete finishes", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runUntilComplete();

      expect(simulation.isEnded()).toBe(true);
    });

    it("returns true after end() is called", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulation.applyCode({ init() {}, update() {} });

      simulation.end();

      expect(simulation.isEnded()).toBe(true);
      expect(simulation.passed()).toBe(false);
    });

    it("tick(dt) after ended does not advance state", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runUntilComplete();

      const timeAfterEnd = simulation.elapsedTime();
      simulation.tick(1);
      expect(simulation.elapsedTime()).toBe(timeAfterEnd);
    });
  });

  describe("automatic passenger spawning via spawnRate", () => {
    it("passengers appear in the simulation over time without manual spawnPassenger calls", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 2 });

      simulation.applyCode({
        init(elevators) {
          elevators[0].on("idle", () => {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(1);
            elevators[0].goToFloor(2);
          });
        },
        update() {}
      });

      simulation.runFor(30);

      expect(simulation.transportedCount()).toBeGreaterThan(0);
    });
  });

  describe("tick(dt)", () => {
    it("advances the simulation by dt seconds", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulation.applyCode({ init() {}, update() {} });

      simulation.tick(5);

      expect(simulation.elapsedTime()).toBeCloseTo(5, 1);
    });

    it("calling tick repeatedly is equivalent to runFor", () => {
      const simulationA = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulationA.applyCode({ init() {}, update() {} });
      simulationA.runFor(10);

      const simulationB = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulationB.applyCode({ init() {}, update() {} });
      for (let i = 0; i < 10; i++) simulationB.tick(1);

      expect(simulationB.elapsedTime()).toBeCloseTo(simulationA.elapsedTime(), 1);
    });
  });

  describe("usercode_error event", () => {
    it("emits usercode_error when passenger code throws in init", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      const errors = [];
      simulation.on("usercode_error", (e) => errors.push(e));

      simulation.applyCode({
        init() { throw new Error("init exploded"); },
        update() {}
      });

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe("init exploded");
    });

    it("emits usercode_error when passenger code throws in update", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      const errors = [];
      simulation.on("usercode_error", (e) => errors.push(e));

      simulation.applyCode({ init() {}, update() { throw new Error("update exploded"); } });
      simulation.runFor(0.1);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe("update exploded");
    });
  });

  describe("stats_changed event", () => {
    it("fires after a passenger is transported", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      let statsFired = false;
      simulation.on("stats_changed", () => { statsFired = true; });

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });

      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(60);

      expect(statsFired).toBe(true);
    });

    it("fires after move count changes", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      let statsFired = false;
      simulation.on("stats_changed", () => { statsFired = true; });

      simulation.applyCode({
        init(elevators) { elevators[0].goToFloor(2); },
        update() {}
      });

      simulation.runFor(60);

      expect(statsFired).toBe(true);
    });
  });

  describe("display accessors", () => {
    it("floors returns the floor objects", () => {
      const simulation = new Simulation({ floors: 4, elevators: 1, spawnRate: 0 });
      expect(simulation.floors).toBeDefined();
      expect(simulation.floors.length).toBe(4);
    });

    it("elevators returns the elevator objects", () => {
      const simulation = new Simulation({ floors: 3, elevators: 2, spawnRate: 0 });
      expect(simulation.elevators).toBeDefined();
      expect(simulation.elevators.length).toBe(2);
    });

    it("floorHeight returns a positive number", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      expect(simulation.floorHeight).toBeGreaterThan(0);
    });

    it("challengeEnded is false before a condition is met", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });
      simulation.applyCode({ init() {}, update() {} });
      expect(simulation.challengeEnded).toBe(false);
    });

    it("challengeEnded is true after the condition resolves", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });
      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });
      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runUntilComplete();
      expect(simulation.challengeEnded).toBe(true);
    });

    it("emits new_passenger when a passenger appears", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulation.applyCode({ init() {}, update() {} });
      const passengers = [];
      simulation.on("new_passenger", (passenger) => passengers.push(passenger));
      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      expect(passengers.length).toBe(1);
    });

    it("elevatorCapacities is applied to the created elevators", () => {
      const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0, elevatorCapacities: [3] });
      expect(simulation.elevators[0].maxPassengers).toBe(3);
    });
  });

  describe("challenge_ended event", () => {
    it("fires with true when the challenge is passed", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });
      const results = [];
      simulation.on("challenge_ended", (result) => results.push(result));

      simulation.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });
      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(60);

      expect(results).toEqual([true]);
    });

    it("fires with false when the challenge is failed", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });
      const results = [];
      simulation.on("challenge_ended", (result) => results.push(result));

      simulation.applyCode({ init() {}, update() {} });
      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(61);

      expect(results).toEqual([false]);
    });

    it("fires only once even if tick is called again after ended", () => {
      const simulation = new Simulation({
        floors: 3, elevators: 1, spawnRate: 0,
        condition: requirePassengerCountWithinTime(1, 60)
      });
      const results = [];
      simulation.on("challenge_ended", (result) => results.push(result));

      simulation.applyCode({ init() {}, update() {} });
      simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulation.runFor(61); // ends the challenge
      simulation.runFor(10); // no-op

      expect(results.length).toBe(1);
    });
  });

  describe("no shared state between instances", () => {
    it("creating a new Simulation does not interfere with a previous one", () => {
      const simulationA = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulationA.applyCode({
        init(elevators) {
          elevators[0].goToFloor(0);
          elevators[0].goToFloor(2);
        },
        update() {}
      });
      simulationA.spawnPassenger({ fromFloor: 0, toFloor: 2 });
      simulationA.runFor(60);
      const countA = simulationA.transportedCount();

      const simulationB = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });
      simulationB.applyCode({ init() {}, update() {} });
      simulationB.runFor(10);

      expect(simulationA.transportedCount()).toBe(countA);
      expect(simulationB.transportedCount()).toBe(0);
    });
  });

  describe("elevator/floor wiring", () => {
    it("triggers entrance_available on all idle elevators at a floor when up button is pressed", () => {
      const simulation = new Simulation({ floors: 2, elevators: 3, spawnRate: 0 });
      simulation.applyCode({ init() {}, update() {} });

      const spies = simulation.elevators.map((elevator) => {
        const spy = jasmine.createSpy("entrance_available");
        elevator.on("entrance_available", spy);
        return spy;
      });

      simulation.floors[0].pressUpButton();
      simulation.elevators.forEach((e) => e.updateElevatorMovement(0.5));

      spies.forEach((spy, i) => {
        expect(spy).withContext(`elevator ${i}`).toHaveBeenCalled();
      });
    });

    it("passengers reconsider boarding when elevator indicator changes while stopped at their floor", () => {
      const simulation = new Simulation({ floors: 2, elevators: 1, spawnRate: 0 });

      simulation.applyCode({
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

      simulation.spawnPassenger({ fromFloor: 1, toFloor: 0 });

      simulation.runFor(10);

      expect(simulation.transportedCount()).toBe(1);
    });
  });

  describe("challenge conditions", () => {
    describe("requirePassengerCountWithinTime", () => {
      it("passes when enough passengers are transported before the time limit", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinTime(1, 60)
        });

        simulation.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(true);
      });

      it("fails when not enough passengers are transported before the time limit", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinTime(1, 60)
        });

        simulation.applyCode({
          init() {}, // elevator does nothing
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(false);
      });
    });

    describe("requirePassengerCountWithinMoves", () => {
      it("passes when enough passengers are transported within the move limit", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinMoves(1, 2)
        });

        simulation.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(true);
      });

      it("fails when the move limit is exceeded before enough passengers are transported", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinMoves(1, 1)
        });

        simulation.applyCode({
          init(elevators, floors) {
            floors[2].on("down_button_pressed", () => {
              // wastes a move going to floor 1 before picking up the passenger on floor 2
              elevators[0].goToFloor(1);
              elevators[0].goToFloor(2);
              elevators[0].goToFloor(0);
            });
          },
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 2, toFloor: 0 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(false);
      });
    });

    describe("requirePassengerCountWithMaxWaitTime", () => {
      it("passes when enough passengers are transported within the max wait time", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithMaxWaitTime(1, 60)
        });

        simulation.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(true);
      });

      it("fails when a passenger waits longer than the max wait time even if eventually transported", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithMaxWaitTime(1, 1)
        });

        let elapsed = 0;
        let responded = false;

        simulation.applyCode({
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

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(false);
      });
    });

    describe("requirePassengerCountWithinTimeWithMaxWaitTime", () => {
      it("passes when enough passengers are transported within time and max wait time", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinTimeWithMaxWaitTime(1, 60, 60)
        });

        simulation.applyCode({
          init(elevators) {
            elevators[0].goToFloor(0);
            elevators[0].goToFloor(2);
          },
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(true);
      });

      it("fails when not enough passengers are transported before the time limit", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinTimeWithMaxWaitTime(1, 60, 60)
        });

        simulation.applyCode({
          init() {}, // elevator does nothing
          update() {}
        });

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(false);
      });

      it("fails when a passenger waits longer than the max wait time even if eventually transported", () => {
        const simulation = new Simulation({
          floors: 3, elevators: 1, spawnRate: 0,
          condition: requirePassengerCountWithinTimeWithMaxWaitTime(1, 60, 1)
        });

        let elapsed = 0;
        let responded = false;

        simulation.applyCode({
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

        simulation.spawnPassenger({ fromFloor: 0, toFloor: 2 });

        simulation.runUntilComplete();

        expect(simulation.passed()).toBe(false);
      });
    });
  });
});

