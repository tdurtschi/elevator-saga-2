# Workflow

## Test guidance
**For UI/rendering changes:** use Playwright specs asserting on DOM structure/behavior.
**For logic/pure function changes:** use Jasmine unit tests.

Tests also serve as regression guards during refactors — write characterization tests first if the behavior isn't already covered.

## Running tests

`npm run test` - Executes Jasmine unit tests and Playwright e2e tests. Playwright uses the `list` reporter so results print to stdout.
`npm run ci` — Runs lint and full test suite (must pass before committing).

# Architecture

## General
- Prefer vanilla JS / direct DOM over jQuery where possible when writing new code
- The long-term goal is a reactive UI layer driven by a `Ticker` abstraction — see `TODO.md` for the full roadmap

# Game mechanics reference

See `docs/PLAYER_API.md` for a full description of the elevator/floor API and how the simulation works (boarding logic, direction indicators, floor button firing behaviour). Useful context when working on anything that touches the game's user-facing behaviour.

## Headless runner
`headless-runner.js` runs challenges without a browser. Two modes:
- `node headless-runner.js example-solution.js` — campaign mode, runs challenges 1, 2, 3… stopping on first failure. Loads game from 'example-solution.js'.
- `node headless-runner.js --challenge 1 example-solution.js` — run a single challenge.
