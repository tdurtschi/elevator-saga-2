#!/usr/bin/env node
/**
 * Headless challenge runner — no browser required.
 *
 * Single challenge:
 *   node headless-runner.js --challenge 1 solution.js
 *   Output: one line of JSON with the result.
 *
 * Campaign mode (no --challenge):
 *   node headless-runner.js solution.js
 *   Runs challenges 1, 2, 3... stopping when one fails or all pass.
 *   Output: one line of JSON per challenge.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { challenges } from './src/challenges/challenges.js';
import { createWorldCreator, createWorldController } from './src/simulation/world.js';
import { getCodeObjFromCode } from './src/libs/util.js';
import { createSyncTicker } from './src/ticker.js';
import { createSeededMathRandom } from './src/libs/seeded-random.js';

export function runChallenge(challengeIndex, solutionCode, options = {}) {
    const challenge = challenges[challengeIndex];
    const codeObj = getCodeObjFromCode(solutionCode);
    const worldOptions = options.seed !== undefined
        ? { ...challenge.options, seed: options.seed }
        : challenge.options;
    const world = createWorldCreator().createWorld(worldOptions);
    const worldController = createWorldController(1 / 60);

    world.on('stats_changed', function () {
        if (challenge.condition.evaluate(world) !== null) {
            world.challengeEnded = true;
        }
    });

    const ticker = createSyncTicker();
    worldController.start(world, codeObj, ticker, true);

    // For seeded runs, also replace Math.random so lodash (elevator.js) and
    // user.js animation calls are deterministic. The ticker runs synchronously,
    // so we can safely restore Math.random immediately after.
    let savedMathRandom;
    if (options.seed !== undefined) {
        savedMathRandom = Math.random;
        Math.random = createSeededMathRandom(options.seed);
    }
    ticker.run();
    if (savedMathRandom !== undefined) {
        Math.random = savedMathRandom;
    }

    const { evaluate: _evaluate, description: _description, ...conditionData } = challenge.condition;
    const result = {
        passed: challenge.condition.evaluate(world) === true,
        condition: conditionData,
        transported: world.transportedCounter,
        elapsed: world.elapsedTime,
        maxWaitTime: world.maxWaitTime,
        moveCount: world.moveCount,
        challengeEnded: world.challengeEnded,
    };
    if (options.seed !== undefined) {
        result.frozen = true;
    }
    return result;
}

function formatResult(challengeIndex, result) {
    return JSON.stringify({
        challenge: challengeIndex + 1,
        passed: result.passed,
        condition: result.condition,
        transported: result.transported,
        elapsed: Math.round(result.elapsed),
        maxWaitTime: parseFloat(result.maxWaitTime.toFixed(1)),
        moveCount: result.moveCount,
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const challengeFlagIndex = args.indexOf('--challenge');
    const hasChallengeFlag = challengeFlagIndex !== -1;
    const seedFlagIndex = args.indexOf('--seed');
    const hasSeedFlag = seedFlagIndex !== -1;

    let challengeIndex;
    let solutionPath;
    let runOptions = {};

    const flagIndices = new Set();
    if (hasChallengeFlag) {
        flagIndices.add(challengeFlagIndex);
        flagIndices.add(challengeFlagIndex + 1);
        challengeIndex = parseInt(args[challengeFlagIndex + 1], 10) - 1;
    }
    if (hasSeedFlag) {
        flagIndices.add(seedFlagIndex);
        flagIndices.add(seedFlagIndex + 1);
        runOptions.seed = parseInt(args[seedFlagIndex + 1], 10);
    }

    solutionPath = args.find((a, i) => !flagIndices.has(i));

    if (!solutionPath) {
        console.error('Usage: node headless-runner.js [--challenge N] [--seed N] <solutionFile>');
        process.exit(1);
    }

    if (hasChallengeFlag && (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length)) {
        console.error(`Challenge must be between 1 and ${challenges.length}`);
        process.exit(1);
    }

    const code = readFileSync(solutionPath, 'utf8');

    if (hasChallengeFlag) {
        const result = runChallenge(challengeIndex, code, runOptions);
        console.log(formatResult(challengeIndex, result));
    } else {
        for (let i = 0; i < challenges.length; i++) {
            const result = runChallenge(i, code, runOptions);
            console.log(formatResult(i, result));
            if (!result.passed) break;
        }
    }
}
