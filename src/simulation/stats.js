// Aggregates the metrics reported for a simulation run. Kept as a plain
// accumulator (no observable/event coupling) — the Simulation owns the
// elapsed clock and the stats_changed event and feeds this its inputs.
export default class Stats {
    constructor() {
        this.transportedCount = 0;
        this.transportedPerSec = 0.0;
        this.moveCount = 0;
        this.maxWaitTime = 0.0;
        this.avgWaitTime = 0.0;
    }

    recordTransport(waitTime) {
        this.transportedCount++;
        this.observeWait(waitTime);
        this.avgWaitTime = (this.avgWaitTime * (this.transportedCount - 1) + waitTime) / this.transportedCount;
    }

    observeWait(waitTime) {
        this.maxWaitTime = Math.max(this.maxWaitTime, waitTime);
    }

    recalculate(elapsedTime, elevators) {
        this.transportedPerSec = this.transportedCount / elapsedTime;
        this.moveCount = elevators.reduce((sum, e) => sum + e.moveCount, 0);
    }
}
