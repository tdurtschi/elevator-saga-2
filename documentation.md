# Elevator Saga — Help and API documentation

## About the game

This is a game of programming!

Your task is to program the movement of elevators, by writing a program in [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide).

The goal is to transport people in an efficient manner. Depending on how well you do it, you can progress through the ever more difficult challenges. Only the very best programs will be able to complete all the challenges.

## How to play

Enter your code in the input window below the game view, and press the **Apply** button to start the challenge.

You can increase or decrease the speed of time by pressing the + and - buttons.

If your program contains an error, you can use the developer tools in your web browser to try and debug it. If you want to start over with the code, press the **Reset** button. This will revert the code to a working but simplistic implementation.

If you have a favorite text editor, such as [Sublime Text](http://www.sublimetext.com/), feel free to edit the code there and paste it into the game editor.

Your code is automatically saved in your local storage, so it won't disappear if you accidentally close the browser.

## Basics

Your code must declare an object containing at least two functions called `init` and `update`. Like this:

```js
/** @type {Solution} */
({
    init: function(elevators, floors) {
        // Do stuff with the elevators and floors, which are both arrays of objects
    },
    update: function(dt, elevators, floors) {
        // Do more stuff with the elevators and floors
        // dt is the number of game seconds that passed since the last time update was called
    }
})
```

These functions will then be called by the game during the challenge. `init` will be called when the challenge starts, and `update` repeatedly during the challenge.

Normally you will put most of your code in the `init` function, to set up event listeners and logic.

## Code examples

### How to control an elevator

```js
elevator.goToFloor(1);
```

Tell the elevator to move to floor 1 after completing other tasks, if any. Note that this will have no effect if the elevator is already queued to go to that floor.

```js
if (elevator.currentFloor() > 2) { ... }
```

`currentFloor` gets the floor number that the elevator currently is on. Note that this is a rounded number and does not necessarily mean the elevator is in a stopped state.

### Listening for events

It is possible to listen for events, like when stopping at a floor, or when a button has been pressed.

```js
elevator.on("idle", function() { elevator.goToFloor(0); });
```

Listen for the `idle` event issued by the elevator, when the task queue has been emptied and the elevator is doing nothing. In this example we tell it to move to floor 0.

```js
elevator.on("floor_button_pressed", function(floorNum) { ... } );
```

Listen for the `floor_button_pressed` event, issued when a passenger pressed a button inside the elevator. This indicates that the passenger wants to go to that floor.

```js
floor.on("up_button_pressed", function() { ... } );
```

Listen for the `up_button_pressed` event, issued when a passenger pressed the up button on the floor they are waiting on.

## API documentation

### Elevator object

- `goToFloor(floorNumber[, immediately])` — Queue the elevator to go to a floor. If `true` is passed as second argument, the elevator will go to that floor directly, then continue with any other queued floors.

```js
elevator.goToFloor(3); // Do it after anything else
elevator.goToFloor(2, true); // Do it before anything else
```

- `stop()` — Clear the destination queue and stop the elevator (advanced; usually not required).

- `currentFloor()` — Gets the floor number that the elevator currently is on.

- `goingUpIndicator()` / `goingDownIndicator()` — Get or set the indicators which affect passenger behavior.

- `maxPassengerCount()` — Gets the maximum number of passengers for the elevator.

- `loadFactor()` — Gets load factor (0 empty, 1 full). Varies with passenger weights.

- `destinationDirection()` — Gets the current moving direction: `"up"`, `"down"` or `"stopped"`.

- `destinationQueue` — An array of floor numbers the elevator is scheduled to go to. If you modify it directly, call `checkDestinationQueue()` to apply changes.

```js
elevator.destinationQueue = [];
elevator.checkDestinationQueue();
```

- `checkDestinationQueue()` — Call this after modifying `destinationQueue` explicitly.

- `getPressedFloors()` — Returns an array of currently pressed floor numbers inside the elevator.

#### Elevator events

- `idle` — Triggered when the elevator has completed all tasks.

- `floor_button_pressed` — When a passenger presses a destination floor button inside the elevator.

- `passing_floor` — Triggered slightly before the elevator will pass a floor. Useful to decide whether to stop. Direction is `"up"` or `"down"`.

- `stopped_at_floor` — Triggered when the elevator has arrived at a floor.

### Floor object

- `floorNum()` — Gets the floor number of the floor object.

#### Floor events

- `up_button_pressed` — Triggered when someone presses the up button at a floor.

- `down_button_pressed` — Triggered when someone presses the down button at a floor.

---

Created by Magnus Wolffelt, community maintained

Version 2.0.0

Source: https://github.com/tdurtschi/elevator-saga-2

