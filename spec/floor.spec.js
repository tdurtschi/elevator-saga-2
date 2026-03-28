import Simulation from "../src/simulation/Simulation.js";

describe("Floor", () => {
  it("transports a user who pressed the up button when the elevator responds and stops at their floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators, floors) {
        floors[1].on("up_button_pressed", () => {
          elevators[0].goToFloor(1);
          elevators[0].goToFloor(2);
        });
      },
      update() {}
    });

    sim.spawnUser({ fromFloor: 1, toFloor: 2 });

    sim.runFor(60);

    expect(sim.transportedCount()).toBe(1);
  });

  it("clears the up button when an elevator with goingUpIndicator arrives at the floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(1);
      },
      update() {}
    });

    sim.spawnUser({ fromFloor: 1, toFloor: 2 });

    sim.runFor(60);

    expect(sim.floorButtonActivated(1, "up")).toBe(false);
  });

  it("clears the down button when an elevator with goingDownIndicator arrives at the floor", () => {
    const sim = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    sim.applyCode({
      init(elevators) {
        elevators[0].goToFloor(2);
      },
      update() {}
    });

    sim.spawnUser({ fromFloor: 2, toFloor: 0 });

    sim.runFor(60);

    expect(sim.floorButtonActivated(2, "down")).toBe(false);
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
});
