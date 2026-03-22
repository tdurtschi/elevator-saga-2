/**
 * Creates a Mulberry32 PRNG that returns floats in [0, 1), compatible with Math.random.
 */
export function createSeededMathRandom(seed) {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Creates a seeded pseudo-random number generator (Mulberry32 algorithm).
 * Returns a function with the same signature as _.random(lower, upper):
 *   random(upper)         → integer in [0, upper]
 *   random(lower, upper)  → integer in [lower, upper]
 */
export function createSeededRandom(seed) {
    const next = createSeededMathRandom(seed);
    return function random(lower, upper) {
        if (upper === undefined) {
            upper = lower;
            lower = 0;
        }
        return lower + Math.floor(next() * (upper - lower + 1));
    };
}
