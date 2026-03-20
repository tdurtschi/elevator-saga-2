# Claude Code Guidelines

## Workflow

### TDD for refactoring
When refactoring UI rendering or other observable behavior, write Playwright tests first to pin the current output before touching any code. This gives a regression guard that catches breakage during the refactor. The pattern:
1. Write a Playwright spec asserting on the DOM structure / behavior
2. Run it to confirm it passes (characterizes existing behavior)
3. Do the refactor
4. Run the spec again — it should still pass

### Committing
Commit after each logical unit of work (e.g. one template refactored + its test). Keep commits small and focused.

### Headless runner
`headless-runner.js` runs challenges without a browser. Two modes:
- `node headless-runner.js --challenge 1 solution.js` — run a single challenge, outputs one line of JSON
- `node headless-runner.js solution.js` — campaign mode, runs challenges 1, 2, 3… stopping on first failure

Useful for quickly validating elevator solutions or testing simulation changes.

## Architecture direction

### General
- Prefer vanilla JS / direct DOM over jQuery where possible when writing new code
- The long-term goal is a reactive UI layer driven by a `Ticker` abstraction — see `TODO.md` for the full roadmap

## Game mechanics reference

See `PLAYER_API.md` for a full description of the elevator/floor API and how the simulation works (boarding logic, direction indicators, floor button firing behaviour). Useful context when working on anything that touches the game's user-facing behaviour.
