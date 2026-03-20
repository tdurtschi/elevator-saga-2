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

function formatResult(challengeIndex, result) {
    return JSON.stringify({
        challenge: challengeIndex + 1,
        passed: result.passed,
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

    let challengeIndex;
    let solutionPath;

    if (hasChallengeFlag) {
        challengeIndex = parseInt(args[challengeFlagIndex + 1], 10) - 1;
        solutionPath = args.find((a, i) => i !== challengeFlagIndex && i !== challengeFlagIndex + 1);
    } else {
        solutionPath = args[0];
    }

    if (!solutionPath) {
        console.error('Usage: node headless-runner.js [--challenge N] <solutionFile>');
        process.exit(1);
    }

    if (hasChallengeFlag && (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length)) {
        console.error(`Challenge must be between 1 and ${challenges.length}`);
        process.exit(1);
    }

    const code = readFileSync(solutionPath, 'utf8');

    if (hasChallengeFlag) {
        const result = runChallenge(challengeIndex, code);
        console.log(formatResult(challengeIndex, result));
    } else {
        for (let i = 0; i < challenges.length; i++) {
            const result = runChallenge(i, code);
            console.log(formatResult(i, result));
            if (!result.passed) break;
        }
    }
}
