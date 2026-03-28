import Simulation from "../src/simulation/Simulation.js";

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
});
