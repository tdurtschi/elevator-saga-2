import Simulation from "../src/simulation/Simulation.js";

describe("World", () => {
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
