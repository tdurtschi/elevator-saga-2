Riot.js (local lightweight utilities) - Prepared using AI
====================================

This project includes a frozen, minimal copy of the historical Riot 1.0.2 utility layer in libs/riot.js. It does not include Riot’s modern component system — only three tiny, framework‑agnostic primitives:

- riot.observable(obj): Event emitter mixin for plain objects
- riot.render(tmpl, data, escape?): Micro string templating
- riot.route(toOrListener): Hash/popstate routing helper

These helpers are used throughout Elevator Saga 2 to wire up model objects (floors, elevators, world) with UI rendering and simple routing.


Getting started
---------------

In this repo the module is loaded once at app startup:

  import "./libs/riot.js"; // defines window.riot in the browser

After that, use the global riot object:

  // Make any object observable (able to emit/listen for events)
  const bus = riot.observable({});
  bus.on("tick", (t) => console.log("tick", t));
  bus.trigger("tick", 42);

  // Render a tiny template string
  const html = riot.render("<h1>Hello {name}</h1>", { name: "World" });

  // Listen to route changes (browser only)
  riot.route((hash) => console.log("route changed:", hash));

Node/testing usage: tests create a JSDOM window and require libs/riot.js; it attaches riot to window.riot and thus to global.riot in tests (see test/helpers/setup.cjs).


Module structure at a glance
----------------------------

File: libs/riot.js (120 LOC)

- IIFE that creates/exports a riot namespace on window (browser) or exports (CommonJS), with three APIs:
  - riot.observable(el)
  - riot.render(tmpl, data, escapeFn?)
  - riot.route(toOrListener)
- Minimal internal helpers:
  - A precompiled function cache for templates (FN)
  - A default HTML escape function for rendering
  - A cross‑browser popstate/hash observer for routing


API reference and examples
--------------------------

1) riot.observable(obj)

Mixes event emitter methods into obj and returns it. New methods added:

- on(events, fn): Register a listener for one or more space‑separated event names.
  - If the same callback is registered for multiple events in one call, the callback receives the event name as the first argument for the second and subsequent event names (typed listeners). Example below.
- off(events, fn?): Remove listeners.
  - off("*") removes all listeners.
  - off("name", fn) removes a specific handler for a single event.
  - off("name1 name2") clears the handler arrays for those events.
- one(event, fn): Like on, but the handler is removed after the first call.
- trigger(event, ...args): Emit an event with arguments.

Behavior details and edge cases:

- Self‑removal is safe: a handler may call off inside itself; iteration logic accounts for this.
- Handlers are protected from reentrancy with a temporary busy flag; a handler won’t run recursively if trigger causes the same handler to fire again before it returns.
- Typed listeners: When you pass multiple space‑separated events in a single on call (e.g., on("a b", fn)), the function will receive the event name as its first argument for events after the first. Example:

  const o = riot.observable({});
  o.on("connected disconnected", function(name, info) {
    // For "connected" => name will be the event name only when registered at position > 0.
    // In practice, rely on the second event getting the name injected.
    console.log("event:", name, info);
  });
  o.trigger("connected", { id: 1 });
  o.trigger("disconnected", { id: 1 });

Common patterns in this codebase:

- World/elevator/floor/user models are made observable to broadcast state changes, e.g. world.on("stats_display_changed", ...), elevator.on("new_display_state", ...), etc.


2) riot.render(tmpl, data, escapeFnOrTrue?)

Minimal string template renderer with cached compilation.

Syntax:

- Placeholders: { path } where path is an identifier or dotted path, e.g., {user.name}
- Escaping: If escape argument is true, default HTML escaping is applied via a callback for each substitution. You may also pass a custom escape function of the form fn(value, keyPath) that returns the string to insert.

Signature:

  riot.render(tmpl: string, data?: object, escape?: true | (val, keyPath) => string): string

