/**
 * Ticker implementations for the animation loop.
 *
 * A ticker is a function with the signature: (callback: (timestamp: number) => void) => void
 * ChallengeController calls ticker(updater) to schedule the next frame.
 *
 * rafTicker    — production: delegates to window.requestAnimationFrame
 * createSyncTicker — test: runs the loop synchronously (no browser needed)
 */

export const rafTicker = (callback) => window.requestAnimationFrame(callback);

/**
 * Returns a synchronous ticker for headless use.
 *
 * @param {number} dtMs       - Simulated milliseconds per step (default: 1000/60 ≈ 16.7ms)
 * @param {number} maxSteps   - Safety limit to prevent infinite loops (default: 360000 = ~100 min at 60fps)
 *
 * Usage (in challenge-controller.spec.js):
 *   const ticker = createSyncTicker();
 *   // pass as ticker param to createChallengeController
 *   ticker.run();
 */
export function createSyncTicker(dtMs = 1000 / 60, maxSteps = 360000) {
    let pending = null;
    let steps = 0;

    function ticker(callback) {
        if (steps < maxSteps) {
            pending = callback;
        }
    }

    ticker.run = function () {
        let t = 0;
        while (pending !== null && steps < maxSteps) {
            const cb = pending;
            pending = null;
            t += dtMs;
            cb(t);
            steps++;
        }
    };

    return ticker;
}
