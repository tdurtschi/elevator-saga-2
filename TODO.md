# TODO

## Playwright Tests

### Challenge failure / edge cases
- [ ] Code that compiles but fails the challenge (wrong strategy, times out)
- [ ] Code that throws a runtime error mid-simulation
- [ ] Challenge switching mid-run resets state cleanly

### Code editor behavior
- [x] Code persists across page reload (localStorage)
- [x] Applying invalid JS shows an error in the terminal
- [x] Terminal clear button works
- [x] Terminal copy button works

### Time controls
- [ ] Changing the time scale mid-simulation
- [ ] Pause/resume behavior

### Challenge progression
- [ ] Completing a challenge advances to the next one
- [ ] The challenge selector reflects current state

---

## Architecture

- [ ] Split `app.js` god class — separate Monaco initialization, localStorage, challenge state, AI hooks, and event wiring into distinct modules
- [x] Extract an `Editor` abstraction with a `getValue()`/`setValue()` interface so the editor can be swapped or mocked in tests
- [ ] Decouple `presenters.js` — pull position calculations and state logic into pure functions, separate from DOM queries

### Remove riot.js (done ✓)
- [x] **Step 1 — replace riot templating:** Remove `<script type="text/template">` tags from `index.html` and replace `riot.render()` calls in `presenters.js` with vanilla JS template literals.
- [x] **Step 2 — replace riot.observable:** Replace `riot.observable()` with `unobservable.observable()` across `app.js`, `floor.js`, `interfaces.js`, `world.js`. Replace `riot.route()` with a native hashchange handler. Delete `libs/riot.js`.

### Reactive UI layer
- [ ] Introduce a `Ticker` abstraction to replace raw `requestAnimationFrame` — injectable in tests (manual step function) vs. production (real rAF). This gives the simulation a clean clock interface that the UI can bind to, laying the groundwork for a reactive update pattern.
- [ ] Define a plain state object that the simulation writes to each tick (positions, floor indicators, stats, button states) — UI reads from it rather than wiring event listeners directly to simulation internals in `presenters.js`
- [ ] Bind vanilla DOM updates to state changes via the `Ticker` — each tick, diff and apply only what changed. No framework needed; this is the reactive pattern without the dependency.