Examples:

  riot.render("<div>{greet}, {user.name}!</div>", { greet: "Hello", user: { name: "Ada" } });
  // => "<div>Hello, Ada!</div>"

  // Enable default HTML escaping
  riot.render("<p>{bio}</p>", { bio: "<script>bad()</script>" }, true);
  // => "<p>&lt;script&gt;bad()&lt;/script&gt;</p>"

  // Custom escape function
  const upper = (v) => String(v).toUpperCase();
  riot.render("Hi {name}", { name: "Ada" }, upper);
  // => "Hi ADA"

Notes:

- Missing values become an empty string.
- Dotted paths are resolved directly from the data object.
- Templates are compiled once and cached by the template string value (FN cache).

Usage in Elevator Saga 2:

- presenters.js uses riot.render with template strings embedded in index.html to build DOM for floors, elevators, users, and UI chrome.


3) riot.route(toOrListener)

Tiny router that emits a "pop" event whenever the browser hash/location changes. Two modes:

- Listener mode: pass a function to subscribe to route changes.

  riot.route(function onPop(hash) {
    console.log("route changed to:", hash);
  });

- Navigate/fire mode: pass a string path to update the URL (history.pushState if available) and emit the pop event.

  riot.route("#/challenge/3");

Behavior details:

- On page load, a pop event is fired to normalize behavior across browsers.
- Uses window.addEventListener("popstate") when available; older IE shims DOMContentLoaded/onreadystatechange.
- The handler receives the current location.hash (or the passed string) as its argument.

Usage in Elevator Saga 2:

- app.js registers riot.route((path) => { ... }) to respond to navigation between views/modes.


How it fits into Elevator Saga’s architecture
--------------------------------------------

- Eventing (observable): The simulation entities (world, floors, elevators, users) are plain objects/enhanced with riot.observable. They emit domain events like:
  - world: "stats_display_changed", "new_user"
  - elevator: "new_display_state", "new_current_floor", "floor_buttons_changed", "indicatorstate_change"
  - user: "new_display_state", "removed"
  Presenters subscribe to these to update the DOM efficiently without a virtual DOM.

- Rendering (render): The UI is generated from simple HTML templates (script type="text/template") in index.html. presenters.js calls riot.render(template, data) and injects the result into the DOM via jQuery.

- Routing (route): The app hooks into browser history changes to switch views or restart challenges. Minimal, no nested routes.

Why this tiny Riot layer?

- Zero dependencies at runtime, tiny footprint, and sufficient for the game’s event‑driven UI.
- Stable, frozen code avoids churn; we retain only the parts we use.


Reference of behaviors and caveats
----------------------------------

- observable.on accepts multiple events separated by spaces. The listener’s fn.typed flag is set for events at position > 0, which causes trigger to inject the event name as the first argument for those calls. If you need the event name reliably, register separate handlers per event or check the first argument you receive.
- observable.one marks the function with fn.one = true; after it runs once it is removed.
- observable.off("*") clears all callbacks. Be cautious in shared objects.
- render escaping: Passing true as the third argument uses a default HTML escape map for &, ", <, >. To escape backslashes/newlines/quotes inside templates, the compiler already handles them; you do not need to pre‑escape template strings in normal usage.
- route requires a browser environment. In tests, JSDOM provides window and document so that libs/riot.js can initialize; route listeners will run, but no real history.


Quick recipes
-------------

- Debounced save with observable:

  const model = riot.observable({ text: "" });
  const save = _.debounce(() => console.log("saved", model.text), 500);
  model.on("change", save);
  model.text = "hi"; model.trigger("change");

- One‑time initialization:

  app.one("ready", () => console.log("once"));
  app.trigger("ready"); // logs
  app.trigger("ready"); // no‑op

- Simple view rendering:

  const itemT = "<li class='item-{id}'>{name}</li>";
  listEl.innerHTML = items.map(i => riot.render(itemT, i)).join("");


Changelog and version
---------------------

- Embedded version: Riot 1.0.2 utilities (c) 2014 Muut Inc + contributors, MIT license. Only the utilities in libs/riot.js are included. The upstream project is unmaintained; this copy is frozen for stability.


License
-------

The embedded code retains its MIT license header. This documentation is also MIT‑licensed as part of Elevator Saga 2.
