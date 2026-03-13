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

## Architecture direction

### Riot.js removal (in progress)
Removing riot.js in two steps:
- **Step 1 (done):** Replace `riot.render()` and `<script type="text/template">` tags with vanilla JS template literals in `presenters.js`
- **Step 2 (todo):** Replace `riot.observable()` and `riot.route()` with vanilla `EventTarget` or a small native pub/sub

### General
- Prefer vanilla JS / direct DOM over jQuery where possible when writing new code
- The long-term goal is a reactive UI layer driven by a `Ticker` abstraction — see `TODO.md` for the full roadmap
