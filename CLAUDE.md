# Claude Code Guidelines

## Workflow

### TDD
Write tests before writing code. The pattern:
1. Write a failing test that asserts the desired behavior
2. Run it to confirm it fails (red)
3. Write the minimum code to make it pass (green)
4. Consider and apply refactors while the suite stays green
5. Commit

**For UI/rendering changes:** use Playwright specs asserting on DOM structure/behavior.
**For logic/pure function changes:** use Jasmine unit tests.

Tests also serve as regression guards during refactors — write characterization tests first if the behavior isn't already covered.

### Committing
Commit after each logical unit of work (e.g. one template refactored + its test). Keep commits small and focused.

### Headless runner
`headless-runner.js` runs challenges without a browser. Two modes:
- `node headless-runner.js --challenge 1 example-solution.js` — run a single challenge, outputs one line of JSON
- `node headless-runner.js example-solution.js` — campaign mode, runs challenges 1, 2, 3… stopping on first failure

Useful for quickly validating elevator solutions or testing simulation changes.

## Architecture direction

### General
- Prefer vanilla JS / direct DOM over jQuery where possible when writing new code
- The long-term goal is a reactive UI layer driven by a `Ticker` abstraction — see `TODO.md` for the full roadmap

## Game mechanics reference

See `PLAYER_API.md` for a full description of the elevator/floor API and how the simulation works (boarding logic, direction indicators, floor button firing behaviour). Useful context when working on anything that touches the game's user-facing behaviour.
