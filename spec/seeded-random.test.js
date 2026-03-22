import { createSeededRandom } from "../src/libs/seeded-random.js";

describe("createSeededRandom", function () {
    it("returns the same sequence for the same seed", function () {
        const r1 = createSeededRandom(42);
        const r2 = createSeededRandom(42);
        for (let i = 0; i < 20; i++) {
            expect(r1(0, 100)).toEqual(r2(0, 100));
        }
    });

    it("returns different sequences for different seeds", function () {
        const r1 = createSeededRandom(1);
        const r2 = createSeededRandom(2);
        const seq1 = Array.from({ length: 10 }, () => r1(0, 1000));
        const seq2 = Array.from({ length: 10 }, () => r2(0, 1000));
        expect(seq1).not.toEqual(seq2);
    });

    it("returns integers in the range [lower, upper]", function () {
        const r = createSeededRandom(99);
        for (let i = 0; i < 100; i++) {
            const v = r(3, 7);
            expect(v).toBeGreaterThanOrEqual(3);
            expect(v).toBeLessThanOrEqual(7);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    it("accepts a single argument as upper bound (lower defaults to 0)", function () {
        const r = createSeededRandom(7);
        for (let i = 0; i < 100; i++) {
            const v = r(5);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(5);
        }
    });
});
