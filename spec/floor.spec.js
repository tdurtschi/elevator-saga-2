import Simulation from "../src/simulation/Simulation.js";

describe("Floor", () => {
  it("transports a user who pressed the up button when the elevator responds and stops at their floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators, floors) {
        floors[1].on("up_button_pressed", () => {
          elevators[0].goToFloor(1);
          elevators[0].goToFloor(2);
        });
      },
      update() {}
    });

    simulation.spawnUser({ fromFloor: 1, toFloor: 2 });

    simulation.runFor(60);

    expect(simulation.transportedCount()).toBe(1);
  });

  it("clears the up button when an elevator with goingUpIndicator arrives at the floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        elevators[0].goToFloor(1);
      },
      update() {}
    });

    simulation.spawnUser({ fromFloor: 1, toFloor: 2 });

    simulation.runFor(60);

    expect(simulation.floorButtonActivated(1, "up")).toBe(false);
  });

  it("clears the down button when an elevator with goingDownIndicator arrives at the floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators) {
        elevators[0].goToFloor(2);
      },
      update() {}
    });

    simulation.spawnUser({ fromFloor: 2, toFloor: 0 });

    simulation.runFor(60);

    expect(simulation.floorButtonActivated(2, "down")).toBe(false);
  });

  it("transports a user who pressed the down button when the elevator responds and stops at their floor", () => {
    const simulation = new Simulation({ floors: 3, elevators: 1, spawnRate: 0 });

    simulation.applyCode({
      init(elevators, floors) {
        floors[2].on("down_button_pressed", () => {
          elevators[0].goToFloor(2);
          elevators[0].goToFloor(0);
        });
      },
      update() {}
    });

    simulation.spawnUser({ fromFloor: 2, toFloor: 0 });

    simulation.runFor(60);

    expect(simulation.transportedCount()).toBe(1);
  });
});
