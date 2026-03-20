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
import { fileURLToPath } from 'url';
import { challenges } from './challenges.js';
import { createWorldCreator, createWorldController } from './world.js';
import { getCodeObjFromCode } from './util.js';
import { createSyncTicker } from './ticker.js';

export function runChallenge(challengeIndex, solutionCode) {
    const challenge = challenges[challengeIndex];
    const codeObj = getCodeObjFromCode(solutionCode);
    const world = createWorldCreator().createWorld(challenge.options);
    const worldController = createWorldController(1 / 60);

    world.on('stats_changed', function () {
        if (challenge.condition.evaluate(world) !== null) {
            world.challengeEnded = true;
        }
    });

    const ticker = createSyncTicker();
    worldController.start(world, codeObj, ticker, true);
    ticker.run();

    return {
        passed: challenge.condition.evaluate(world) === true,
        transported: world.transportedCounter,
        elapsed: world.elapsedTime,
        maxWaitTime: world.maxWaitTime,
        moveCount: world.moveCount,
        challengeEnded: world.challengeEnded,
    };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
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

    const result = runChallenge(challengeIndex, readFileSync(solutionPath, 'utf8'));
    console.log(JSON.stringify({
        challenge: challengeIndex + 1,
        passed: result.passed,
        transported: result.transported,
        elapsed: Math.round(result.elapsed),
        maxWaitTime: parseFloat(result.maxWaitTime.toFixed(1)),
        moveCount: result.moveCount,
    }));
}
