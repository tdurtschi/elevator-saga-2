#!/usr/bin/env node
/**
 * Headless challenge runner — no browser required.
 *
 * Usage:
 *   node headless-runner.js <challengeIndex> <solutionFile>
 *
 * Output: a single line of JSON with the result.
 *
 * Example:
 *   node headless-runner.js 1 solution.js
 */
import { readFileSync } from 'fs';
import { challenges } from './challenges.js';
import { createWorldCreator, createWorldController } from './world.js';
import { getCodeObjFromCode } from './util.js';
import { createSyncTicker } from './ticker.js';

const challengeIndex = parseInt(process.argv[2] || '1', 10) - 1;
const solutionPath = process.argv[3];

if (!solutionPath) {
    console.error('Usage: node headless-runner.js <challengeNumber> <solutionFile>');
    process.exit(1);
}

if (challengeIndex < 0 || challengeIndex >= challenges.length) {
    console.error(`Challenge must be between 1 and ${challenges.length}`);
    process.exit(1);
}

const challenge = challenges[challengeIndex];
const code = readFileSync(solutionPath, 'utf8');
const codeObj = getCodeObjFromCode(code);

const dtMax = 1 / 60;
const worldCreator = createWorldCreator();
const worldController = createWorldController(dtMax);
const world = worldCreator.createWorld(challenge.options);

world.on('stats_changed', function () {
    const result = challenge.condition.evaluate(world);
    if (result !== null) {
        world.challengeEnded = true;
    }
});

const ticker = createSyncTicker();
worldController.start(world, codeObj, ticker, true);
ticker.run();

const passed = challenge.condition.evaluate(world);
console.log(JSON.stringify({
    challenge: challengeIndex + 1,
    passed: passed === true,
    transported: world.transportedCounter,
    elapsed: Math.round(world.elapsedTime),
    maxWaitTime: parseFloat(world.maxWaitTime.toFixed(1)),
    moveCount: world.moveCount,
}));
