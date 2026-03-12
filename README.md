# Elevator Saga 2

The elevator programming game. [Play it now!](https://tdurtschi.github.io/elevator-saga-2/)

Based on the original [Elevator Saga](https://github.com/magwo/elevatorsaga) by magwo.

---

## What is this?

Elevator Saga 2 is a browser-based programming game where you write JavaScript to control elevators. Your code must efficiently transport passengers between floors, meeting challenge conditions like transporting N users within a time limit or with minimal elevator moves.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build | Vite 5.4 |
| UI templating | Riot.js |
| Code editor | Monaco Editor (via CDN) |
| AI (local) | WebLLM (`@mlc-ai/web-llm`) |
| AI (cloud) | OpenAI API |
| Unit tests | Jasmine 5.1 |
| E2E tests | Playwright 1.52 |
| Utilities | jQuery 2, Lodash 3.6 |

---

## Features

- **19 progressive challenges** — increasing difficulty across transport count, time, and move constraints
- **Real-time simulation** — physics-based elevator movement with acceleration and deceleration
- **Monaco editor** — full IDE experience with TypeScript type definitions for autocomplete
- **AI code generation** — describe your strategy in plain English; local (WebLLM) or cloud (OpenAI) LLM generates the code
- **Adjustable time scale** — run simulation at 1x–40x speed
- **Terminal output** — real-time logs with clear and copy buttons
- **Persistence** — code, prompts, and AI settings saved to localStorage

---

## Getting Started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

### Other scripts

```bash
npm run build     # production bundle → dist/
npm run serve     # preview build at http://localhost:3000
npm test          # Jasmine unit tests + Playwright E2E
npm run clean     # remove dist/ and node_modules/
```

---

## Architecture

### Core modules

| File | Purpose |
|---|---|
| `app.js` | Entry point — initializes editor, challenge controller, routing, UI |
| `world.js` | Simulation engine — creates floors/elevators/users, drives update loop |
| `elevator.js` | Elevator class — physics, floor tracking, passenger slots, button states |
| `floor.js` | Floor class — up/down button handling, elevator availability signals |
| `user.js` | Passenger class — movement, boarding, destination tracking |
| `interfaces.js` | Public API facade exposed to user code (`goToFloor`, events, etc.) |
| `challenges.js` | 19 challenge definitions with win/fail conditions |
| `presenters.js` | DOM rendering and event binding for elevators, floors, passengers |
| `ai.js` | LLM orchestration — WebLLM and OpenAI, model management, prompt handling |
| `persistence.js` | localStorage helpers for code, prompts, AI settings, time scale |
| `terminal-logger.js` | Timestamped log output with clear/copy controls |
| `types.js` | TypeScript definitions for Monaco editor autocomplete |
| `util.js` | Number limiting, interpolation, frame utilities, code parsing |
| `movable.js` | Base class for position tracking and animation |
| `elevator-saga-prompt.md` | System prompt used for AI code generation |

### Key patterns

- **Event-driven** — all major objects (Elevator, Floor, User, World) are observable; components communicate via `.on()` / `.trigger()`
- **Facade** — `asElevatorInterface()` and `asFloor()` wrap internals and expose a safe public API to user code
- **Physics loop** — discrete 1/60s time steps with velocity, acceleration, and distance-based deceleration; time-scaled for faster simulation
- **User code execution** — code is `eval()`'d; must export `{ init(elevators, floors), update(dt, elevators, floors) }`; errors are caught and logged to terminal

### Elevator physics constants

```
ACCELERATION  = floorHeight × 2.1
DECELERATION  = floorHeight × 2.6
MAX_SPEED     = floorHeight × 2.6 floors/sec
```

---

## Writing Elevator Code

Your code exports an object with two functions:

```js
{
  init(elevators, floors) {
    // called once at simulation start
    // set up event listeners here
  },
  update(dt, elevators, floors) {
    // called every physics frame (optional)
  }
}
```

### Elevator API

```js
elevator.goToFloor(floorNum)           // queue floor
elevator.goToFloor(floorNum, true)     // queue floor at front (priority)
elevator.destinationQueue              // array of queued floors
elevator.checkDestinationQueue()       // reprocess queue manually
elevator.currentFloor()                // current floor number
elevator.goingUpIndicator(true/false)  // set direction indicator
elevator.goingDownIndicator(true/false)
elevator.maxPassengerCount()           // capacity
elevator.loadFactor()                  // 0–1 fullness
elevator.on('idle', cb)                // no destinations queued
elevator.on('floor_button_pressed', cb, floorNum)   // passenger pressed button
elevator.on('passing_floor', cb, floorNum, direction)
elevator.on('stopped_at_floor', cb, floorNum)
```

### Floor API

```js
floor.floorNum()
floor.on('up_button_pressed', cb)
floor.on('down_button_pressed', cb)
```

---

## AI Code Generation

1. Enable AI in the UI (toggle in header)
2. Open the **Prompt** tab in the editor
3. Describe your strategy in plain English
4. Click **Generate code from prompt**
5. Generated code is inserted into the editor

**Local models (WebLLM):** runs entirely in browser, no server needed. Recommended models: Hermes-3, Llama-3.2-1B, Phi-3.5-mini, Qwen2.5-Coder-3B.

**Cloud:** configure an OpenAI API key in AI settings.

Custom system instructions can be set via the **Instructions** tab.

---

## Testing

Unit tests use Jasmine; E2E tests use Playwright (requires the preview server running):

```bash
npm run serve &   # start preview server
npm test          # run all tests
```

---

## Docs

- [Riot utility notes](docs/riot.md)

---

## Credits

- Original game: [Elevator Saga](https://github.com/magwo/elevatorsaga) by [magwo](https://github.com/magwo)
- This fork: [tdurtschi](https://github.com/tdurtschi)
