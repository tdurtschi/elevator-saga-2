# Elevator Saga — Player API Guide

## Your code structure

You export an object with two functions:

```js
({
    init: function(elevators, floors) {
        // Set up event listeners. Runs once at challenge start.
    },
    update: function(dt, elevators, floors) {
        // Called every simulation tick. dt = elapsed seconds since last tick.
        // Fine for polling, but event-driven code in init is usually enough.
    }
})
```

---

## Elevator API

| Method / Property | Description |
|---|---|
| `elevator.goToFloor(n)` | Queue floor `n` at the back |
| `elevator.goToFloor(n, true)` | Insert floor `n` at the front (jump the queue) |
| `elevator.destinationQueue` | Array of queued floors — readable and writable |
| `elevator.checkDestinationQueue()` | Call after manually editing the queue |
| `elevator.currentFloor()` | Current floor number |
| `elevator.loadFactor()` | `0.0` (empty) – `1.0` (full) |
| `elevator.goingUpIndicator(bool?)` | Get or set the up indicator |
| `elevator.goingDownIndicator(bool?)` | Get or set the down indicator |

### Elevator events

```js
elevator.on('idle', function() { ... })
// Fires when destinationQueue empties. Good place to send the elevator somewhere useful.

elevator.on('floor_button_pressed', function(floorNum) { ... })
// A passenger inside pressed a destination button.

elevator.on('passing_floor', function(floorNum, direction) { ... })
// Elevator is about to pass a floor mid-journey. Use goToFloor(floorNum, true) to stop.

elevator.on('stopped_at_floor', function(floorNum) { ... })
// Elevator has stopped and doors are open.
```

---

## Floor API

```js
floor.floorNum()  // returns the floor's index (0 = ground floor)

floor.isButtonActivated('up')    // true if the up call button is currently lit
floor.isButtonActivated('down')  // true if the down call button is currently lit

floor.on('up_button_pressed', function() { ... })
floor.on('down_button_pressed', function() { ... })
```

---

## How the simulation works

**Floor buttons fire once.** `up_button_pressed` only fires when the button transitions from unpressed → pressed. It won't fire again while it's still lit. If you ignore a call, you won't get a reminder — those passengers are stuck until an elevator shows up.

**Direction indicators control boarding.** When an elevator stops at a floor, passengers only board if the elevator's indicator matches the direction they want to travel. `goingUpIndicator(true)` + `goingDownIndicator(true)` means everyone boards regardless of direction.

**Floor buttons clear on arrival.** When an elevator stops at a floor, the up button clears if `goingUpIndicator` is true, and the down button clears if `goingDownIndicator` is true. After clearing, the next person who arrives and presses the button will fire the event again.

**Move count** increments each time an elevator travels to a new floor. Challenges with a move limit penalise unnecessary repositioning.

---

## Tips

- **Listen to floor buttons, not just elevator buttons.** Reacting to `up_button_pressed` / `down_button_pressed` is how you dispatch elevators proactively.
- **Use `passing_floor` to pick up on the way.** If an elevator is already heading past a floor with a pending call, stop there for free instead of sending a second elevator.
- **Don't move idle elevators unnecessarily** — it wastes time on time challenges and wastes moves on move challenges. Stay put if there's nothing to do.
- **Avoid sending two elevators to the same floor.** Check `destinationQueue` across all elevators before dispatching.
- **Set direction indicators before arrival.** Passengers decide whether to board based on what the indicator says when the doors open.
