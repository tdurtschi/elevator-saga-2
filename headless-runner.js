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
import Simulation from './src/simulation/Simulation.js';
import { getCodeObjFromCode } from './src/libs/util.js';

export async function runChallenge(challengeIndex, solutionCode) {
    const challenge = challenges[challengeIndex];
    const opts = challenge.options;
    const codeObj = await getCodeObjFromCode(solutionCode);
    const sim = new Simulation({
        floors: opts.floorCount,
        elevators: opts.elevatorCount,
        spawnRate: opts.spawnRate,
        elevatorCapacities: opts.elevatorCapacities,
        condition: challenge.condition,
    });

    sim.applyCode(codeObj);
    sim.runUntilComplete();

    const { evaluate: _evaluate, description: _description, ...conditionData } = challenge.condition;
    return {
        passed: sim.passed(),
        condition: conditionData,
        transported: sim.transportedCount(),
        elapsed: sim.elapsedTime(),
        maxWaitTime: sim.maxWaitTime(),
        moveCount: sim.moveCount(),
        challengeEnded: sim.isEnded(),
    };
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
        const result = await runChallenge(challengeIndex, code);
        console.log(formatResult(challengeIndex, result));
    } else {
        for (let i = 0; i < challenges.length; i++) {
            const result = await runChallenge(i, code);
            console.log(formatResult(i, result));
            if (!result.passed) break;
        }
    }
}
