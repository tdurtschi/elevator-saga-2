Riot.js Library API Documentation
=================================

Overview
--------

Riot.js is a JavaScript library for managing DOM events with an observable pattern. It allows developers to attach event listeners, remove them, and trigger events easily.

Public API
----------

### riot.observable()

Description

Creates an observable instance from a given element.

Syntax

```js
const observable = riot.observable(element);
```

Parameters

- element: The DOM element to make observable.

Returns

- An observable instance.

### observable.on(events, fn)

Description

Adds an event handler to the observable.

Syntax

```js
observable.on(events, fn);
```

Parameters

- events: A string or array of event names.
- fn: The event handler function.

Returns

- The observable instance.

Notes

- fn is called when the specified event is triggered.
- events can be a string (like 'click') or an array (like ['click', 'mouseover']).
- You can specify typed events by separating the event name from the callback with a space (e.g., 'click typed').

### observable.off(events, fn)

Description

Removes an event handler from the observable.

Syntax

```js
observable.off(events, fn);
```

Parameters

- events: A string or array of event names.
- fn: The event handler function (optional).

Returns

- The observable instance.

Notes

- If fn is provided, it removes the handler specifically for that function.
- If events is a string and fn is not provided, all handlers for that event are removed.

### observable.one(name, fn)

Description

Adds a one-time event handler to the observable.

Syntax

```js
observable.one(name, fn);
```

Parameters

- name: The event name.
- fn: The event handler function.

Returns

- The observable instance.

Notes

- The event handler will be removed after it's called once.
- The event handler is automatically registered as a one-time handler.

### observable.trigger(name)

Description

Triggers the specified event on the observable instance.

Syntax

```js
observable.trigger(name);
```

Parameters

- name: The event name to trigger.

Returns

- The observable instance.

Notes

- This method is designed to be used internally. If you want to trigger an event, use on with a callback that calls trigger.

### riot.render()

Description

Renders a template into a string.

Syntax

```js
const rendered = riot.render(tmpl, data, escapeFn);
```

Parameters

- tmpl: The template string.
- data: The data object to render the template with.
- escapeFn: An optional function to escape the template or data before rendering.

Returns

- The rendered string.

Notes

- Default escaping is available as a no-argument option.
- The rendered template is a JavaScript function that can be executed to render the data.

### riot.route()

Description

Triggers a pop state event with the given URL.

Syntax

```js
riot.route(to);
```

Parameters

- to: The URL to navigate to.

Returns

- The observable instance.

Notes

- Use pop method to actually trigger the pop state event.
- This is primarily for popstate events to allow navigating back in a browser.

### riot.pop()

Description

Triggers a pop state event with the given URL.

Syntax

```js
riot.pop(hash);
```

Parameters

- hash: The hash string to navigate to.

Returns

- The observable instance.

Notes

- This is primarily for popstate events to allow navigating back in a browser.

Examples
--------

### Basic Observable Usage

```js
// Create observable instance
const observable = riot.observable(document.getElementById('myEl'));

// Add event listener
observable.on('click', function() {
  console.log('Clicked!');
});

// Trigger event
observable.trigger('click');

// Remove event listener
observable.off('click');
```

### One-Time Event

```js
// Create one-time event handler
observable.one('change', function() {
  console.log('Changed!');
});

// Trigger event
observable.trigger('change');

// Remove event handler (by default)
// observable.off('change', this.handler);
```

### Template Rendering

```js
// Define a template
const tmpl = "Hello, {{name}}!";

// Render template
const rendered = riot.render(tmpl, { name: 'Alice' });

// Use rendered function to render data
const result = rendered({ name: 'Bob' });
console.log(result); // Output: "Hello, Bob!"
```

### Route Navigation

```js
// Define route handler
function handlePop(hash) {
  console.log(hash);
}

// Start navigating
riot.route(handlePop);

// Navigate to new URL
riot.route('https://www.example.com');
```

Use Cases
---------

- UI Event Handling: Use Riot.js to simplify DOM event handling, reducing boilerplate code.
- Data Rendering: Use riot.render to efficiently render templates and data.
- Navigation: Use riot.route to handle popstate navigation and route management.

License
-------

This library is licensed under the MIT license. For full license text, see the LICENSE file included in the distribution.