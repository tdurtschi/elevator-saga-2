# Claude Code Guidelines

## Workflow

### TDD
Write tests before writing code. The pattern:
1. Write a failing test that asserts the desired behavior
2. Run it to confirm it fails (red)
3. Write the minimum code to make it pass (green)
4. Consider and apply refactors while the suite stays green
5. Run `npm run ci` — lint and full test suite must pass before committing
6. Commit

**For UI/rendering changes:** use Playwright specs asserting on DOM structure/behavior.
**For logic/pure function changes:** use Jasmine unit tests.

Tests also serve as regression guards during refactors — write characterization tests first if the behavior isn't already covered.

### Committing
Commit after each logical unit of work (e.g. one template refactored + its test). Keep commits small and focused.

### Interactive workflow
Use this workflow by default, or whenever the user asks to pair or code together.
**Exploration phase** (Navigator/Driver):
- Claude navigates — pointing to files, explaining what it sees, suggesting where to look next.
- The human drives — running commands, reading code, asking questions.
- Exit when you've agreed on the next behavior to build.

**TDD phase** (follow the TDD pattern above, with human sign-off at each step):
- Agree on the test before Claude writes it.
- Agree on the implementation approach before Claude writes it.
- Nothing moves forward without the human's sign-off.

**Refactor phase**:
- Either party can propose refactors.
- Claude writes the changes.
- The human approves before committing.

**Why:** Core principle is "Claude writes everything, the human owns every decision."
**How to apply:** Use this style whenever pairing on implementation work, unless the human says otherwise.

### GitHub PR workflow
Use this workflow whenever the user asks you to use PRs or work unsupervised.
Always work on a feature branch — never commit directly to `master`. Before starting any work:
1. Create a branch: `git checkout -b fix/<issue-number>-short-description` or `feat/<issue-number>-short-description`
2. Do the work and commit on that branch
3. Run `npm run ci` — lint and full test suite must pass before opening a PR
4. Push the branch and open a PR targeting `master`, linking the relevant issue

Note: When running this workflow, take care to avoid getting stuck. It is preferable to provide an update or ask a question directly in the github issue and exit.

### Headless runner
`headless-runner.js` runs challenges without a browser. Two modes:
- `node headless-runner.js --challenge 1 example-solution.js` — run a single challenge, outputs one line of JSON
- `node headless-runner.js example-solution.js` — campaign mode, runs challenges 1, 2, 3… stopping on first failure

Useful for quickly validating elevator solutions or testing simulation changes.

## Running tests

```
npm run test
```

Runs both Jasmine unit tests and Playwright e2e tests. Playwright uses the `list` reporter so results print to stdout.

## Architecture direction

### Completed work
- **Riot.js fully removed:** `riot.render()` and `<script type="text/template">` replaced with vanilla JS template literals in `presenters.js`; `riot.observable()` replaced with `window.unobservable.observable()`; `riot.route()` replaced with a native `hashchange` handler; `libs/riot.js` deleted
- **Monaco CDN removed:** `monaco-editor` npm package installed; `editor.js` extracted from `app.js`; Vite worker config added; CDN script tag removed from `index.html`
- **Playwright tests added** covering floor, elevator, challenge, feedback, and user templates; hash routing; and editor behavior (error display, persistence, reset)

### In progress
- **Editor abstraction:** `editor.js` is extracted but still tightly coupled (jQuery, persistence, AI all imported directly) — next step is cleaning up those dependencies
- **Split `app.js`** god class

### General
- Prefer vanilla JS / direct DOM over jQuery where possible when writing new code
- The long-term goal is a reactive UI layer driven by a `Ticker` abstraction — see `TODO.md` for the full roadmap

## Game mechanics reference

See `docs/PLAYER_API.md` for a full description of the elevator/floor API and how the simulation works (boarding logic, direction indicators, floor button firing behaviour). Useful context when working on anything that touches the game's user-facing behaviour.
